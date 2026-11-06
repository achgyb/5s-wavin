import React, { useState, useEffect } from 'react';

/**
 * Schedule Component
 * Rethemed to the Orbia Building & Infrastructure light theme.
 * Uses Nunito font, white card layouts, grey borders, and brand color accents (Navy, Coral, Green, Gold).
 */
export default function Schedule({ schedules, onCreateSchedule, onSelectView, zones = [] }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [newSchedule, setNewSchedule] = useState({
    zone: '',
    auditor: 'J. MILLER',
    date: ''
  });

  useEffect(() => {
    if (zones && zones.length > 0 && !newSchedule.zone) {
      setNewSchedule(prev => ({ ...prev, zone: zones[0].name }));
    }
  }, [zones]);

  const handleCreateSchedule = (e) => {
    e.preventDefault();
    if (!newSchedule.date) {
      alert('Please select a date.');
      return;
    }

    const item = {
      id: `SCH-${Math.floor(10000 + Math.random() * 90000)}`,
      zone: newSchedule.zone,
      auditor: newSchedule.auditor,
      date: newSchedule.date,
      status: 'PLANNED'
    };

    onCreateSchedule(item);
    setShowCreateModal(false);
  };

  // Generate calendar days for July 2026
  // July 1st 2026 is a Wednesday (index 3)
  const daysInJuly = 31;
  const startOffset = 3;
  const calendarCells = [];

  // Previous month padding
  for (let i = 28; i <= 30; i++) {
    calendarCells.push({ dayNum: i, currentMonth: false, dateStr: `2026-06-${i}` });
  }

  // Current month
  for (let i = 1; i <= daysInJuly; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`;
    calendarCells.push({ dayNum: i, currentMonth: true, dateStr: `2026-07-${dayStr}` });
  }

  // Next month padding
  for (let i = 1; i <= 8; i++) {
    calendarCells.push({ dayNum: i, currentMonth: false, dateStr: `2026-08-0${i}` });
  }

  const handleCellClick = (cell) => {
    if (!cell.currentMonth) return;
    setSelectedDate(cell.dateStr);
    setNewSchedule(prev => ({ ...prev, date: cell.dateStr }));
    setShowCreateModal(true);
  };

  const getSchedulesForDate = (dateStr) => {
    return schedules.filter(s => s.date === dateStr);
  };

  const getStatusColor = (status) => {
    if (status === 'OVERDUE') return 'bg-[#FFEBEE] border-[#C62828] text-[#C62828] border-l-2';
    if (status === 'COMPLETED') return 'bg-[#E8F5E9] border-[#2E7D32] text-[#2E7D32] border-l-2';
    return 'bg-[#FFF3E0] border-[#E65100] text-[#E65100] border-l-2';
  };

  return (
    <div className="p-margin-mobile lg:p-margin-desktop min-h-[calc(100vh-56px)] pb-24 lg:pb-margin-desktop max-w-7xl mx-auto" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* ── Controls & Metrics Row ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6 items-end justify-between">
        <div className="w-full lg:w-auto">
          <h2 className="text-xl font-bold uppercase tracking-wider mb-3" style={{ color: '#353750' }}>JULY 2026</h2>
          <div className="flex gap-2">
            <button className="h-10 px-4 bg-white border border-[#E0E0EC] text-[#353750] hover:bg-[#F4F4F6] active:scale-95 transition-all flex items-center gap-1.5 rounded-lg font-bold text-xs shadow-sm">
              <span className="material-symbols-outlined text-base">chevron_left</span>
              PREV
            </button>
            <button className="h-10 px-6 text-white font-bold tracking-widest active:scale-95 transition-all rounded-lg text-xs shadow-sm" style={{ background: '#F05731' }}>
              TODAY
            </button>
            <button className="h-10 px-4 bg-white border border-[#E0E0EC] text-[#353750] hover:bg-[#F4F4F6] active:scale-95 transition-all flex items-center gap-1.5 rounded-lg font-bold text-xs shadow-sm">
              NEXT
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
          <div className="bg-white p-4 border border-[#E0E0EC] rounded-xl shadow-sm">
            <p className="text-[10px] font-bold text-[#6B6E8A] uppercase mb-1">Total Scheduled</p>
            <p className="text-2xl font-bold text-[#353750]">{schedules.length}</p>
          </div>
          <div className="bg-white p-4 border-l-4 border-l-[#D32F2F] border-y border-r border-[#E0E0EC] rounded-r-xl shadow-sm">
            <p className="text-[10px] font-bold text-[#D32F2F] uppercase mb-1">Overdue</p>
            <p className="text-2xl font-bold text-[#D32F2F]">
              {schedules.filter(s => s.status === 'OVERDUE').length}
            </p>
          </div>
          <div className="bg-white p-4 border-l-4 border-l-[#F05731] border-y border-r border-[#E0E0EC] rounded-r-xl shadow-sm">
            <p className="text-[10px] font-bold text-[#F05731] uppercase mb-1">Upcoming</p>
            <p className="text-2xl font-bold text-[#F05731]">
              {schedules.filter(s => s.status === 'PLANNED').length}
            </p>
          </div>
          <div className="bg-white p-4 border border-[#E0E0EC] rounded-xl shadow-sm">
            <p className="text-[10px] font-bold text-[#6B6E8A] uppercase mb-1">Compliance Rate</p>
            <p className="text-2xl font-bold text-[#2E7D32]">96%</p>
          </div>
        </div>
      </div>

      {/* ── Calendar View ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E0E0EC] overflow-x-auto rounded-2xl shadow-sm">
        <div className="min-w-[900px]">
          {/* Calendar Header Days */}
          <div className="calendar-grid border-b border-[#E0E0EC] bg-[#F4F4F6] grid grid-cols-7">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
              <div key={day} className="p-4 text-center font-bold text-[11px] text-[#353750] uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>
          {/* Calendar Content */}
          <div className="calendar-grid grid grid-cols-7">
            {calendarCells.map((cell, idx) => {
              const daySchedules = getSchedulesForDate(cell.dateStr);
              return (
                <div 
                  key={idx} 
                  onClick={() => handleCellClick(cell)}
                  className={`day-cell min-h-[105px] border border-[#E0E0EC] p-3 transition-colors cursor-pointer hover:bg-[#F4F4F6]/50 ${
                    cell.currentMonth ? 'bg-white text-[#353750]' : 'bg-[#F4F4F6]/60 text-[#B0B0C8] opacity-50 pointer-events-none'
                  }`}
                >
                  <div className="text-right text-xs font-bold">{cell.dayNum}</div>
                  <div className="mt-2 flex flex-col gap-1">
                    {daySchedules.map((sch) => (
                      <div 
                        key={sch.id} 
                        className={`p-1.5 text-[9px] font-bold uppercase leading-tight truncate rounded-lg ${getStatusColor(sch.status)}`}
                      >
                        {sch.zone.split(' - ')[1] || sch.zone}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Details Panel ─────────────────────────────────────────────────── */}
      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Audit Register */}
        <div className="xl:col-span-2 bg-white border border-[#E0E0EC] p-6 rounded-2xl shadow-sm">
          <div className="flex flex-wrap items-center justify-between mb-6 gap-2">
            <h3 className="text-base font-bold text-[#353750] uppercase tracking-wide">Scheduled Audits Register</h3>
            <button className="bg-[#F4F4F6] hover:bg-[#EBEBEF] text-[#353750] border border-[#E0E0EC] px-4 py-2 text-[10px] font-bold transition-all rounded-lg uppercase">
              EXPORT CSV
            </button>
          </div>
          <div className="space-y-4">
            {schedules.map((sch) => (
              <div 
                key={sch.id} 
                className={`flex items-center justify-between p-4 bg-[#F4F4F6] border-l-4 border-y border-r border-[#E0E0EC] rounded-r-xl shadow-xs ${
                  sch.status === 'OVERDUE' ? 'border-l-[#D32F2F]' : sch.status === 'COMPLETED' ? 'border-l-[#2E7D32]' : 'border-l-[#F05731]'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`material-symbols-outlined ${
                    sch.status === 'OVERDUE' ? 'text-[#D32F2F]' : sch.status === 'COMPLETED' ? 'text-[#2E7D32]' : 'text-[#F05731]'
                  }`}>
                    {sch.status === 'OVERDUE' ? 'warning' : sch.status === 'COMPLETED' ? 'check_circle' : 'schedule'}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#353750] uppercase">{sch.zone}</p>
                    <p className="text-[11px] text-[#6B6E8A] mt-1 font-semibold">
                      Scheduled: {sch.date} • Auditor: {sch.auditor}
                    </p>
                  </div>
                </div>
                {sch.status === 'PLANNED' && (
                  <button 
                    onClick={() => onSelectView('CHECKLIST')}
                    className="border border-[#F05731] text-[#F05731] hover:bg-[#FFF5F3] px-4 py-2 font-bold text-[10px] rounded-lg active:scale-95 transition-all uppercase"
                  >
                    Start Audit
                  </button>
                )}
                {sch.status === 'OVERDUE' && (
                  <button 
                    onClick={() => onSelectView('CHECKLIST')}
                    className="bg-[#D32F2F] text-white hover:bg-[#C62828] px-4 py-2 font-bold text-[10px] rounded-lg active:scale-95 transition-all uppercase shadow-sm"
                  >
                    Audit Now
                  </button>
                )}
                {sch.status === 'COMPLETED' && (
                  <span className="text-[#2E7D32] text-[10px] font-bold uppercase tracking-wider">DONE</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed Status Card */}
        <div className="bg-white border border-[#E0E0EC] p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#353750] uppercase mb-6 tracking-wide">Factory Status</h3>
            <div className="relative h-64 w-full bg-[#F4F4F6] border border-[#E0E0EC] flex items-center justify-center overflow-hidden rounded-xl">
              <div className="z-10 text-center px-4">
                <span className="material-symbols-outlined text-4xl text-[#353750] mb-2">precision_manufacturing</span>
                <p className="text-xs font-bold text-[#6B6E8A] uppercase tracking-widest">Zone B Live Feed</p>
                <div className="mt-4 flex gap-2 justify-center">
                  <span className="px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold border border-[#2E7D32]/10 rounded-lg">
                    OPERATIONAL
                  </span>
                  <span className="px-2.5 py-1 bg-white text-[#353750] text-[10px] font-bold border border-[#E0E0EC] rounded-lg">
                    5S SCORE: 92
                  </span>
                </div>
              </div>
              <img 
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20 pointer-events-none" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBBkBMe0lDism0wPVcvsZLrC3rmB50QbkUX7C1FaNNAbzLkbYGMr0mJPeXsPIpIcXI3XawSvKkA1mwf_f5hYddBpTFKfLCsVOWTv1Y8mcl_XGI2QS-_od7Kr8dql0OMpC6i-1dQ0X3-Q4qP9bHN8r7O8f2VJdkDPKKe3FTkqnexL8NTeMVX7bCO6p46M8bf3Btcnjz7YRj30Xomi4wkQcvtcH5FRxr-lvl85ymvA85yKymtpApqIplRy3E3CLcRam95Ov-zr5p8IExA')" }}
                alt="Factory live feed placeholder"
              />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between items-center text-xs border-b border-[#E0E0EC] pb-2 font-semibold">
              <span className="text-[#6B6E8A]">Next Site Inspection</span>
              <span className="text-[#353750]">04:30 PM Today</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-[#E0E0EC] pb-2 font-semibold">
              <span className="text-[#6B6E8A]">Assigned Inspector</span>
              <span className="text-[#353750]">Chief Officer Miller</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating Action Button (FAB) ──────────────────────────────────── */}
      <button 
        onClick={() => {
          setSelectedDate('2026-07-02');
          setNewSchedule({ zone: 'PLANT 04 - ZONE B', auditor: 'J. MILLER', date: '2026-07-02' });
          setShowCreateModal(true);
        }}
        className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 w-14 h-14 bg-[#F05731] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 group"
      >
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
        <span className="absolute right-16 bg-white text-[#353750] px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-[#E0E0EC] pointer-events-none shadow-md">
          NEW AUDIT
        </span>
      </button>

      {/* ── Create Modal ──────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#353750]/60 backdrop-blur-[4px] flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white border border-[#E0E0EC] p-6 w-full max-w-md rounded-2xl flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E0E0EC] pb-3">
              <h3 className="text-sm font-bold uppercase text-[#353750]">Schedule 5S Floor Audit</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B6E8A] hover:text-[#D32F2F] transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateSchedule} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-[#353750]">Floor Zone</label>
                <div className="relative">
                  <select
                    value={newSchedule.zone}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, zone: e.target.value }))}
                    className="w-full bg-[#F4F4F6] border-b-2 border-[#E0E0EC] text-[#353750] p-3 outline-none uppercase font-bold text-sm rounded-t-lg transition-colors appearance-none cursor-pointer focus:border-[#353750]"
                  >
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.name}>{zone.name}</option>
                    ))}
                    {zones.length === 0 && (
                      <option value="">No Registered Zones</option>
                    )}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-[#6B6E8A]">arrow_drop_down</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-[#353750]">Assigned Auditor</label>
                <input
                  type="text"
                  value={newSchedule.auditor}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, auditor: e.target.value }))}
                  className="w-full bg-[#F4F4F6] border-b-2 border-[#E0E0EC] text-[#353750] p-3 outline-none uppercase font-bold text-sm rounded-t-lg transition-colors focus:border-[#353750]"
                  placeholder="e.g. J. Miller"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-[#353750]">Scheduled Date</label>
                <input
                  type="date"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-[#F4F4F6] border-b-2 border-[#E0E0EC] text-[#353750] p-3 outline-none font-bold text-sm rounded-t-lg transition-colors focus:border-[#353750]"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 text-white font-bold text-sm uppercase tracking-widest mt-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
                style={{ background: '#F05731' }}
                onMouseEnter={e => e.currentTarget.style.background = '#D94520'}
                onMouseLeave={e => e.currentTarget.style.background = '#F05731'}
              >
                Create Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
