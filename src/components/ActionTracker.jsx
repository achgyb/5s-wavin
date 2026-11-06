import React, { useState } from 'react';

export default function ActionTracker({ actionItems, onUpdateActionStatus, onCreateActionItem }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAction, setNewAction] = useState({
    title: '',
    severity: 'MEDIUM',
    location: 'ZONE B - FABRICATION',
    assignedTo: 'J. CHEN',
    dueDate: '2026-07-15'
  });

  const todoItems = actionItems.filter(item => item.status === 'TO DO');
  const inProgressItems = actionItems.filter(item => item.status === 'IN PROGRESS');
  const doneItems = actionItems.filter(item => item.status === 'DONE');

  const handleCreateAction = (e) => {
    e.preventDefault();
    if (!newAction.title) {
      alert('Please fill out the action description.');
      return;
    }

    const item = {
      id: `AC-${Math.floor(10000 + Math.random() * 90000)}`,
      title: newAction.title,
      severity: newAction.severity,
      location: newAction.location,
      assignedTo: newAction.assignedTo,
      dueDate: newAction.dueDate,
      status: 'TO DO'
    };

    onCreateActionItem(item);
    setShowCreateModal(false);
    setNewAction({
      title: '',
      severity: 'MEDIUM',
      location: 'ZONE B - FABRICATION',
      assignedTo: 'J. CHEN',
      dueDate: '2026-07-15'
    });
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-safety-red text-white';
      case 'PRIORITY':
        return 'bg-primary-container text-on-primary-container';
      case 'RESOLVED':
        return 'bg-safety-green text-white';
      default:
        return 'bg-safety-orange text-black';
    }
  };

  const renderCard = (item) => {
    return (
      <div 
        key={item.id} 
        className="bg-surface-container-high border border-border-gray p-3 flex flex-col gap-3 group active:scale-[0.99] transition-all rounded shadow-md"
      >
        <div className="flex justify-between items-start">
          <span className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm ${getSeverityBadge(item.status === 'DONE' ? 'RESOLVED' : item.severity)}`}>
            {item.status === 'DONE' ? 'RESOLVED' : item.severity}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-secondary font-bold font-mono">{item.id}</span>
            <span className="material-symbols-outlined text-secondary text-sm drag-handle select-none">drag_indicator</span>
          </div>
        </div>

        <div className={`font-body-md text-sm ${item.status === 'DONE' ? 'text-secondary line-through' : 'text-on-surface'}`}>
          {item.title}
        </div>

        {item.pillar && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/30 bg-primary-container/20 px-1.5 py-0.5 rounded">
              {item.pillar}
            </span>
          </div>
        )}

        {item.photoUrl && (
          <div className="industrial-border relative w-full aspect-video overflow-hidden border border-border-gray rounded bg-black flex items-center justify-center mt-2">
            <img src={item.photoUrl} alt="Evidence" className="w-full h-full object-cover opacity-80" />
            <div className="absolute bottom-1 right-1 bg-black/60 px-1 text-[8px] text-white">EVIDENCE FILE</div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-label-sm text-secondary uppercase text-[10px]">
            <span className="material-symbols-outlined text-xs">location_on</span>
            {item.location}
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-gray">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-surface-variant flex items-center justify-center rounded">
                <span className="material-symbols-outlined text-xs">person</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-on-surface">{item.assignedTo}</span>
            </div>
            <div className={`text-[10px] font-bold flex items-center gap-1 ${item.status === 'DONE' ? 'text-secondary' : 'text-safety-red'}`}>
              <span className="material-symbols-outlined text-xs">event</span>
              {item.dueDate}
            </div>
          </div>
        </div>

        {/* Action Status Move Toggles */}
        <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-border-gray/30">
          {item.status === 'TO DO' && (
            <button
              onClick={() => onUpdateActionStatus(item.id, 'IN PROGRESS')}
              className="text-[9px] font-bold uppercase bg-primary-container/20 text-primary hover:bg-primary-container hover:text-on-primary-container px-2 py-1 rounded transition-colors"
            >
              Start Task
            </button>
          )}
          {item.status === 'IN PROGRESS' && (
            <button
              onClick={() => onUpdateActionStatus(item.id, 'DONE')}
              className="text-[9px] font-bold uppercase bg-safety-green/20 text-safety-green hover:bg-safety-green hover:text-white px-2 py-1 rounded transition-colors"
            >
              Complete
            </button>
          )}
          {item.status !== 'TO DO' && (
            <button
              onClick={() => onUpdateActionStatus(item.id, 'TO DO')}
              className="text-[9px] font-bold uppercase bg-surface-variant text-secondary hover:bg-border-gray px-2 py-1 rounded transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full relative p-margin-mobile md:p-margin-desktop max-w-7xl mx-auto pb-24">
      {/* Kanban Board Container */}
      <section className="flex-grow overflow-x-auto min-h-[500px]">
        <div className="flex gap-gutter h-full min-w-[900px] gap-4">
          
          {/* TO DO Column */}
          <div className="flex-1 flex flex-col bg-surface-container-low border border-border-gray p-3 rounded">
            <div className="flex items-center justify-between mb-4 px-2 py-2 border-b-2 border-safety-orange">
              <h3 className="font-headline-md text-headline-md uppercase tracking-widest text-on-surface flex items-center gap-2">
                OPEN FINDINGS
                <span className="text-label-sm bg-surface-variant px-2 py-0.5 rounded text-secondary text-xs">
                  {todoItems.length}
                </span>
              </h3>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="text-primary hover:bg-surface-variant h-8 w-8 flex items-center justify-center rounded"
                title="Add Manual Finding"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
              {todoItems.map(renderCard)}
              {todoItems.length === 0 && (
                <div className="text-center py-8 text-secondary font-label-sm uppercase text-xs">No pending findings</div>
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="flex-1 flex flex-col bg-surface-container-low border border-border-gray p-3 rounded">
            <div className="flex items-center justify-between mb-4 px-2 py-2 border-b-2 border-primary-container">
              <h3 className="font-headline-md text-headline-md uppercase tracking-widest text-on-surface flex items-center gap-2">
                IN PROGRESS
                <span className="text-label-sm bg-surface-variant px-2 py-0.5 rounded text-secondary text-xs">
                  {inProgressItems.length}
                </span>
              </h3>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
              {inProgressItems.map(renderCard)}
              {inProgressItems.length === 0 && (
                <div className="text-center py-8 text-secondary font-label-sm uppercase text-xs">No active tasks</div>
              )}
            </div>
          </div>

          {/* DONE Column */}
          <div className="flex-1 flex flex-col bg-surface-container-low border border-border-gray p-3 rounded">
            <div className="flex items-center justify-between mb-4 px-2 py-2 border-b-2 border-safety-green">
              <h3 className="font-headline-md text-headline-md uppercase tracking-widest text-on-surface flex items-center gap-2">
                DONE
                <span className="text-label-sm bg-surface-variant px-2 py-0.5 rounded text-secondary text-xs">
                  {doneItems.length}
                </span>
              </h3>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 opacity-80 hover:opacity-100 transition-opacity">
              {doneItems.map(renderCard)}
              {doneItems.length === 0 && (
                <div className="text-center py-8 text-secondary font-label-sm uppercase text-xs">No completed actions</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAB to add a new corrective action item */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-margin-mobile right-margin-mobile lg:bottom-margin-desktop lg:right-margin-desktop w-14 h-14 bg-primary-container text-on-primary-container rounded shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 border-2 border-border-gray hover:border-primary-fixed-dim"
      >
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
      </button>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-surface-container border border-border-gray p-6 w-full max-w-md rounded flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-border-gray pb-2">
              <h3 className="font-headline-md text-headline-md uppercase text-primary">Log Corrective Action</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-secondary hover:text-safety-red"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase font-bold text-secondary">Description</label>
                <textarea
                  value={newAction.title}
                  onChange={(e) => setNewAction(prev => ({ ...prev, title: e.target.value }))}
                  rows="3"
                  className="w-full bg-surface-container-highest border-b-2 border-border-gray focus:border-primary-container text-on-surface p-2 outline-none resize-none font-body-md"
                  placeholder="Describe the problem and solution required..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-secondary">Severity</label>
                  <select
                    value={newAction.severity}
                    onChange={(e) => setNewAction(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full bg-surface-container-highest border-b-2 border-border-gray text-on-surface p-2 outline-none uppercase font-label-md"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="PRIORITY">PRIORITY</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-secondary">Due Date</label>
                  <input
                    type="date"
                    value={newAction.dueDate}
                    onChange={(e) => setNewAction(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full bg-surface-container-highest border-b-2 border-border-gray text-on-surface p-2 outline-none font-label-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-secondary">Location</label>
                  <select
                    value={newAction.location}
                    onChange={(e) => setNewAction(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-surface-container-highest border-b-2 border-border-gray text-on-surface p-2 outline-none uppercase font-label-md"
                  >
                    <option value="ZONE B - FABRICATION">ZONE B - FABRICATION</option>
                    <option value="ZONE A - LOGISTICS">ZONE A - LOGISTICS</option>
                    <option value="ZONE C - ASSEMBLY">ZONE C - ASSEMBLY</option>
                    <option value="ZONE B - MACHINING">ZONE B - MACHINING</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase font-bold text-secondary">Assigned To</label>
                  <input
                    type="text"
                    value={newAction.assignedTo}
                    onChange={(e) => setNewAction(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full bg-surface-container-highest border-b-2 border-border-gray text-on-surface p-2 outline-none uppercase font-label-md"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-touch-target-min bg-primary-container text-on-primary-container font-headline-md text-headline-md uppercase tracking-widest mt-4 rounded hover:brightness-105 active:scale-98 transition-all"
              >
                Log Corrective Action
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
