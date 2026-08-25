import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  setTaskProgress, removeTask, toggleSubtask, addSubtask, removeSubtask
} from '../utils/storage'

const SECTION_COLORS = {
  'Core Engineering': 'tag-core',
  'Project': 'tag-project',
  'Job': 'tag-job',
  'Market Analysis': 'tag-market',
};

export default function TaskCard({ task, dateStr, refresh }) {
  const [expanded, setExpanded] = useState(false);
  const [newSub, setNewSub] = useState('');
  const [showAddSub, setShowAddSub] = useState(false);

  const done = task.subtasks ? task.subtasks.filter(s => s.completed).length : 0;
  const total = task.subtasks ? task.subtasks.length : 0;

  const handleProgress = (val) => {
    setTaskProgress(dateStr, task.id, parseInt(val));
    refresh();
  };

  const handleToggleComplete = () => {
    setTaskProgress(dateStr, task.id, task.completed ? 0 : 100);
    refresh();
  };

  const handleToggleSub = (stId) => {
    toggleSubtask(dateStr, task.id, stId);
    refresh();
  };

  const handleAddSub = () => {
    if (!newSub.trim()) return;
    addSubtask(dateStr, task.id, newSub.trim());
    setNewSub('');
    setShowAddSub(false);
    refresh();
  };

  const handleRemoveSub = (stId) => {
    removeSubtask(dateStr, task.id, stId);
    refresh();
  };

  const handleRemove = () => {
    if (confirm('Delete this task?')) {
      removeTask(dateStr, task.id);
      refresh();
    }
  };

  return (
    <div className="task-card">
      <div className="task-card-header">
        <div className={`task-checkbox ${task.completed ? 'done' : ''}`} onClick={handleToggleComplete}>
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

          {/* Progress */}
          <div className="progress-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="progress-track" style={{ flex: 1 }}>
                <div className={`progress-fill ${task.progress > 75 ? 'hot' : task.progress > 30 ? 'warm' : 'cold'}`} style={{ width: `${task.progress}%` }} />
              </div>
              <input
                type="range" min="0" max="100" step="5" value={task.progress}
                onChange={(e) => handleProgress(e.target.value)}
                style={{ width: 80, accentColor: 'var(--yellow)' }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--yellow-dark)', minWidth: 32, textAlign: 'right' }}>{task.progress}%</span>
            </div>
          </div>
        </div>

        <div className="task-card-actions">
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
                <div key={st.id} className="subtask-item">
                  <div className={`subtask-check ${st.completed ? 'done' : ''}`} onClick={() => handleToggleSub(st.id)}>
                    {st.completed && '✓'}
                  </div>
                  <span className={`subtask-title ${st.completed ? 'done' : ''}`}>{st.title}</span>
                  <button className="btn-icon" style={{ width: 22, height: 22, fontSize: '0.6rem', border: 'none' }} onClick={() => handleRemoveSub(st.id)}>✕</button>
                </div>
              ))}

              {showAddSub ? (
                <div className="subtask-input-row">
                  <input className="form-input" placeholder="Subtask title..." value={newSub} onChange={e => setNewSub(e.target.value)}
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
              <input className="form-input" placeholder="Subtask title..." value={newSub} onChange={e => setNewSub(e.target.value)}
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
