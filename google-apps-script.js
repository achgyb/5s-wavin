/**
 * ============================================================================
 * 5S WAVIN FACTORY AUDIT - GOOGLE APPS SCRIPT BACKEND
 * ============================================================================
 * Petunjuk Pemasangan:
 * 1. Buka Google Spreadsheet database Anda (atau buat baru di Google Drive).
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 3. Hapus semua kode default di Code.gs, lalu paste seluruh isi file ini.
 * 4. Klik ikon "Simpan" (Save).
 * 5. Klik tombol "Terapkan" (Deploy) -> "Penerapan baru" (New deployment).
 *    - Jenis: Aplikasi Web (Web App)
 *    - Jalankan sebagai: Saya (Me / email Anda)
 *    - Siapa yang memiliki akses: Siapa saja (Anyone) -> SANGAT PENTING!
 * 6. Klik "Terapkan" (Deploy) dan berikan izin akses saat diminta.
 * 7. Salin URL Aplikasi Web yang diberikan (format: https://script.google.com/macros/s/.../exec)
 * 8. Masukkan URL tersebut ke Vercel Environment Variables:
 *    Key: VITE_APPS_SCRIPT_URL
 *    Value: URL Aplikasi Web tersebut
 * ============================================================================
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "5S Wavin Apps Script Backend is Running!"
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); // Tunggu sampai 30 detik untuk menghindari konflik baris
  } catch (t) {
    return respondJSON({ success: false, error: "Server sibuk. Silakan coba lagi." });
  }

  try {
    var rawBody = e.postData ? e.postData.contents : "{}";
    var payload = JSON.parse(rawBody);
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ── 1. Upload Photo ke Google Drive ─────────────────────────────────────
    if (action === "uploadPhoto") {
      var folderId = payload.folderId || "1uWXvWITRrnP9Vxa1m8eTX8Jq102-4PX2";
      var folder;
      try {
        folder = DriveApp.getFolderById(folderId);
      } catch (fErr) {
        return respondJSON({ success: false, error: "Folder Drive tidak ditemukan: " + fErr.message });
      }

      var fileName = payload.fileName || ("Photo_" + new Date().getTime() + ".jpg");
      var mimeType = payload.mimeType || "image/jpeg";
      var decodedBytes = Utilities.base64Decode(payload.base64);
      var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

      var file = folder.createFile(blob);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (pErr) {
        // Fallback jika Google Workspace organisasi membatasi sharing publik
      }

      var fileId = file.getId();
      var viewUrl = "https://lh3.googleusercontent.com/d/" + fileId;

      return respondJSON({
        success: true,
        data: {
          fileId: fileId,
          viewUrl: viewUrl,
          thumbnailUrl: viewUrl,
          webViewLink: file.getUrl()
        }
      });
    }

    // ── 2. Read Sheet Rows ──────────────────────────────────────────────────
    if (action === "read") {
      var sheetName = payload.sheetName;
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        return respondJSON({ success: true, data: [] });
      }

      var values = sheet.getDataRange().getValues();
      if (values.length <= 1) {
        return respondJSON({ success: true, data: [] });
      }

      var headers = values[0];
      var rows = [];
      for (var r = 1; r < values.length; r++) {
        var rowObj = {};
        for (var c = 0; c < headers.length; c++) {
          var key = headers[c];
          if (key) {
            rowObj[key] = values[r][c];
          }
        }
        rows.push(rowObj);
      }
      return respondJSON({ success: true, data: rows });
    }

    // ── 3. Append Row ───────────────────────────────────────────────────────
    if (action === "append") {
      var sheetName = payload.sheetName;
      var data = payload.data || {};
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }

      var values = sheet.getDataRange().getValues();
      var headers = [];
      if (values.length > 0 && values[0].length > 0 && values[0][0] !== "") {
        headers = values[0];
      } else {
        // Buat headers dari keys payload jika sheet kosong
        headers = Object.keys(data);
        sheet.appendRow(headers);
      }

      var newRow = [];
      for (var c = 0; c < headers.length; c++) {
        var val = data[headers[c]];
        newRow.push(val !== undefined ? val : "");
      }
      sheet.appendRow(newRow);

      return respondJSON({ success: true, data: data });
    }

    // ── 4. Update Row By ID ─────────────────────────────────────────────────
    if (action === "update") {
      var sheetName = payload.sheetName;
      var idCol = payload.idColumnName || "id";
      var targetId = String(payload.id);
      var updatedFields = payload.updatedFields || {};

      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return respondJSON({ success: false, error: "Sheet " + sheetName + " tidak ditemukan" });

      var values = sheet.getDataRange().getValues();
      if (values.length <= 1) return respondJSON({ success: false, error: "Sheet kosong" });

      var headers = values[0];
      var idIndex = headers.indexOf(idCol);
      if (idIndex === -1) return respondJSON({ success: false, error: "Kolom " + idCol + " tidak ditemukan" });

      var rowIdx = -1;
      for (var r = 1; r < values.length; r++) {
        if (String(values[r][idIndex]) === targetId) {
          rowIdx = r + 1; // 1-based index di Sheets
          break;
        }
      }

      if (rowIdx === -1) {
        return respondJSON({ success: false, error: "Data ID " + targetId + " tidak ditemukan" });
      }

      for (var key in updatedFields) {
        var colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(rowIdx, colIndex + 1).setValue(updatedFields[key]);
        }
      }

      return respondJSON({ success: true, message: "Updated" });
    }

    // ── 5. Delete Row By ID ─────────────────────────────────────────────────
    if (action === "delete") {
      var sheetName = payload.sheetName;
      var idCol = payload.idColumnName || "id";
      var targetId = String(payload.id);

      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return respondJSON({ success: false, error: "Sheet tidak ditemukan" });

      var values = sheet.getDataRange().getValues();
      if (values.length <= 1) return respondJSON({ success: true });

      var headers = values[0];
      var idIndex = headers.indexOf(idCol);
      if (idIndex === -1) return respondJSON({ success: false, error: "Kolom tidak ditemukan" });

      for (var r = 1; r < values.length; r++) {
        if (String(values[r][idIndex]) === targetId) {
          sheet.deleteRow(r + 1);
          return respondJSON({ success: true, message: "Deleted" });
        }
      }

      return respondJSON({ success: true, message: "Not found or already deleted" });
    }

    // ── 6. Ensure Headers ───────────────────────────────────────────────────
    if (action === "ensureHeaders") {
      var sheetName = payload.sheetName;
      var headers = payload.headers || [];
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      var values = sheet.getDataRange().getValues();
      if (values.length === 0 || values[0].length === 0 || values[0][0] === "") {
        sheet.appendRow(headers);
      }
      return respondJSON({ success: true, message: "Headers ready" });
    }

    return respondJSON({ success: false, error: "Action tidak dikenali: " + action });

  } catch (err) {
    return respondJSON({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function respondJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
