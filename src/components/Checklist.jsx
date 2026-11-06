import React, { useState, useEffect, useRef } from 'react';
import { uploadPhoto } from '../services/googleDrive';
import { isGoogleConfigured } from '../config/google';

const QUESTIONS = {
  SORT: [
    { id: 'sort_1', text: 'Are unnecessary items (tools, debris, parts) removed from the workspace?' },
    { id: 'sort_2', text: 'Is the Red Tag area currently managed and items disposed of weekly?' }
  ],
  SET_IN_ORDER: [
    { id: 'seiton_1', text: 'Are all tools, materials, and equipment labeled and have designated spots?' },
    { id: 'seiton_2', text: 'Are aisles, walkways, and safety zones clearly marked and unobstructed?' }
  ],
  SHINE: [
    { id: 'seiso_1', text: 'Are floors, work surfaces, and machines clean and free of oil, leakages, or debris?' },
    { id: 'seiso_2', text: 'Is cleaning equipment stored neatly and readily accessible?' }
  ],
  STANDARDIZE: [
    { id: 'seiketsu_1', text: 'Are standard operating procedures (SOPs) and safety signs clearly displayed?' },
    { id: 'seiketsu_2', text: 'Are color codes and visual indicators used consistently across the line?' }
  ],
  SUSTAIN: [
    { id: 'shitsuke_1', text: 'Are regular daily 5S audits/checklists performed by the shift team?' },
    { id: 'shitsuke_2', text: 'Is there evidence of active corrective action resolution from past audits?' }
  ]
};

export default function Checklist({ currentUser, onSubmitAudit, zones = [], departments = [] }) {
  const [openSections, setOpenSections] = useState({ SORT: true });
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState({});
  const [photos, setPhotos] = useState({}); // { qId: [{ url, id, localUrl }] }
  const [score, setScore] = useState(0);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Real Upload State
  const [activeQId, setActiveQId] = useState(null);
  const [uploadingQIds, setUploadingQIds] = useState({}); // { qId: true/false }

  const fileInputRef = useRef(null);

  // Set default selected zone and auto-update department based on selected zone PIC
  useEffect(() => {
    if (zones && zones.length > 0) {
      if (!selectedZone) {
        setSelectedZone(zones[0].name);
      }
      const activeZoneObj = zones.find(z => z.name === (selectedZone || zones[0].name));
      if (activeZoneObj) {
        setSelectedDept(activeZoneObj.department || 'PRODUCTION');
      }
    }
  }, [zones, selectedZone]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSetStatus = (qId, status) => {
    setAnswers((prev) => ({ ...prev, [qId]: status }));
  };

  const handleNotesChange = (qId, val) => {
    setNotes((prev) => ({ ...prev, [qId]: val }));
  };

  const handlePhotoCaptureTrigger = (qId) => {
    const currentPhotos = photos[qId] || [];
    if (currentPhotos.length >= 10) {
      alert('Maximum of 10 pictures allowed per item.');
      return;
    }
    setActiveQId(qId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    const qId = activeQId;
    if (!file || !qId) return;

    // Reset file input value so same file can be selected again if deleted
    e.target.value = '';

    setUploadingQIds(prev => ({ ...prev, [qId]: true }));

    const previewUrl = URL.createObjectURL(file);
    const newPhotoNum = (photos[qId] || []).length + 1;
    const tempPhoto = { url: previewUrl, id: '', localUrl: previewUrl, uploading: true };

    // Optimistically show preview
    setPhotos(prev => ({
      ...prev,
      [qId]: [...(prev[qId] || []), tempPhoto]
    }));

    try {
      let finalUrl = previewUrl;
      let fileId = '';

      if (isGoogleConfigured()) {
        const result = await uploadPhoto(file, `Evidence_${qId}_${newPhotoNum}_${Date.now()}.jpg`);
        finalUrl = result.viewUrl;
        fileId = result.fileId;
      }

      setPhotos(prev => ({
        ...prev,
        [qId]: (prev[qId] || []).map(p => 
          p.localUrl === previewUrl 
            ? { url: finalUrl, id: fileId, localUrl: previewUrl, uploading: false } 
            : p
        )
      }));
    } catch (err) {
      console.error('Drive upload failed for checklist evidence:', err);
      alert('Failed to upload image. Please try again: ' + err.message);
      // Remove failed photo from preview
      setPhotos(prev => ({
        ...prev,
        [qId]: (prev[qId] || []).filter(p => p.localUrl !== previewUrl)
      }));
    } finally {
      setUploadingQIds(prev => ({ ...prev, [qId]: false }));
      setActiveQId(null);
    }
  };

  const handlePhotoDelete = (qId, photoIndex) => {
    const currentPhotos = photos[qId] || [];
    const updatedPhotos = currentPhotos.filter((_, idx) => idx !== photoIndex);
    setPhotos((prev) => ({
      ...prev,
      [qId]: updatedPhotos
    }));
  };

  // Recalculate running score
  useEffect(() => {
    let total = 0;
    let passes = 0;

    Object.values(answers).forEach((status) => {
      if (status === 'pass') {
        total++;
        passes++;
      } else if (status === 'fail') {
        total++;
      }
    });

    if (total === 0) {
      setScore(0);
    } else {
      setScore(Math.round((passes / total) * 100));
    }
  }, [answers]);

  const handleSubmit = () => {
    const questionsList = Object.entries(QUESTIONS).flatMap(([cat, list]) =>
      list.map((q) => ({ ...q, category: cat }))
    );

    // Check if everything is filled
    const allQuestionsCount = questionsList.length;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < allQuestionsCount) {
      alert(`Please answer all ${allQuestionsCount} questions before submitting. (Answered: ${answeredCount}/${allQuestionsCount})`);
      return;
    }

    // Check photos constraints for failed items (Must be 5 to 10 pictures)
    let hasPhotoError = false;
    let errorQText = '';
    
    questionsList.forEach((q) => {
      const status = answers[q.id];
      if (status === 'fail') {
        const itemPhotos = photos[q.id] || [];
        if (itemPhotos.length < 5 || itemPhotos.length > 10) {
          hasPhotoError = true;
          errorQText = q.text;
        }
      }
    });

    if (hasPhotoError) {
      alert(`Operational Compliance Error:\nFailed items require between 5 and 10 photos.\n\nProblem question:\n"${errorQText}"`);
      return;
    }

    let missingNotesText = '';
    
    // Collect failed items
    const failedItems = [];
    const newFindings = [];
    
    questionsList.forEach((q) => {
      const status = answers[q.id];
      if (status === 'fail') {
        const itemNote = notes[q.id] || '';
        if (!itemNote.trim()) {
          hasPhotoError = true; // reusing error flag to block submission
          missingNotesText = q.text;
        }

        const itemPhotos = photos[q.id] || [];
        failedItems.push({
          qId: q.id,
          category: q.category,
          questionText: q.text,
          notes: itemNote || 'No notes provided',
          photos: itemPhotos
        });

        // Generate official finding for Action Tracker
        newFindings.push({
          id: `FND-${Math.floor(10000 + Math.random() * 90000)}`,
          title: `[${q.category}] ${itemNote}`,
          severity: 'HIGH',
          location: selectedZone || 'PLANT 04 - ZONE B',
          assignedTo: 'PIC', // Will be managed by the PIC
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Next day
          status: 'TO DO',
          pillar: q.category,
          photoUrl: itemPhotos.length > 0 ? itemPhotos[0].url : ''
        });
      }
    });

    if (missingNotesText) {
      alert(`Finding Required:\nYou must describe the issue/finding for all failed items.\n\nMissing on:\n"${missingNotesText}"`);
      return;
    }

    const auditData = {
      date: new Date().toISOString().split('T')[0],
      auditor: currentUser.name,
      role: currentUser.role,
      zone: selectedZone || 'PLANT 04 - ZONE B',
      department: selectedDept || 'PRODUCTION',
      score: score,
      answers: answers,
      failedItems: failedItems
    };

    onSubmitAudit(auditData, newFindings);
    alert(`Audit submitted successfully! Score: ${score}%`);

    // Reset checklist state
    setAnswers({});
    setNotes({});
    setPhotos({});
  };

  const getScoreColor = () => {
    if (score < 50) return '#D32F2F';
    if (score < 80) return '#F05731';
    return '#2E7D32';
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F4F4F6', fontFamily: "'Nunito', sans-serif" }}>
      {/* Zone Header — Orbia navy gradient */}
      <section className="relative w-full overflow-hidden" style={{ background: 'linear-gradient(135deg, #353750 0%, #2A2C42 100%)' }}>
        <div className="px-6 py-6 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Current Inspection Zone</p>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="bg-white/10 border border-white/20 text-white text-xl font-bold h-11 px-4 uppercase outline-none focus:border-white/60 rounded-lg cursor-pointer animate-fade-in"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.name} style={{ background: '#353750' }}>{zone.name}</option>
                ))}
                {zones.length === 0 && (
                  <option value="">No Registered Zones</option>
                )}
              </select>
            </div>
            <div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Responsible Department (PIC)</p>
              <div
                className="bg-white/10 border border-white/20 text-white text-base font-bold h-11 px-5 uppercase flex items-center rounded-lg select-none"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                <span className="material-symbols-outlined text-base mr-2 text-white/70">corporate_fare</span>
                {selectedDept}
              </div>
            </div>
          </div>
          {/* Score chip */}
          <div className="bg-white rounded-xl px-5 py-3 flex flex-col items-center shadow-lg" id="running-score">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6E8A]">Score</span>
            <span className="text-3xl font-bold leading-none mt-0.5" style={{ color: getScoreColor() }}>
              {score}%
            </span>
          </div>
        </div>
        {/* Bottom accent stripe */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #3DAA72 0%, #29A9E0 33%, #F05731 66%, #FAB931 100%)' }} />
      </section>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-4 pb-4">
        <div className="space-y-3" id="audit-form">
          {Object.entries(QUESTIONS).map(([category, qList], catIdx) => {
            const isOpen = openSections[category];
            const catNameClean = category.replace(/_/g, ' ');
            return (
              <div key={category} className={`accordion-item rounded-xl overflow-hidden border shadow-sm ${isOpen ? 'accordion-open' : ''}`} style={{ background: '#FFFFFF', borderColor: '#E0E0EC' }}>
                <button
                  type="button"
                  onClick={() => toggleSection(category)}
                  className="w-full flex justify-between items-center p-4 hover:bg-[#F4F4F6] transition-colors border-b"
                  style={{ borderColor: isOpen ? '#E0E0EC' : 'transparent' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: '#353750' }}>
                      {catIdx + 1}
                    </span>
                    <h3 className="font-bold text-[#353750] uppercase tracking-wide text-sm">{catNameClean}</h3>
                  </div>
                  <span className="material-symbols-outlined rotate-icon text-[#6B6E8A]">expand_more</span>
                </button>

                <div className="accordion-content">
                  <div className="p-4 space-y-6">
                    {qList.map((q) => {
                      const answerVal = answers[q.id];
                      const noteVal = notes[q.id] || '';
                      const photoVal = photos[q.id] || [];
                      return (
                        <div key={q.id} className="audit-row space-y-3 pb-5 border-b last:border-0" style={{ borderColor: '#F0F0F8' }}>
                          <p className="font-semibold text-[#353750] text-sm">{q.text}</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleSetStatus(q.id, 'pass')}
                              className={`flex-1 h-touch-target-min border-2 rounded flex items-center justify-center gap-2 font-bold uppercase transition-all ${
                                answerVal === 'pass'
                                  ? 'bg-safety-green border-safety-green text-white'
                                  : 'border-safety-green/30 text-safety-green hover:bg-safety-green/10'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">check_circle</span> PASS
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStatus(q.id, 'fail')}
                              className={`flex-1 h-touch-target-min border-2 rounded flex items-center justify-center gap-2 font-bold uppercase transition-all ${
                                answerVal === 'fail'
                                  ? 'bg-safety-red border-safety-red text-white'
                                  : 'border-safety-red/30 text-safety-red hover:bg-safety-red/10'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">cancel</span> FAIL
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStatus(q.id, 'na')}
                              className={`flex-1 h-touch-target-min border-2 rounded flex items-center justify-center gap-2 font-bold uppercase transition-all ${
                                answerVal === 'na'
                                  ? 'bg-border-gray border-border-gray text-secondary'
                                  : 'border-secondary/30 text-secondary hover:bg-secondary/10'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">do_not_disturb_on</span> N/A
                            </button>
                          </div>

                          {/* Corrective Action Section (Fails) */}
                          {answerVal === 'fail' && (
                            <div className="action-panel grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 rounded-lg border" style={{ background: '#FFF5F3', borderColor: '#F05731', borderStyle: 'dashed' }}>
                              <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wide text-[#F05731]">Corrective Action Notes</label>
                                <textarea
                                  value={noteVal}
                                  onChange={(e) => handleNotesChange(q.id, e.target.value)}
                                  className="w-full border-2 rounded-lg p-3 min-h-[120px] resize-none outline-none transition-colors text-[#353750] text-sm"
                                  style={{ borderColor: '#E0E0EC', background: '#FFFFFF' }}
                                  placeholder="Describe why this failed and the actions required..."
                                />
                              </div>
                              <div className="space-y-2 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                  <label className="font-label-sm uppercase text-secondary text-xs">Evidence Photos (5 - 10 required)</label>
                                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                                    photoVal.length < 5 || photoVal.length > 10
                                      ? 'bg-safety-red/20 text-safety-red border border-safety-red/30 animate-pulse'
                                      : 'bg-safety-green/20 text-safety-green border border-safety-green/30'
                                  }`}>
                                    Photos: {photoVal.length} / 10
                                  </span>
                                </div>
                                
                                {/* Photo Thumbnail Grid */}
                                <div className="grid grid-cols-5 gap-2 bg-surface-container-lowest p-2 border border-border-gray min-h-[70px] rounded">
                                  {photoVal.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square border border-[#E0E0EC] rounded bg-[#F4F4F6] group overflow-hidden flex items-center justify-center">
                                      {img.uploading ? (
                                        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <img src={img.url} className="w-full h-full object-cover" alt={`Evidence ${idx}`} />
                                      )}
                                      {!img.uploading && (
                                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center text-white font-mono">
                                          #{idx + 1}
                                        </span>
                                      )}
                                      {/* Hover Action Overlay to Delete */}
                                      <button
                                        type="button"
                                        onClick={() => handlePhotoDelete(q.id, idx)}
                                        className="absolute inset-0 bg-black/75 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                                      >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                      </button>
                                    </div>
                                  ))}
                                  
                                  {/* Add Photo Button (rendered only if count < 10) */}
                                  {photoVal.length < 10 && (
                                    <button
                                      type="button"
                                      onClick={() => handlePhotoCaptureTrigger(q.id)}
                                      className="aspect-square border-2 border-dashed border-[#E0E0EC] hover:border-[#353750] flex flex-col items-center justify-center text-[#6B6E8A] hover:text-[#353750] transition-all rounded bg-white"
                                    >
                                      <span className="material-symbols-outlined text-lg">add_a_photo</span>
                                    </button>
                                  )}
                                </div>
                                
                                {photoVal.length < 5 && (
                                  <p className="text-[10px] text-red-500 uppercase font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">warning</span>
                                    Must upload at least 5 photos before submission (Current: {photoVal.length})
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button Area */}
        <div className="mt-4 pb-12">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full h-14 rounded-xl text-white font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] text-sm"
            style={{ background: '#353750' }}
            onMouseEnter={e => e.currentTarget.style.background = '#23253A'}
            onMouseLeave={e => e.currentTarget.style.background = '#353750'}
          >
            <span className="material-symbols-outlined">task_alt</span>
            Submit Audit
          </button>
          <p className="text-center text-[#B0B0C8] mt-3 text-xs font-semibold uppercase tracking-wide">
            Ensuring Continuous Improvement Through Discipline
          </p>
        </div>
      </main>

      {/* Single hidden input for camera/gallery capture */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />
    </div>
  );
}
