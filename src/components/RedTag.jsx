import React, { useState, useRef } from 'react';
import { uploadPhoto } from '../services/googleDrive';
import { isGoogleConfigured } from '../config/google';

/**
 * RedTag Component
 * Rethemed to the Orbia Building & Infrastructure light theme.
 * Uses Nunito font, white card layouts, grey borders, and brand color accents (Navy, Coral, Green, Gold).
 */
export default function RedTag({ onSubmitRedTag }) {
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [disposition, setDisposition] = useState('');
  const [owner, setOwner] = useState('');
  
  // Real Photo Upload state
  const [photo, setPhoto] = useState(null); // Local Preview ObjectURL / DataURL
  const [photoUrl, setPhotoUrl] = useState(''); // Google Drive URL
  const [photoId, setPhotoId] = useState(''); // Google Drive File ID
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  const [tagId] = useState(() => `RT-${Math.floor(10000 + Math.random() * 90000)}`);
  const [timestamp] = useState(() => {
    const d = new Date();
    return `${d.toISOString().split('T')[0]} | ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  });

  const handleContainerClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // Create local object URL for instant preview
    const previewUrl = URL.createObjectURL(file);
    setPhoto(previewUrl);

    try {
      if (isGoogleConfigured()) {
        const result = await uploadPhoto(file, `RT_${tagId}_${Date.now()}.jpg`);
        setPhotoUrl(result.viewUrl);
        setPhotoId(result.fileId);
      } else {
        // Fallback for mock/local demo mode
        setPhotoUrl(previewUrl);
      }
    } catch (err) {
      console.error('Drive photo upload failed:', err);
      alert('Photo upload failed. Please try again: ' + err.message);
      setPhoto(null);
      setPhotoUrl('');
      setPhotoId('');
    } finally {
      setUploading(false);
    }
  };

  const handleFinalize = () => {
    if (!description.trim()) {
      alert('Please fill out the Item Description.');
      return;
    }
    if (!reason) {
      alert('Please select a Primary Reason.');
      return;
    }
    if (!disposition) {
      alert('Please select a Proposed Disposition.');
      return;
    }

    const tagData = {
      id: tagId,
      description: description.trim(),
      reason,
      disposition,
      owner: owner.trim() || 'UNASSIGNED',
      timestamp,
      photoUrl: photoUrl || photo || '',
      photoId: photoId || '',
      status: 'Active',
      location: 'PLANT 04 - SECTION B - LINE 2'
    };

    onSubmitRedTag(tagData);
    alert(`Red-Tag ${tagId} finalized successfully!`);
    
    // Reset state
    setDescription('');
    setReason('');
    setDisposition('');
    setOwner('');
    setPhoto(null);
    setPhotoUrl('');
    setPhotoId('');
  };

  return (
    <div className="pt-20 px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto pb-32" style={{ fontFamily: "'Nunito', sans-serif" }}>
      
      {/* ── Step Indicator ─────────────────────────────────────────────────── */}
      <div className="flex mb-6 border-b border-[#E0E0EC] bg-white p-3 rounded-xl shadow-sm">
        <div className="flex-1 pb-1 text-center border-b-4 border-[#F05731]">
          <p className="text-[10px] text-[#353750] uppercase font-bold tracking-widest">Step 01</p>
          <p className="font-bold text-[#353750] uppercase text-xs">Identification</p>
        </div>
        <div className="flex-1 pb-1 text-center opacity-40">
          <p className="text-[10px] text-[#6B6E8A] uppercase font-bold tracking-widest">Step 02</p>
          <p className="font-bold text-[#6B6E8A] uppercase text-xs">Classification</p>
        </div>
        <div className="flex-1 pb-1 text-center opacity-40">
          <p className="text-[10px] text-[#6B6E8A] uppercase font-bold tracking-widest">Step 03</p>
          <p className="font-bold text-[#6B6E8A] uppercase text-xs">Approval</p>
        </div>
      </div>

      {/* ── Photo Capture Area ─────────────────────────────────────────────── */}
      <section className="mb-6">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <div 
          onClick={handleContainerClick}
          className="relative group cursor-pointer border-2 border-dashed border-[#E0E0EC] bg-white aspect-video md:aspect-[21/9] flex flex-col items-center justify-center transition-all hover:border-[#353750]/50 overflow-hidden rounded-2xl shadow-sm"
        >
          <div className="absolute inset-0 z-0">
            {photo ? (
              <img
                src={photo}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div 
                className="w-full h-full bg-cover bg-center grayscale opacity-10" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBTXIaPBDEN3xA1fq8G77o9eqT2IiH0OAN4vlWAvmxR6XizZJN1iDD3J7dGBt8h15q-sRItiAXdFde5sYsgd-WFbjEOuTog9FIKwld3EBTFECPTNBrPNyp6GXQQcEHWihiZAYGVd40D3Qy2z_tZIvr8YHMSWGUXXlf2Qn2jGTBkHFB4PBBOwFAus2q5Ct6eIWxRmKMdqxehhAQn6WTW45yb4atqbHPgYxpGYkF-HokhVtiYDAlyGtaD3tRvXj4l3bOdDbfCRfITfPTn')" }}
              />
            )}
          </div>
          <div className="relative z-10 flex flex-col items-center text-center px-4 bg-white/70 backdrop-blur-[2px] py-4 rounded-xl border border-white/20">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-md transition-transform group-hover:scale-105 ${
              uploading ? 'bg-amber-100 text-amber-600' : photo ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF5F3] text-[#F05731]'
            }`}>
              {uploading ? (
                <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-3xl">
                  {photo ? 'check_circle' : 'photo_camera'}
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-[#353750] uppercase tracking-wide">
              {uploading ? 'Uploading to Drive...' : photo ? 'Photo Ready' : 'Capture Red-Tag Item'}
            </p>
            <p className="text-xs text-[#6B6E8A] uppercase mt-1">
              {uploading ? 'Please wait' : photo ? 'Tap to change/recapture photo' : 'Tap to open camera / gallery'}
            </p>
          </div>
          {/* Scanning animation effect (only when not loaded or uploading) */}
          {!photo && !uploading && (
            <div className="absolute top-0 left-0 w-full h-0.5 bg-[#F05731] opacity-40 animate-[bounce_3s_infinite]" />
          )}
        </div>
      </section>

      {/* ── Red-Tag Form Section ──────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Primary Fields */}
        <div className="col-span-12 md:col-span-8 flex flex-col gap-6">
          {/* Description */}
          <div className="bg-white border border-[#E0E0EC] p-6 rounded-2xl shadow-sm">
            <label className="block text-xs uppercase font-bold text-[#353750] tracking-wider mb-2">Item Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#F4F4F6] border-b-2 border-[#E0E0EC] text-[#353750] p-4 focus:border-[#353750] transition-colors outline-none resize-none rounded-t-lg font-semibold text-sm" 
              placeholder="Identify the object, part number, and current state..." 
              rows="3"
            />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-[#6B6E8A] uppercase font-bold">Character count: {description.length}/500</span>
              <span className="text-[10px] text-[#F05731] uppercase font-bold">Required field</span>
            </div>
          </div>

          {/* Secondary Selections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E0E0EC] p-6 rounded-2xl shadow-sm">
              <label className="block text-xs uppercase font-bold text-[#353750] tracking-wider mb-2">Primary Reason</label>
              <div className="relative">
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#F4F4F6] border-b-2 border-[#E0E0EC] text-[#353750] h-12 px-4 focus:border-[#353750] outline-none appearance-none uppercase font-bold text-sm rounded-t-lg cursor-pointer"
                >
                  <option value="">Select Reason</option>
                  <option value="unused">Unused / Redundant</option>
                  <option value="unknown">Unknown Ownership</option>
                  <option value="misplaced">Misplaced / Out of Area</option>
                  <option value="damaged">Damaged / Defective</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-[#6B6E8A]">arrow_drop_down</span>
              </div>
            </div>
            <div className="bg-white border border-[#E0E0EC] p-6 rounded-2xl shadow-sm">
              <label className="block text-xs uppercase font-bold text-[#353750] tracking-wider mb-2">Proposed Disposition</label>
              <div className="relative">
                <select 
                  value={disposition}
                  onChange={(e) => setDisposition(e.target.value)}
                  className="w-full bg-[#F4F4F6] border-b-2 border-[#E0E0EC] text-[#353750] h-12 px-4 focus:border-[#353750] outline-none appearance-none uppercase font-bold text-sm rounded-t-lg cursor-pointer"
                >
                  <option value="">Select Action</option>
                  <option value="relocate">Relocate / Move</option>
                  <option value="discard">Discard / Scrap</option>
                  <option value="return">Return to Supplier</option>
                  <option value="needs_review">Needs Supervisor Review</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-[#6B6E8A]">arrow_drop_down</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Assignment */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
          {/* Tag Details Card */}
          <div className="bg-white border border-[#E0E0EC] p-6 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-[#E0E0EC] pb-2">
              <span className="text-xs text-[#6B6E8A] uppercase font-bold">TAG ID</span>
              <span className="text-xl font-bold text-[#D32F2F] font-mono">{tagId}</span>
            </div>
            <div className="py-1">
              <p className="text-[10px] text-[#6B6E8A] uppercase font-bold">Timestamp</p>
              <p className="text-sm font-bold text-[#353750]">{timestamp}</p>
            </div>
            <div className="py-1">
              <p className="text-[10px] text-[#6B6E8A] uppercase font-bold">Location Authority</p>
              <p className="text-xs font-bold text-[#353750] uppercase">PLANT 04 - SECTION B - LINE 2</p>
            </div>
          </div>

          {/* Owner Assignment */}
          <div className="bg-white border border-[#E0E0EC] p-6 rounded-2xl shadow-sm">
            <label className="block text-xs uppercase font-bold text-[#353750] tracking-wider mb-2">Owner Assignment</label>
            <div className="flex items-center bg-[#F4F4F6] border-b-2 border-[#E0E0EC] px-4 rounded-t-lg">
              <span className="material-symbols-outlined text-[#6B6E8A]">person_search</span>
              <input 
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="flex-grow bg-transparent border-none text-[#353750] h-12 focus:ring-0 outline-none uppercase font-bold text-sm ml-2" 
                placeholder="Search by Badge or Name" 
                type="text"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button 
                type="button"
                onClick={() => setOwner('J. MILLER')}
                className="bg-[#F4F4F6] hover:bg-[#EBEBEF] text-[10px] px-2.5 py-1.5 uppercase font-bold text-[#353750] rounded-lg transition-colors border border-[#E0E0EC]"
              >
                + Recent: J. MILLER
              </button>
              <button 
                type="button"
                onClick={() => setOwner('S. CHEN')}
                className="bg-[#F4F4F6] hover:bg-[#EBEBEF] text-[10px] px-2.5 py-1.5 uppercase font-bold text-[#353750] rounded-lg transition-colors border border-[#E0E0EC]"
              >
                + Recent: S. CHEN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Warning Disclaimer ────────────────────────────────────────────── */}
      <div className="mt-6 p-4 bg-[#FFF5F3] border-l-4 border-[#F05731] flex gap-3 items-start rounded-r-xl shadow-sm">
        <span className="material-symbols-outlined text-[#F05731] text-2xl">warning</span>
        <div>
          <p className="text-xs uppercase font-bold text-[#F05731] tracking-wider">Operational Compliance</p>
          <p className="text-xs text-[#353750] font-semibold mt-0.5 leading-relaxed">
            Red-tagging items locks them for 48 hours for review. Ensure no critical path operations depend on this equipment before finalizing disposition.
          </p>
        </div>
      </div>

      {/* ── Bottom Action Bar ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white lg:pl-64 border-t border-[#E0E0EC] shadow-lg">
        <div className="flex w-full h-16 items-stretch">
          <button 
            type="button"
            onClick={() => {
              setDescription('');
              setReason('');
              setDisposition('');
              setOwner('');
              setPhoto(null);
            }}
            className="flex-1 bg-[#F4F4F6] hover:bg-[#EBEBEF] text-[#353750] font-bold flex items-center justify-center gap-2 uppercase transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-lg">close</span>
            <span>Reset Fields</span>
          </button>
          <button 
            type="button"
            onClick={handleFinalize}
            className="flex-[3] text-white font-bold flex items-center justify-center gap-2 uppercase transition-all active:scale-[0.99] border-l border-[#E0E0EC]"
            style={{ background: '#F05731' }}
            onMouseEnter={e => e.currentTarget.style.background = '#D94520'}
            onMouseLeave={e => e.currentTarget.style.background = '#F05731'}
          >
            <span className="material-symbols-outlined text-lg">save</span>
            <span>Finalize Red-Tag</span>
          </button>
        </div>
      </div>
    </div>
  );
}
