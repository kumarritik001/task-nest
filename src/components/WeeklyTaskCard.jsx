import React, { useState } from 'react'
import { toggleWeeklySubtask, addWeeklySubtask, setWeeklyTaskProgress, removeWeeklyTask,
         toggleMonthlySubtask, addMonthlySubtask, setMonthlyTaskProgress, removeMonthlyTask, moveSubtaskToDay } from '../utils/storage'

const SECTION_COLORS = {
  'Core Engineering': 'tag-core',
  'Project': 'tag-project',
  'Job': 'tag-job',
  'Market Analysis': 'tag-market',
};

export default function WeeklyTaskCard({ task, weekId, refresh, onMoveToDay, type = 'weekly' }) {
  const [expanded, setExpanded] = useState(false);
  const [newSub, setNewSub] = useState('');
  const [showAddSub, setShowAddSub] = useState(false);
  const [moveSubId, setMoveSubId] = useState(null);
  const [moveDate, setMoveDate] = useState('');

  const isWeekly = type === 'weekly';
  const done = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
  const total = task.subtasks ? task.subtasks.length : 0;

  const handleToggleSub = (stId) => {
    if (isWeekly) toggleWeeklySubtask(weekId, task.id, stId);
    else toggleMonthlySubtask(weekId, task.id, stId);
    refresh();
  };

  const handleAddSub = () => {
    if (!newSub.trim()) return;
    if (isWeekly) addWeeklySubtask(weekId, task.id, newSub.trim());
    else addMonthlySubtask(weekId, task.id, newSub.trim());
    setNewSub('');
    setShowAddSub(false);
    refresh();
  };

  const handleProgress = (val) => {
    if (isWeekly) setWeeklyTaskProgress(weekId, task.id, parseInt(val));
    else setMonthlyTaskProgress(weekId, task.id, parseInt(val));
    refresh();
  };

  const handleRemove = () => {
    if (confirm('Delete this task?')) {
      if (isWeekly) removeWeeklyTask(weekId, task.id);
      else removeMonthlyTask(weekId, task.id);
      refresh();
    }
  };

  const handleMoveSub = (subId) => {
    if (!moveDate) return;
    moveSubtaskToDay(weekId, task.id, subId, moveDate, isWeekly ? 'weekly' : 'monthly');
    setMoveSubId(null);
    setMoveDate('');
    refresh();
  };

  return (
    <div className="task-card" style={{ borderLeft: `3px solid ${task.completed ? 'var(--green)' : 'var(--yellow)'}` }}>
      <div className="task-card-header">
        <div className={`task-checkbox ${task.completed ? 'done' : ''}`} onClick={() => handleProgress(task.completed ? 0 : 100)}>
          {task.completed && '✓'}
        </div>
        <div className="task-card-body">
          <div className={`task-card-title ${task.completed ? 'done' : ''}`}>{task.title}</div>
          {task.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{task.description}</div>}
          <div className="task-card-meta">
            <span className={`tag ${SECTION_COLORS[task.section]}`}>{task.section}</span>
            {task.deadline && <span className="tag tag-deadline">📅 {task.deadline}</span>}
            {task.timeEstimate && <span className="tag tag-deadline">⏱ {task.timeEstimate}</span>}
            {total > 0 && <span className="tag tag-deadline">{done}/{total} subtasks</span>}
          </div>
          <div className="progress-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="progress-track" style={{ flex: 1 }}>
                <div className={`progress-fill ${task.progress > 75 ? 'hot' : task.progress > 30 ? 'warm' : 'cold'}`} style={{ width: `${task.progress}%` }} />
              </div>
              <input type="range" min="0" max="100" step="5" value={task.progress}
                onChange={(e) => handleProgress(e.target.value)}
                style={{ width: 80, accentColor: 'var(--yellow)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--yellow-dark)', minWidth: 32, textAlign: 'right' }}>{task.progress}%</span>
            </div>
          </div>
        </div>
        <div className="task-card-actions">
          <button className="btn btn-sm" style={{ background: 'var(--yellow)', color: '#000', fontSize: '0.65rem', padding: '4px 10px' }}
            onClick={() => onMoveToDay(task)}>
            → Today
          </button>
          <button className="btn-icon" title="Delete" onClick={handleRemove}>✕</button>
        </div>
      </div>

      {/* Subtasks */}
      {total > 0 || showAddSub ? (
        <div className="subtask-section">
          <button className="subtask-toggle" onClick={() => setExpanded(!expanded)}>
            {expanded ? '▾' : '▸'} {total} subtask{total !== 1 ? 's' : ''}
            {total > 0 && <span style={{ color: 'var(--green)', marginLeft: 4 }}>{done} done</span>}
          </button>
          {expanded && (
            <div className="subtask-list">
              {task.subtasks.map(st => (
                <div key={st.id} className="subtask-item" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                    <div className={`subtask-check ${st.completed ? 'done' : ''}`} onClick={() => handleToggleSub(st.id)}>
                      {st.completed && '✓'}
                    </div>
                    <span className={`subtask-title ${st.completed ? 'done' : ''}`}>{st.title}</span>
                  </div>
                  {moveSubId === st.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="date" value={moveDate} onChange={e => setMoveDate(e.target.value)}
                        style={{ fontSize: '0.65rem', padding: '2px 4px', borderRadius: 3, border: '1px solid var(--border)', width: 110 }} />
                      <button className="btn btn-sm" style={{ fontSize: '0.6rem', padding: '2px 8px', background: 'var(--yellow)', color: '#000' }}
                        onClick={() => handleMoveSub(st.id)} disabled={!moveDate}>→</button>
                      <button className="btn-icon" style={{ fontSize: '0.6rem', width: 18, height: 18 }} onClick={() => { setMoveSubId(null); setMoveDate(''); }}>✕</button>
                    </div>
                  ) : (
                    <button className="btn-icon" title="Move subtask to a day"
                      style={{ fontSize: '0.55rem', width: 20, height: 20, color: 'var(--yellow-dark)', opacity: 0.7 }}
                      onClick={() => setMoveSubId(st.id)}>→</button>
                  )}
                </div>
              ))}
              {showAddSub ? (
                <div className="subtask-input-row">
                  <input className="form-input" placeholder="Subtask..." value={newSub} onChange={e => setNewSub(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSub()} autoFocus style={{ padding: '6px 10px', fontSize: '0.78rem' }} />
                  <button className="btn btn-primary btn-sm" onClick={handleAddSub}>Add</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddSub(false); setNewSub(''); }}>✕</button>
                </div>
              ) : (
                <button className="subtask-add-btn" onClick={() => setShowAddSub(true)}>+ Add subtask</button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="subtask-section" style={{ paddingBottom: 10 }}>
          <button className="subtask-add-btn" onClick={() => setShowAddSub(true)}>+ Add subtask</button>
          {showAddSub && (
            <div className="subtask-input-row" style={{ marginTop: 6 }}>
              <input className="form-input" placeholder="Subtask..." value={newSub} onChange={e => setNewSub(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSub()} autoFocus style={{ padding: '6px 10px', fontSize: '0.78rem' }} />
              <button className="btn btn-primary btn-sm" onClick={handleAddSub}>Add</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddSub(false); setNewSub(''); }}>✕</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
