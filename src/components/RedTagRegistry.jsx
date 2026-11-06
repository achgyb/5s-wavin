/**
 * RedTagRegistry — Screen #6
 * Full registry view of all red-tagged items with filtering, status management,
 * and Drive photo thumbnails. Industrial Orbia B&I theme.
 */
import React, { useState, useMemo } from 'react';

const STATUS_CONFIG = {
  Active:   { color: '#FF3B30', bg: '#FFF0EF', label: 'ACTIVE',    icon: 'local_offer' },
  Resolved: { color: '#00C853', bg: '#E8F5E9', label: 'RESOLVED',  icon: 'check_circle' },
  Pending:  { color: '#FF6D00', bg: '#FFF3E0', label: 'PENDING',   icon: 'hourglass_top' },
};

const REASON_LABELS = {
  unused:    'Unused / Redundant',
  unknown:   'Unknown Ownership',
  misplaced: 'Misplaced / Out of Area',
  damaged:   'Damaged / Defective',
};

const DISPOSITION_LABELS = {
  relocate:      'Relocate / Move',
  discard:       'Discard / Scrap',
  return:        'Return to Supplier',
  needs_review:  'Needs Supervisor Review',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="material-symbols-outlined text-sm" style={{ fontSize: 13 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function RedTagCard({ tag, onResolve, onViewPhoto }) {
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    setResolving(true);
    await onResolve(tag.id);
    setResolving(false);
  };

  return (
    <div className="bg-white border border-[#E0E0EC] rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Card top accent bar — color by status */}
      <div
        className="h-1 w-full"
        style={{ background: STATUS_CONFIG[tag.status]?.color || '#FF6D00' }}
      />

      <div className="p-5 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Photo thumbnail or placeholder */}
            <div
              className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[#E0E0EC] bg-[#F4F4F6] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => tag.photoUrl && onViewPhoto(tag)}
            >
              {tag.photoUrl ? (
                <img
                  src={tag.photoUrl}
                  alt="Red tag photo"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <div
                className={`w-full h-full items-center justify-center ${tag.photoUrl ? 'hidden' : 'flex'}`}
                style={{ display: tag.photoUrl ? 'none' : 'flex' }}
              >
                <span className="material-symbols-outlined text-[#B0B0C8] text-2xl">photo_camera</span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-base font-bold text-[#D32F2F] font-mono">{tag.id}</span>
                <StatusBadge status={tag.status} />
              </div>
              <p className="text-sm font-semibold text-[#353750] line-clamp-2 leading-snug">
                {tag.description}
              </p>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F4F4F6] rounded-xl p-3">
            <p className="text-[9px] uppercase font-bold text-[#9AA0A6] tracking-wider mb-0.5">Reason</p>
            <p className="text-xs font-bold text-[#353750] uppercase">{REASON_LABELS[tag.reason] || tag.reason || '—'}</p>
          </div>
          <div className="bg-[#F4F4F6] rounded-xl p-3">
            <p className="text-[9px] uppercase font-bold text-[#9AA0A6] tracking-wider mb-0.5">Disposition</p>
            <p className="text-xs font-bold text-[#353750] uppercase">{DISPOSITION_LABELS[tag.disposition] || tag.disposition || '—'}</p>
          </div>
          <div className="bg-[#F4F4F6] rounded-xl p-3">
            <p className="text-[9px] uppercase font-bold text-[#9AA0A6] tracking-wider mb-0.5">Owner</p>
            <p className="text-xs font-bold text-[#353750] uppercase">{tag.owner || 'Unassigned'}</p>
          </div>
          <div className="bg-[#F4F4F6] rounded-xl p-3">
            <p className="text-[9px] uppercase font-bold text-[#9AA0A6] tracking-wider mb-0.5">Timestamp</p>
            <p className="text-xs font-bold text-[#353750]">{tag.timestamp || '—'}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 py-2 px-3 bg-[#F4F4F6] rounded-xl">
          <span className="material-symbols-outlined text-[#6B6E8A] text-base">location_on</span>
          <p className="text-xs font-bold text-[#353750] uppercase">{tag.location || '—'}</p>
        </div>

        {/* Actions */}
        {tag.status === 'Active' && (
          <button
            onClick={handleResolve}
            disabled={resolving}
            className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider text-white transition-all disabled:opacity-60"
            style={{ background: '#00C853' }}
            onMouseEnter={e => !resolving && (e.currentTarget.style.background = '#00A843')}
            onMouseLeave={e => (e.currentTarget.style.background = '#00C853')}
          >
            {resolving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-base">check_circle</span>
            )}
            {resolving ? 'Resolving…' : 'Mark as Resolved'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RedTagRegistry({ redTags = [], onResolveRedTag, onNewRedTag }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterReason, setFilterReason] = useState('ALL');
  const [search, setSearch] = useState('');
  const [photoModal, setPhotoModal] = useState(null); // tag object

  const filteredTags = useMemo(() => {
    return redTags.filter(tag => {
      const matchStatus = filterStatus === 'ALL' || tag.status === filterStatus;
      const matchReason = filterReason === 'ALL' || tag.reason === filterReason;
      const q = search.toLowerCase();
      const matchSearch = !q || (
        tag.id?.toLowerCase().includes(q) ||
        tag.description?.toLowerCase().includes(q) ||
        tag.location?.toLowerCase().includes(q) ||
        tag.owner?.toLowerCase().includes(q)
      );
      return matchStatus && matchReason && matchSearch;
    });
  }, [redTags, filterStatus, filterReason, search]);

  const activeCounts = {
    total:    redTags.length,
    active:   redTags.filter(t => t.status === 'Active').length,
    resolved: redTags.filter(t => t.status === 'Resolved').length,
    pending:  redTags.filter(t => t.status === 'Pending').length,
  };

  return (
    <div className="pt-20 px-4 md:px-8 max-w-7xl mx-auto pb-32" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#353750] uppercase tracking-wide flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D32F2F] text-3xl">local_offer</span>
              Red-Tag Registry
            </h1>
            <p className="text-sm text-[#6B6E8A] font-semibold mt-1">
              All tagged items across factory zones · {activeCounts.active} active
            </p>
          </div>
          <button
            onClick={onNewRedTag}
            className="flex items-center gap-2 px-5 h-11 rounded-xl text-white font-bold uppercase text-sm tracking-wider shadow-md transition-all"
            style={{ background: '#F05731' }}
            onMouseEnter={e => e.currentTarget.style.background = '#D94520'}
            onMouseLeave={e => e.currentTarget.style.background = '#F05731'}
          >
            <span className="material-symbols-outlined text-base">add</span>
            New Red Tag
          </button>
        </div>
      </div>

      {/* ── KPI Summary Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tags', value: activeCounts.total,    color: '#353750', icon: 'tag' },
          { label: 'Active',     value: activeCounts.active,   color: '#FF3B30', icon: 'local_offer' },
          { label: 'Pending',    value: activeCounts.pending,  color: '#FF6D00', icon: 'hourglass_top' },
          { label: 'Resolved',   value: activeCounts.resolved, color: '#00C853', icon: 'check_circle' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-[#E0E0EC] rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: stat.color + '18' }}
            >
              <span className="material-symbols-outlined text-xl" style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[10px] uppercase font-bold text-[#9AA0A6] tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E0E0EC] rounded-2xl p-4 shadow-sm mb-6 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#F4F4F6] rounded-xl px-3 h-10 flex-1 min-w-[200px]">
          <span className="material-symbols-outlined text-[#6B6E8A] text-base">search</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID, description, location..."
            className="bg-transparent outline-none text-sm text-[#353750] font-semibold placeholder:font-normal placeholder:text-[#B0B0C8] w-full"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <span className="material-symbols-outlined text-[#9AA0A6] text-base">close</span>
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 bg-[#F4F4F6] rounded-xl px-3 h-10">
          <span className="material-symbols-outlined text-[#6B6E8A] text-base">filter_list</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-transparent outline-none text-sm text-[#353750] font-bold uppercase cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        {/* Reason filter */}
        <div className="flex items-center gap-2 bg-[#F4F4F6] rounded-xl px-3 h-10">
          <span className="material-symbols-outlined text-[#6B6E8A] text-base">category</span>
          <select
            value={filterReason}
            onChange={e => setFilterReason(e.target.value)}
            className="bg-transparent outline-none text-sm text-[#353750] font-bold uppercase cursor-pointer"
          >
            <option value="ALL">All Reasons</option>
            <option value="unused">Unused</option>
            <option value="unknown">Unknown</option>
            <option value="misplaced">Misplaced</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>

        <p className="text-xs text-[#9AA0A6] font-semibold ml-auto">
          {filteredTags.length} of {redTags.length} records
        </p>
      </div>

      {/* ── Tag Grid ─────────────────────────────────────────────────────────── */}
      {filteredTags.length === 0 ? (
        <div className="bg-white border border-[#E0E0EC] rounded-2xl p-16 shadow-sm text-center">
          <span className="material-symbols-outlined text-5xl text-[#D0D0DC] mb-4 block">local_offer</span>
          <p className="text-lg font-bold text-[#353750] uppercase">No Red Tags Found</p>
          <p className="text-sm text-[#9AA0A6] mt-1">
            {search || filterStatus !== 'ALL' || filterReason !== 'ALL'
              ? 'Try adjusting your filters.'
              : 'No red tags have been submitted yet.'}
          </p>
          {!search && filterStatus === 'ALL' && (
            <button
              onClick={onNewRedTag}
              className="mt-5 px-5 h-10 rounded-xl text-white font-bold uppercase text-sm"
              style={{ background: '#F05731' }}
            >
              Create First Red Tag
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTags.map(tag => (
            <RedTagCard
              key={tag.id}
              tag={tag}
              onResolve={onResolveRedTag}
              onViewPhoto={setPhotoModal}
            />
          ))}
        </div>
      )}

      {/* ── Photo Lightbox Modal ──────────────────────────────────────────────── */}
      {photoModal && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPhotoModal(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-white font-bold font-mono text-lg">{photoModal.id}</span>
                <p className="text-gray-400 text-sm mt-0.5">{photoModal.description}</p>
              </div>
              <button
                onClick={() => setPhotoModal(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-white text-xl">close</span>
              </button>
            </div>
            <img
              src={photoModal.photoUrl}
              alt={photoModal.description}
              className="w-full rounded-xl object-contain max-h-[70vh]"
            />
            <div className="mt-3 flex items-center justify-between">
              <StatusBadge status={photoModal.status} />
              <a
                href={photoModal.photoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                View in Drive
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
