/**
 * ─────────────────────────────────────────────────────────────────────────────
 * WATERMARK UTILITY FOR AOC SELF ASSESSMENT
 * Stempel permanen (burned-in watermark) tanggal, jam, area, dan nama AoC
 * langsung ke pixel gambar menggunakan HTML5 Canvas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Menerima file foto / blob atau dataUrl, lalu menggambar watermark di bagian bawah foto.
 * @param {File|Blob|string} imageSource - File, Blob, atau DataURL gambar
 * @param {Object} metadata - { area, subArea, aocName, locationNote }
 * @returns {Promise<{ file: File, previewUrl: string, timestamp: string }>}
 */
export async function addWatermarkToImage(imageSource, metadata = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl = null;

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      objectUrl = URL.createObjectURL(imageSource);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Gambar foto asli
      ctx.drawImage(img, 0, 0);

      // Hitung proporsi banner watermark sesuai resolusi gambar
      const barHeight = Math.max(90, Math.round(canvas.height * 0.13));
      const fontSizeTitle = Math.max(16, Math.round(barHeight * 0.22));
      const fontSizeBody = Math.max(14, Math.round(barHeight * 0.19));
      const paddingX = Math.round(canvas.width * 0.03);

      // Background banner semi-transparan hitam pekat
      ctx.fillStyle = 'rgba(15, 17, 23, 0.85)';
      ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

      // Garis aksen warna Orbia di atas banner
      ctx.fillStyle = '#F05731'; // Coral Wavin
      ctx.fillRect(0, canvas.height - barHeight, canvas.width, Math.max(4, Math.round(barHeight * 0.04)));

      // Buat timestamp waktu riil pengambilan
      const now = new Date();
      const optionsDate = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
      const dateStr = now.toLocaleDateString('id-ID', optionsDate);
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const fullTimestamp = `${dateStr} • ${timeStr} WIB`;

      const startY = canvas.height - barHeight;

      // Baris 1: Brand & Keterangan Modul
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${fontSizeTitle}px 'Nunito', Arial, sans-serif`;
      ctx.fillText(
        `WAVIN 5S — AOC SELF ASSESSMENT`,
        paddingX,
        startY + fontSizeTitle + Math.round(barHeight * 0.16)
      );

      // Baris 2: Detail Area & Sub-Area + Nama AoC
      const areaText = `Area: ${metadata.area || '-'} | Sub: ${metadata.subArea || '-'} | AoC: ${metadata.aocName || 'Agent of Change'}`;
      ctx.fillStyle = '#E0E0EC';
      ctx.font = `600 ${fontSizeBody}px 'Nunito', Arial, sans-serif`;
      ctx.fillText(
        areaText,
        paddingX,
        startY + fontSizeTitle + fontSizeBody + Math.round(barHeight * 0.3)
      );

      // Baris 3: Tanggal & Waktu Pengambilan (Kuning terang menyala)
      ctx.fillStyle = '#FAB931'; // Emas / Kuning perhatian
      ctx.font = `bold ${fontSizeBody + 1}px 'Courier New', monospace`;
      ctx.fillText(
        `[TIMESTAMP]: ${fullTimestamp}`,
        paddingX,
        startY + fontSizeTitle + (fontSizeBody * 2) + Math.round(barHeight * 0.44)
      );

      // Konversi hasil canvas menjadi File JPEG
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Gagal memproses watermark pada canvas'));
          return;
        }
        const watermarkedFile = new File(
          [blob],
          `AoC_${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );
        const previewUrl = URL.createObjectURL(blob);
        resolve({
          file: watermarkedFile,
          previewUrl,
          timestamp: fullTimestamp,
        });
      }, 'image/jpeg', 0.92);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
}

/**
 * Menghitung nomor minggu dalam setahun (format: "2026-W45" atau label "Minggu 45 (Nov 2026)")
 */
export function getCurrentWeekInfo(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  const year = d.getUTCFullYear();
  
  const monthName = date.toLocaleDateString('id-ID', { month: 'short' });
  return {
    weekCode: `${year}-W${String(weekNo).padStart(2, '0')}`,
    weekNumber: weekNo,
    year,
    label: `Minggu ${weekNo} (${monthName} ${year})`,
  };
}
