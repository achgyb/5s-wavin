import React, { useState, useRef, useEffect } from 'react';
import { addWatermarkToImage, getCurrentWeekInfo } from '../utils/watermark';
import { uploadPhoto } from '../services/googleDrive';

// Default Area & Sub-Area mapping dengan penugasan AoC
export const DEFAULT_AOC_AREAS = [
  {
    area: 'EXTRUSION',
    subAreas: [
      { id: 'ext-line-1', name: 'Line 1 Extrusion (PVC)', aocName: 'Andi Pratama', picContact: 'andi@wavin.com' },
      { id: 'ext-line-2', name: 'Line 2 Extrusion (PE)', aocName: 'Budi Santoso', picContact: 'budi@wavin.com' },
      { id: 'ext-silo', name: 'Silo & Raw Material Feed', aocName: 'Citra Dewi', picContact: 'citra@wavin.com' },
    ],
  },
  {
    area: 'INJECTION',
    subAreas: [
      { id: 'inj-line-a', name: 'Molding Line A (Fittings)', aocName: 'Siti Rahma', picContact: 'siti@wavin.com' },
      { id: 'inj-line-b', name: 'Molding Line B (Accessories)', aocName: 'Doni Wijaya', picContact: 'doni@wavin.com' },
      { id: 'inj-mold', name: 'Tooling & Mold Storage', aocName: 'Eko Prasetyo', picContact: 'eko@wavin.com' },
    ],
  },
  {
    area: 'WAREHOUSE',
    subAreas: [
      { id: 'wh-raw', name: 'Gudang Bahan Baku (Resin)', aocName: 'Fajar Ramadhan', picContact: 'fajar@wavin.com' },
      { id: 'wh-fg', name: 'Gudang Finished Goods', aocName: 'Gita Permata', picContact: 'gita@wavin.com' },
      { id: 'wh-pack', name: 'Area Packing & Palet', aocName: 'Hendi Saputra', picContact: 'hendi@wavin.com' },
    ],
  },
  {
    area: 'MAINTENANCE',
    subAreas: [
      { id: 'maint-workshop', name: 'Workshop Mekanik & Utility', aocName: 'Iwan Kurniawan', picContact: 'iwan@wavin.com' },
      { id: 'maint-parts', name: 'Ruang Sparepart & Oli', aocName: 'Joko Susilo', picContact: 'joko@wavin.com' },
    ],
  },
  {
    area: 'QC & LAB',
    subAreas: [
      { id: 'qc-lab', name: 'Laboratorium Pengujian Pipa', aocName: 'Kartika Sari', picContact: 'kartika@wavin.com' },
    ],
  },
];

// 5S Checklist Criteria untuk Self Assessment
const SELF_ASSESSMENT_CRITERIA = [
  {
    id: '1s_seiri',
    pillar: '1S — SEIRI (RINGKAS)',
    title: 'Pemilahan Barang & Area Red Tag',
    description: 'Semua barang yang tidak diperlukan telah disingkirkan dari area kerja. Area Red Tag dikelola dengan rapi.',
  },
  {
    id: '2s_seiton',
    pillar: '2S — SEITON (RAPI)',
    title: 'Penataan, Labeling & Jalur Kerja',
    description: 'Semua alat dan material memiliki tempat penempatan yang jelas, berlabel, serta jalur lalu lintas bebas halangan.',
  },
  {
    id: '3s_seiso',
    pillar: '3S — SEISO (RESIK)',
    title: 'Kebersihan Mesin & Lingkungan Kerja',
    description: 'Lantai, mesin, dan meja kerja bersih dari ceceran oli, debu, dan sampah. Alat pembersih tersedia lengkap.',
  },
  {
    id: '4s_seiketsu',
    pillar: '4S — SEIKETSU (RAWAT)',
    title: 'Standarisasi Visual & Display SOP',
    description: 'Visual display, instruksi kerja (SOP), dan rambu keselamatan terpasang rapi dan dipatuhi oleh seluruh regu.',
  },
  {
    id: '5s_shitsuke',
    pillar: '5S — SHITSUKE (RAJIN)',
    title: 'Disiplin Kebiasaan & Sikap Kerja 5S',
    description: 'Aktivitas 5S harian dijalankan dengan disiplin oleh operator tanpa perlu diingatkan berulang kali.',
  },
];

export default function SelfAssessment({
  currentUser,
  selfAssessments = [],
  onSubmitAssessment,
  isGoogleConfigured = false,
}) {
  const currentWeek = getCurrentWeekInfo();
  const [activeTab, setActiveTab] = useState('form'); // 'form' | 'compliance' | 'history'
  const [selectedArea, setSelectedArea] = useState(DEFAULT_AOC_AREAS[0].area);
  const [selectedSubAreaId, setSelectedSubAreaId] = useState(DEFAULT_AOC_AREAS[0].subAreas[0].id);

  // Form State
  const [scores, setScores] = useState({
    '1s_seiri': 'OK',
    '2s_seiton': 'OK',
    '3s_seiso': 'OK',
    '4s_seiketsu': 'OK',
    '5s_shitsuke': 'OK',
  });
  const [notes, setNotes] = useState('');
  const [capturedPhotos, setCapturedPhotos] = useState([]); // [{ file, previewUrl, timestamp, uploadedUrl }]
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Camera Modal State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const nativeFileInputRef = useRef(null);

  // Selected Photo Zoom Modal
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null);

  // Cari detail sub-area aktif
  const activeAreaObj = DEFAULT_AOC_AREAS.find((a) => a.area === selectedArea);
  const activeSubAreaObj = activeAreaObj?.subAreas.find((s) => s.id === selectedSubAreaId) || activeAreaObj?.subAreas[0];

  // Auto-set AoC jika user yang login adalah AoC
  const activeAocName = currentUser?.role === 'AOC' ? currentUser.name : (activeSubAreaObj?.aocName || 'Agent of Change');

  // Ganti sub-area pertama jika area berubah
  const handleAreaChange = (newArea) => {
    setSelectedArea(newArea);
    const newAreaObj = DEFAULT_AOC_AREAS.find((a) => a.area === newArea);
    if (newAreaObj && newAreaObj.subAreas.length > 0) {
      setSelectedSubAreaId(newAreaObj.subAreas[0].id);
    }
  };

  // Cek apakah sub-area ini sudah dinilai pada minggu ini
  const isCurrentSubAreaCompliedThisWeek = selfAssessments.some(
    (a) => a.subAreaId === selectedSubAreaId && a.weekCode === currentWeek.weekCode
  );

  // ─── Kamera Live Viewfinder ───────────────────────────────────────────────
  const startLiveCamera = async () => {
    try {
      setShowCameraModal(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Live camera access failed or blocked, falling back to native file input:', err);
      stopLiveCamera();
      // Buka native input file yang terkunci ke camera
      if (nativeFileInputRef.current) {
        nativeFileInputRef.current.click();
      }
    }
  };

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  useEffect(() => {
    if (showCameraModal && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showCameraModal, cameraStream]);

  // Jepret foto dari Live Camera
  const captureSnapshotFromCamera = async () => {
    if (!videoRef.current) return;
    setIsProcessingPhoto(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Tambahkan Watermark otomatis
      const watermarked = await addWatermarkToImage(dataUrl, {
        area: selectedArea,
        subArea: activeSubAreaObj?.name,
        aocName: activeAocName,
      });

      setCapturedPhotos((prev) => [...prev, watermarked]);
      stopLiveCamera();
    } catch (err) {
      alert('Gagal mengambil foto: ' + err.message);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Handler jika menggunakan input native (capture="environment")
  const handleNativeCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      const watermarked = await addWatermarkToImage(file, {
        area: selectedArea,
        subArea: activeSubAreaObj?.name,
        aocName: activeAocName,
      });
      setCapturedPhotos((prev) => [...prev, watermarked]);
    } catch (err) {
      alert('Gagal memproses watermark foto: ' + err.message);
    } finally {
      setIsProcessingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemovePhoto = (index) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Submit Self Assessment ───────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (capturedPhotos.length === 0) {
      alert('WAJIB mengambil minimal 1 foto bukti kondisi area langsung dari kamera!');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload foto bukti ke Google Drive / Apps Script
      const uploadedPhotosList = [];
      for (let i = 0; i < capturedPhotos.length; i++) {
        const photoItem = capturedPhotos[i];
        const fileName = `AoC_${selectedArea}_${selectedSubAreaId}_${currentWeek.weekCode}_${i + 1}.jpg`;
        const result = await uploadPhoto(photoItem.file, fileName);
        uploadedPhotosList.push({
          url: result.viewUrl,
          fileId: result.fileId,
          timestamp: photoItem.timestamp,
        });
      }

      // 2. Hitung compliance score
      const totalCriteria = SELF_ASSESSMENT_CRITERIA.length;
      const okCount = Object.values(scores).filter((s) => s === 'OK').length;
      const percentageScore = Math.round((okCount / totalCriteria) * 100);

      const newAssessment = {
        id: `sa-${Date.now()}`,
        weekCode: currentWeek.weekCode,
        weekLabel: currentWeek.label,
        year: currentWeek.year,
        area: selectedArea,
        subAreaId: selectedSubAreaId,
        subAreaName: activeSubAreaObj?.name || selectedSubAreaId,
        aocName: activeAocName,
        aocEmail: currentUser?.email || activeSubAreaObj?.picContact || '',
        submittedAt: new Date().toISOString(),
        score: percentageScore,
        complianceStatus: 'COMPLIED', // Comply status
        scores,
        notes: notes.trim(),
        photos: uploadedPhotosList,
        primaryPhotoUrl: uploadedPhotosList[0]?.url || capturedPhotos[0]?.previewUrl,
        watermarkTimestamp: capturedPhotos[0]?.timestamp || '',
      };

      await onSubmitAssessment(newAssessment);

      alert(`✅ Self Assessment Minggu ${currentWeek.weekNumber} BERHASIL dikirim!\nStatus: COMPLIED (Patuh)`);

      // Reset form
      setCapturedPhotos([]);
      setNotes('');
      setActiveTab('compliance'); // Buka tab compliance untuk melihat hasil
    } catch (err) {
      console.error('Submit self assessment error:', err);
      alert('Gagal mengirim assessment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Kalkulasi Data Kepatuhan Seluruh Sub-Area ─────────────────────────────
  const allSubAreasList = DEFAULT_AOC_AREAS.flatMap((a) =>
    a.subAreas.map((s) => ({
      area: a.area,
      ...s,
    }))
  );

  const complianceMatrix = allSubAreasList.map((subArea) => {
    // Cari assessment minggu ini untuk subArea ini
    const assessmentThisWeek = selfAssessments.find(
      (a) => a.subAreaId === subArea.id && a.weekCode === currentWeek.weekCode
    );

    return {
      ...subArea,
      isComplied: !!assessmentThisWeek,
      assessment: assessmentThisWeek || null,
    };
  });

  const totalSubAreasCount = complianceMatrix.length;
  const compliedCount = complianceMatrix.filter((c) => c.isComplied).length;
  const compliancePercentage = Math.round((compliedCount / totalSubAreasCount) * 100);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#F05731] text-3xl">verified</span>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#353750] uppercase tracking-tight">
              Self Assessment AoC (Agent of Change)
            </h1>
          </div>
          <p className="text-xs text-[#6B6E8A] mt-1 font-semibold">
            Modul evaluasi mandiri mingguan 5S oleh perwakilan Agent of Change per area &amp; sub-area pabrik Wavin.
          </p>
        </div>

        {/* Current Week Status Badge */}
        <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-xl border border-[#E0E0EC] shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-[#FFF5F3] flex items-center justify-center text-[#F05731]">
            <span className="material-symbols-outlined text-2xl">calendar_today</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-[#8A8DA8] uppercase tracking-wider">Target Periode</div>
            <div className="text-sm font-extrabold text-[#353750]">{currentWeek.label}</div>
          </div>
          <div className={`ml-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isCurrentSubAreaCompliedThisWeek
              ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30'
              : 'bg-[#FFF3E0] text-[#E65100] border border-[#E65100]/30'
          }`}>
            {isCurrentSubAreaCompliedThisWeek ? '✓ Sudah Comply' : '⏳ Belum Dinilai'}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 p-1.5 bg-[#EBEBEF] rounded-xl mb-6 max-w-xl">
        <button
          onClick={() => setActiveTab('form')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'form'
              ? 'bg-[#353750] text-white shadow-sm'
              : 'text-[#6B6E8A] hover:text-[#353750]'
          }`}
        >
          <span className="material-symbols-outlined text-base">edit_document</span>
          Form Assessment
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'compliance'
              ? 'bg-[#353750] text-white shadow-sm'
              : 'text-[#6B6E8A] hover:text-[#353750]'
          }`}
        >
          <span className="material-symbols-outlined text-base">monitoring</span>
          Kepatuhan Mingguan ({compliancePercentage}%)
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'bg-[#353750] text-white shadow-sm'
              : 'text-[#6B6E8A] hover:text-[#353750]'
          }`}
        >
          <span className="material-symbols-outlined text-base">photo_library</span>
          Galeri Watermark ({selfAssessments.length})
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: FORM SELF ASSESSMENT                                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Card: Pilihan Area & Penugasan AoC */}
          <div className="bg-white border border-[#E0E0EC] rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-extrabold text-[#353750] uppercase tracking-wider flex items-center gap-2 border-b border-[#F0F0F8] pb-3 mb-4">
              <span className="material-symbols-outlined text-[#F05731]">share_location</span>
              1. Pilih Area &amp; Sub-Area Penugasan
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Select Area Utama */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6B6E8A] uppercase tracking-wider">Area Utama Pabrik</label>
                <select
                  value={selectedArea}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  className="h-11 px-3 rounded-xl border border-[#D5D5E2] font-bold text-[#353750] text-xs bg-white outline-none focus:border-[#353750]"
                >
                  {DEFAULT_AOC_AREAS.map((a) => (
                    <option key={a.area} value={a.area}>{a.area}</option>
                  ))}
                </select>
              </div>

              {/* Select Sub-Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6B6E8A] uppercase tracking-wider">Sub-Area Spesifik</label>
                <select
                  value={selectedSubAreaId}
                  onChange={(e) => setSelectedSubAreaId(e.target.value)}
                  className="h-11 px-3 rounded-xl border border-[#D5D5E2] font-bold text-[#353750] text-xs bg-white outline-none focus:border-[#353750]"
                >
                  {activeAreaObj?.subAreas.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* AoC PIC Display */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#6B6E8A] uppercase tracking-wider">Penilai (Agent of Change)</label>
                <div className="h-11 px-4 rounded-xl border border-[#E0E0EC] bg-[#F9F9FB] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#F05731]">person_celebrate</span>
                    <span className="font-extrabold text-xs text-[#353750]">{activeAocName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#3DAA72] bg-[#E8F5E9] px-2 py-0.5 rounded">AoC PIC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: 5S Evaluation Checklist */}
          <div className="bg-white border border-[#E0E0EC] rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-extrabold text-[#353750] uppercase tracking-wider flex items-center gap-2 border-b border-[#F0F0F8] pb-3 mb-4">
              <span className="material-symbols-outlined text-[#3DAA72]">checklist</span>
              2. Kriteria Evaluasi 5S Mingguan
            </h2>

            <div className="flex flex-col divide-y divide-[#F0F0F8]">
              {SELF_ASSESSMENT_CRITERIA.map((criterion, idx) => {
                const currentScore = scores[criterion.id] || 'OK';
                return (
                  <div key={criterion.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#F05731] uppercase tracking-widest bg-[#FFF5F3] px-2 py-0.5 rounded">
                          {criterion.pillar}
                        </span>
                        <h3 className="font-bold text-sm text-[#353750]">{criterion.title}</h3>
                      </div>
                      <p className="text-xs text-[#6B6E8A] mt-1">{criterion.description}</p>
                    </div>

                    {/* Radio Options */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setScores((prev) => ({ ...prev, [criterion.id]: 'OK' }))}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          currentScore === 'OK'
                            ? 'bg-[#3DAA72] text-white shadow-sm'
                            : 'bg-[#F4F4F6] text-[#6B6E8A] hover:bg-gray-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        OK (Sesuai)
                      </button>

                      <button
                        type="button"
                        onClick={() => setScores((prev) => ({ ...prev, [criterion.id]: 'NOT_OK' }))}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                          currentScore === 'NOT_OK'
                            ? 'bg-[#D32F2F] text-white shadow-sm'
                            : 'bg-[#F4F4F6] text-[#6B6E8A] hover:bg-gray-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span>
                        Temuan (Not OK)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes Input */}
            <div className="mt-4 pt-4 border-t border-[#F0F0F8]">
              <label className="text-xs font-bold text-[#353750] uppercase tracking-wider block mb-1.5">
                Catatan Temuan / Tindak Lanjut AoC
              </label>
              <textarea
                rows="2"
                className="w-full p-3 rounded-xl border border-[#D5D5E2] text-xs font-semibold text-[#353750] outline-none focus:border-[#353750]"
                placeholder="Tuliskan catatan kondisi area atau rencana perbaikan 5S di sub-area ini..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Card: Kamera Wajib & Watermark */}
          <div className="bg-white border-2 border-dashed border-[#F05731]/40 rounded-2xl p-6 shadow-sm bg-[#FFFDFD]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#F0E0DC] pb-3 mb-4">
              <div>
                <h2 className="text-sm font-extrabold text-[#353750] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F05731]">photo_camera</span>
                  3. Pengambilan Foto Bukti Wajib (Kamera Langsung &amp; Watermark)
                </h2>
                <p className="text-xs text-[#6B6E8A] mt-0.5 font-semibold">
                  Foto <strong className="text-[#D32F2F]">wajib diambil langsung dari kamera</strong> (tidak bisa upload dari galeri) dan akan distempel watermark tanggal &amp; jam riil secara otomatis.
                </p>
              </div>

              {/* Action Buttons to open camera */}
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <button
                  type="button"
                  onClick={startLiveCamera}
                  disabled={isProcessingPhoto}
                  className="px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider text-white shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  style={{ background: '#F05731' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#D0401D')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#F05731')}
                >
                  <span className="material-symbols-outlined text-base">videocam</span>
                  Buka Kamera Langsung
                </button>

                {/* Hidden native input locked to camera only (capture="environment") */}
                <input
                  ref={nativeFileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleNativeCameraCapture}
                />
              </div>
            </div>

            {/* Spinner when processing watermark */}
            {isProcessingPhoto && (
              <div className="p-6 text-center text-[#F05731] font-bold text-xs flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                Menempelkan Watermark Tanggal, Jam &amp; Lokasi ke Foto...
              </div>
            )}

            {/* Photos Preview Grid */}
            {capturedPhotos.length === 0 && !isProcessingPhoto && (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#FFF5F3] flex items-center justify-center text-[#F05731] mb-3">
                  <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                </div>
                <p className="text-sm font-bold text-[#353750]">Belum ada foto bukti yang diambil</p>
                <p className="text-xs text-[#8A8DA8] max-w-sm mt-1">
                  Klik tombol <strong>"Buka Kamera Langsung"</strong> di atas untuk mengambil foto bukti 5S di sub-area ini.
                </p>
              </div>
            )}

            {capturedPhotos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {capturedPhotos.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border-2 border-[#353750] shadow-md bg-black"
                  >
                    <img
                      src={item.previewUrl}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-52 object-cover cursor-pointer transition-transform group-hover:scale-102"
                      onClick={() => setZoomPhotoUrl(item.previewUrl)}
                    />

                    {/* Watermark Tag Badge */}
                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-[#FAB931] px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border border-[#FAB931]/40">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      Watermarked
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow transition-all"
                      title="Hapus foto"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>

                    {/* Zoom prompt */}
                    <div
                      onClick={() => setZoomPhotoUrl(item.previewUrl)}
                      className="absolute bottom-2 right-2 bg-[#353750]/90 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs">zoom_in</span>
                      Lihat Stempel
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#E0E0EC]">
            <div className="text-xs text-[#6B6E8A] font-semibold">
              Foto bukti akan otomatis disimpan ke Google Drive dan status kepatuhan mingguan Anda akan tercatat.
            </div>

            <button
              type="submit"
              disabled={isSubmitting || capturedPhotos.length === 0}
              className={`px-8 h-12 rounded-xl font-extrabold text-sm uppercase tracking-wider text-white flex items-center gap-2 shadow-lg transition-all ${
                isSubmitting || capturedPhotos.length === 0
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-[#353750] hover:bg-[#23253A] active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                  Mengirim &amp; Menyimpan Foto...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Kirim Self Assessment Mingguan
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: MONITORING KEPATUHAN MINGGUAN                                   */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'compliance' && (
        <div className="flex flex-col gap-6">

          {/* Scorecards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E0E0EC] p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-[#8A8DA8] uppercase tracking-wider">Total Sub-Area Penugasan</span>
              <div className="text-2xl font-black text-[#353750] mt-1">{totalSubAreasCount} Sub-Area</div>
              <span className="text-xs text-[#6B6E8A] mt-0.5 block">Seluruh pabrik Wavin</span>
            </div>

            <div className="bg-white border border-[#E0E0EC] p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-[#3DAA72] uppercase tracking-wider">Sudah Comply Minggu Ini</span>
              <div className="text-2xl font-black text-[#3DAA72] mt-1">{compliedCount} Area</div>
              <span className="text-xs text-[#3DAA72] font-semibold mt-0.5 block">✓ Selesai dinilai</span>
            </div>

            <div className="bg-white border border-[#E0E0EC] p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-[#D32F2F] uppercase tracking-wider">Belum Dinilai (Pending)</span>
              <div className="text-2xl font-black text-[#D32F2F] mt-1">{totalSubAreasCount - compliedCount} Area</div>
              <span className="text-xs text-[#D32F2F] font-semibold mt-0.5 block">⏳ Wajib submit minggu ini</span>
            </div>

            <div className="bg-white border border-[#E0E0EC] p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-[#F05731] uppercase tracking-wider">Tingkat Kepatuhan (Rate)</span>
              <div className="text-2xl font-black text-[#F05731] mt-1">{compliancePercentage}%</div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-[#F05731] h-full rounded-full transition-all duration-500"
                  style={{ width: `${compliancePercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white border border-[#E0E0EC] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-5 border-b border-[#E0E0EC] flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-[#353750] uppercase text-sm tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#F05731]">table_chart</span>
                  Matriks Kepatuhan AoC — {currentWeek.label}
                </h2>
                <p className="text-xs text-[#6B6E8A] mt-0.5">
                  Aturan: 1 sub-area wajib dinilai 1 kali setiap minggu oleh AoC penanggung jawab.
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 bg-[#F4F4F6] text-[#353750] rounded-full border border-[#E0E0EC]">
                {currentWeek.weekCode}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F9F9FB] border-b border-[#E0E0EC] text-[#6B6E8A] uppercase font-bold text-[10px] tracking-wider">
                    <th className="py-3 px-4">Area &amp; Sub-Area</th>
                    <th className="py-3 px-4">Agent of Change (AoC)</th>
                    <th className="py-3 px-4 text-center">Status Mingguan</th>
                    <th className="py-3 px-4">Waktu Pelaksanaan</th>
                    <th className="py-3 px-4 text-center">Bukti Watermark</th>
                    <th className="py-3 px-4 text-right">Skor 5S</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F8]">
                  {complianceMatrix.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FDFDFE] transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold text-[#F05731] uppercase block">{item.area}</span>
                        <span className="font-bold text-[#353750] text-sm">{item.name}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-extrabold text-[#353750]">{item.aocName}</div>
                        <div className="text-[11px] text-[#8A8DA8]">{item.picContact}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.isComplied ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            COMPLY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FFEBEE] text-[#D32F2F] border border-[#D32F2F]/30">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            BELUM COMPLY
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#6B6E8A] font-semibold">
                        {item.assessment?.watermarkTimestamp || item.assessment?.submittedAt
                          ? new Date(item.assessment.submittedAt).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })
                          : '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.assessment?.primaryPhotoUrl ? (
                          <button
                            type="button"
                            onClick={() => setZoomPhotoUrl(item.assessment.primaryPhotoUrl)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#353750]/30 hover:border-[#353750] bg-white text-[#353750] font-bold text-[11px] transition-all cursor-pointer shadow-sm"
                          >
                            <span className="material-symbols-outlined text-xs text-[#F05731]">photo_camera</span>
                            Lihat Foto
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {item.assessment ? (
                          <span className="font-black text-sm text-[#353750]">
                            {item.assessment.score}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: RIWAYAT & GALERI FOTO BUKTI WATERMARK                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-[#353750] uppercase text-sm tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-[#F05731]">photo_library</span>
              Galeri Foto Bukti dengan Stempel Watermark Tanggal &amp; Waktu
            </h2>
            <span className="text-xs font-bold text-[#6B6E8A]">
              Total: {selfAssessments.length} Laporan
            </span>
          </div>

          {selfAssessments.length === 0 ? (
            <div className="bg-white border border-[#E0E0EC] rounded-2xl p-12 text-center shadow-sm">
              <span className="material-symbols-outlined text-[#9E9EAF] text-4xl mb-2">collections</span>
              <p className="font-bold text-[#353750]">Belum ada riwayat foto Self Assessment</p>
              <p className="text-xs text-[#6B6E8A] mt-1">
                Lakukan pengisian assessment pertama pada tab "Form Assessment".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selfAssessments.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#E0E0EC] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Photo with Watermark */}
                  <div className="relative bg-black h-56 cursor-pointer" onClick={() => setZoomPhotoUrl(item.primaryPhotoUrl)}>
                    <img
                      src={item.primaryPhotoUrl}
                      alt={item.subAreaName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-[#FAB931] px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border border-[#FAB931]/40">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      Watermarked
                    </div>
                    <div className="absolute top-2 right-2 bg-[#3DAA72] text-white px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                      Score: {item.score}%
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-[#F05731] uppercase">{item.area}</div>
                      <h3 className="font-extrabold text-sm text-[#353750]">{item.subAreaName}</h3>
                      <p className="text-xs text-[#6B6E8A] mt-1 font-semibold">
                        AoC: <strong className="text-[#353750]">{item.aocName}</strong>
                      </p>
                      {item.notes && (
                        <p className="text-xs text-[#6B6E8A] mt-2 italic bg-[#F9F9FB] p-2 rounded-lg border border-[#F0F0F8]">
                          "{item.notes}"
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#F0F0F8] flex items-center justify-between text-[11px] text-[#8A8DA8]">
                      <span>{item.weekLabel}</span>
                      <button
                        type="button"
                        onClick={() => setZoomPhotoUrl(item.primaryPhotoUrl)}
                        className="text-[#F05731] font-bold flex items-center gap-0.5 hover:underline"
                      >
                        <span className="material-symbols-outlined text-xs">zoom_in</span>
                        Perbesar Stempel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: LIVE CAMERA VIEWFINDER                                          */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#15171E] rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg border border-gray-700 flex flex-col">
            <div className="p-4 px-6 flex items-center justify-between border-b border-gray-800 text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F05731]">photo_camera</span>
                <span className="font-extrabold text-xs uppercase tracking-wider">Kamera Langsung AoC</span>
              </div>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Video Viewfinder */}
            <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Grid overlay */}
              <div className="absolute inset-0 pointer-events-none border border-white/20 grid grid-cols-3 grid-rows-3">
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
                <div className="border border-white/10" />
              </div>

              {/* Realtime Timestamp simulation badge */}
              <div className="absolute bottom-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[10px] text-[#FAB931] font-mono font-bold border border-[#FAB931]/30">
                [LIVE]: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')} WIB
              </div>
            </div>

            {/* Snap Shutter Controls */}
            <div className="p-5 flex items-center justify-around bg-[#1B1D26]">
              <button
                type="button"
                onClick={stopLiveCamera}
                className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider"
              >
                Batal
              </button>

              {/* Big Shutter Button */}
              <button
                type="button"
                onClick={captureSnapshotFromCamera}
                disabled={isProcessingPhoto}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-[#F05731] hover:scale-105 active:scale-95 shadow-xl transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#F05731]">
                  <span className="material-symbols-outlined text-2xl">camera_alt</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopLiveCamera();
                  if (nativeFileInputRef.current) nativeFileInputRef.current.click();
                }}
                className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider"
                title="Gunakan aplikasi kamera bawaan HP"
              >
                App Kamera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ZOOM WATERMARK PHOTO                                            */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {zoomPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          onClick={() => setZoomPhotoUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute -top-12 right-0 text-white flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30"
            >
              <span className="material-symbols-outlined text-sm">close</span> Tutup
            </button>
            <img
              src={zoomPhotoUrl}
              alt="Watermark Zoom"
              className="max-w-full max-h-[82vh] rounded-2xl shadow-2xl border-2 border-white/20 object-contain"
            />
            <p className="text-white/80 text-xs font-mono mt-3 text-center">
              Stempel watermark permanen di bagian bawah foto memastikan keaslian waktu pengambilan gambar.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
