import React from 'react';

export default function Dashboard({ audits, redTags, actionItems, onNewAuditTrigger, onSelectView, zones = [], pendingCount = 0 }) {
  // 1. Calculate metrics
  const totalAudits = audits.length;
  const avgScore = totalAudits > 0 
    ? Math.round(audits.reduce((acc, curr) => acc + curr.score, 0) / totalAudits)
    : 85; // Fallback default score if no audits yet

  const openActionsCount = actionItems.filter(item => item.status === 'Open').length;
  const activeRedTagsCount = redTags.filter(tag => tag.status === 'Active').length;

  // Map scores from actual completed audits if available
  const mappedZones = zones.map(z => {
    // Generate a default mock score if no audit is registered yet
    const defaultScore = z.name.includes('ZONE B') ? 92 : z.name.includes('ZONE A') ? 88 : z.name.includes('LINE 1') ? 79 : 85;
    
    const zoneAudits = audits.filter(a => a.zone.toUpperCase().includes(z.name.toUpperCase()));
    if (zoneAudits.length > 0) {
      const score = Math.round(zoneAudits.reduce((acc, curr) => acc + curr.score, 0) / zoneAudits.length);
      return { ...z, score };
    }
    return { ...z, score: defaultScore };
  });

  const belowTargetCount = mappedZones.filter(z => z.score < 80).length;

  // Leaderboard lists
  const sortedZones = [...mappedZones].sort((a, b) => b.score - a.score);
  const bestZones = sortedZones.slice(0, 3);
  const worstZone = sortedZones[sortedZones.length - 1];

  const getHeatmapColor = (score) => {
    if (score >= 90) return 'bg-safety-green/20 border-safety-green text-safety-green';
    if (score >= 80) return 'bg-primary-container/20 border-primary-container text-primary-container';
    return 'bg-safety-red/20 border-safety-red text-safety-red';
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Summary Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        {/* Factory Score Card */}
        <div className="bg-white border border-[#E0E0EC] p-4 flex flex-col justify-between h-32 relative overflow-hidden group rounded-xl shadow-sm">
          <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-[#353750]">leaderboard</span>
          </div>
          <span className="text-[11px] font-bold text-[#6B6E8A] uppercase tracking-widest">Global Factory Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[#2E7D32]">{avgScore}%</span>
            <span className="text-[#2E7D32] flex items-center text-xs font-bold">
              <span className="material-symbols-outlined text-sm">arrow_upward</span> 2.4%
            </span>
          </div>
        </div>

        {/* Zones Below Target */}
        <div className="bg-white border border-[#E0E0EC] p-4 flex flex-col justify-between h-32 relative overflow-hidden group rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-[#D32F2F] uppercase tracking-widest">Zones Below Target (&lt;80%)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[#D32F2F]">{belowTargetCount}</span>
            <span className="text-[#6B6E8A] text-xs">/ {zones.length} TOTAL</span>
          </div>
          <div className="w-full bg-[#F0F0F8] h-1.5 mt-1 rounded-full overflow-hidden">
            <div className="bg-[#D32F2F] h-1.5 transition-all rounded-full" style={{ width: `${(belowTargetCount / zones.length) * 100}%` }} />
          </div>
        </div>

        {/* Open Actions */}
        <div className="bg-white border border-[#E0E0EC] p-4 flex flex-col justify-between h-32 relative overflow-hidden group rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-[#6B6E8A] uppercase tracking-widest">Open Corrective Actions / Tags</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[#353750]">{openActionsCount}</span>
            <span className="text-[#F05731] font-bold uppercase text-xs ml-2">{activeRedTagsCount} Active Tags</span>
          </div>
        </div>

        {/* Weekly Audits */}
        <div className="bg-white border border-[#E0E0EC] p-4 flex flex-col justify-between h-32 relative overflow-hidden group rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-[#6B6E8A] uppercase tracking-widest">Audits Completed</span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[#353750]">{totalAudits}</span>
            <span className="text-[#6B6E8A] text-xs ml-2">Floor Registered</span>
          </div>
        </div>

        {/* Pending Access Requests */}
        {pendingCount > 0 && (
          <button
            onClick={() => onSelectView('ADMIN')}
            className="bg-[#FFF3E0] border-2 border-[#F05731]/40 p-4 flex flex-col justify-between h-32 relative overflow-hidden group rounded-xl hover:bg-[#FFF0E8] transition-colors text-left w-full shadow-sm"
          >
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-30 transition-opacity">
              <span className="material-symbols-outlined text-6xl text-[#F05731]">person_add</span>
            </div>
            <span className="text-[11px] font-bold text-[#F05731] uppercase tracking-widest">⚠ Pending Access Requests</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#F05731]">{pendingCount}</span>
              <span className="text-[#F05731] text-xs font-bold">Awaiting Approval</span>
            </div>
            <span className="text-[9px] text-[#F05731]/70 uppercase font-bold">Click to review →</span>
          </button>
        )}
      </section>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        {/* Heatmap */}
        <section className="lg:col-span-8 bg-white border border-[#E0E0EC] flex flex-col rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E0E0EC] flex flex-wrap justify-between items-center gap-2">
            <h2 className="font-bold text-[#353750] uppercase text-sm tracking-wide">Live Factory Floor Heatmap</h2>
            <div className="flex gap-3">
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#2E7D32]"><div className="w-2 h-2 bg-[#2E7D32] rounded-full"/>&gt;90%</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#FAB931]"><div className="w-2 h-2 bg-[#FAB931] rounded-full"/>80-90%</span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-[#D32F2F]"><div className="w-2 h-2 bg-[#D32F2F] rounded-full"/>&lt;80%</span>
            </div>
          </div>
          <div className="p-4 flex-1 min-h-[300px]">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 w-full h-full">
              {mappedZones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => onNewAuditTrigger(zone.name)}
                  className={`border-2 p-3 flex flex-col justify-end cursor-pointer transition-all hover:scale-[1.02] rounded-lg ${getHeatmapColor(zone.score)}`}
                >
                  <span className="text-[9px] font-bold tracking-tight uppercase leading-none mb-1">{zone.name}</span>
                  <span className="text-lg font-black leading-none">{zone.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <section className="lg:col-span-4 bg-white border border-[#E0E0EC] flex flex-col rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#E0E0EC]">
            <h2 className="font-bold text-[#353750] uppercase text-sm tracking-wide">Zone Performance</h2>
          </div>
          <div className="overflow-y-auto flex-1">
            <div className="divide-y divide-[#F0F0F8]">
              {bestZones.map((z, idx) => (
                <div key={z.id} className="p-4 flex items-center justify-between hover:bg-[#F4F4F6] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[#2E7D32] font-bold w-6 text-sm">0{idx + 1}</span>
                    <div>
                      <p className="font-bold text-[#353750] text-sm uppercase leading-none">{z.name}</p>
                      <p className="text-[10px] text-[#6B6E8A] mt-0.5">Rank {idx + 1}</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#2E7D32] text-base">{z.score}%</span>
                </div>
              ))}
              {worstZone && (
                <div className="p-4 flex items-center justify-between bg-[#FFF5F3]">
                  <div className="flex items-center gap-3">
                    <span className="text-[#D32F2F] font-bold w-6 text-sm">LOW</span>
                    <div>
                      <p className="font-bold text-[#353750] text-sm uppercase leading-none">{worstZone.name}</p>
                      <p className="text-[10px] text-[#D32F2F] font-bold mt-0.5">Attention Req.</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#D32F2F] text-base">{worstZone.score}%</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Trend Chart */}
      <section className="bg-white border border-[#E0E0EC] p-6 rounded-xl shadow-sm mb-4">
        <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
          <div>
            <h2 className="font-bold text-[#353750] uppercase text-sm tracking-wide">8-Week 5S Performance Trend</h2>
            <p className="text-[#6B6E8A] text-xs mt-0.5">Composite plant-wide audit scores</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#2E7D32] rounded-sm"/>
              <span className="text-[11px] uppercase font-bold text-[#6B6E8A]">Target (85%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-[#353750] rounded-sm"/>
              <span className="text-[11px] uppercase font-bold text-[#6B6E8A]">Actual</span>
            </div>
          </div>
        </div>
        <div className="h-48 w-full flex items-end gap-2 px-2 relative border-b border-[#E0E0EC] pb-2">
          <div className="absolute bottom-[85%] left-0 right-0 border-t border-dashed border-[#2E7D32]/40 z-0" />
          {[78, 80, 79, 88, 86, 85, 91, avgScore].map((val, idx) => {
            const isTargetMet = val >= 85;
            return (
              <div
                key={idx}
                className="flex-1 relative group rounded-t transition-all hover:brightness-110 cursor-pointer"
                style={{ height: `${val}%`, backgroundColor: isTargetMet ? '#353750' : '#D0D0DE' }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-[#E0E0EC] px-2 py-1 text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-md text-[#353750] font-bold">
                  W{idx + 1}: {val}%
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-3 px-2 text-[9px] font-bold text-[#B0B0C8] uppercase">
          {['Wk 28','Wk 29','Wk 30','Wk 31','Wk 32','Wk 33','Wk 34','Wk 35'].map(w => <span key={w}>{w}</span>)}
        </div>
      </section>

      {/* FAB */}
      <button
        onClick={() => onSelectView('CHECKLIST')}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 shadow-xl"
        style={{ background: '#353750' }}
        onMouseEnter={e => e.currentTarget.style.background = '#23253A'}
        onMouseLeave={e => e.currentTarget.style.background = '#353750'}
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>
    </div>
  );
}
