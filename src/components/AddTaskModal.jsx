import React, { useState } from 'react'
import { getAllSections, getTemplates, addTemplate, removeTemplate } from '../utils/storage'
import { addTask } from '../utils/storage'

const SECTIONS = getAllSections();

export default function AddTaskModal({ dateStr, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState('Core Engineering');
  const [deadline, setDeadline] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSub, setNewSub] = useState('');
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [templates, setTemplates] = useState(getTemplates());
  const [step, setStep] = useState('form'); // form | confirm

  const addSubtaskInput = () => {
    if (!newSub.trim()) return;
    setSubtasks([...subtasks, { title: newSub.trim() }]);
    setNewSub('');
  };

  const removeSubtaskInput = (idx) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const loadTemplate = (tpl) => {
    setTitle(tpl.title);
    setDescription(tpl.description || '');
    setSection(tpl.section);
    setDeadline(tpl.deadline || '');
    setTimeEstimate(tpl.timeEstimate || '');
    setUseTemplate(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    setStep('confirm');
  };

  const confirmAdd = () => {
    addTask(dateStr, {
      title, description, section, deadline, timeEstimate,
      subtasks: subtasks.map(s => ({ title: s.title }))
    });
    if (saveTemplate) {
      addTemplate({ title, description, section, deadline, timeEstimate });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{step === 'form' ? 'New Task' : '⚠️ Confirm Timeline'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {step === 'form' ? (
          <>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <button className={`btn btn-sm ${!useTemplate ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setUseTemplate(false)}>New Task</button>
                <button className={`btn btn-sm ${useTemplate ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setUseTemplate(true)}>From Template ({templates.length})</button>
              </div>

              {useTemplate ? (
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {templates.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>No templates yet</p>}
                  {templates.map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', marginBottom: 6, cursor: 'pointer' }}
                      onClick={() => loadTemplate(t)}>
                      <div><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.title}</div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.section}</div></div>
                      <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); removeTemplate(t.id); setTemplates(getTemplates()); }}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional details..." rows={2} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Section</label>
                    <select className="form-select" value={section} onChange={e => setSection(e.target.value)}>
                      {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Deadline</label>
                      <input className="form-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Time Estimate</label>
                      <input className="form-input" value={timeEstimate} onChange={e => setTimeEstimate(e.target.value)} placeholder="e.g. 2 hours" />
                    </div>
                  </div>

                  {/* Subtasks */}
                  <div className="form-group">
                    <label className="form-label">Subtasks</label>
                    {subtasks.map((st, i) => (
                      <div key={i} className="subtask-input-row">
                        <input className="form-input" value={st.title} readOnly style={{ padding: '6px 10px', fontSize: '0.78rem' }} />
                        <button className="remove-sub" onClick={() => removeSubtaskInput(i)}>✕</button>
                      </div>
                    ))}
                    <div className="subtask-input-row">
                      <input className="form-input" value={newSub} onChange={e => setNewSub(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSubtaskInput()}
                        placeholder="Add subtask..." style={{ padding: '6px 10px', fontSize: '0.78rem' }} />
                      <button className="btn btn-ghost btn-sm" onClick={addSubtaskInput}>+ Add</button>
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={saveTemplate} onChange={e => setSaveTemplate(e.target.checked)} style={{ width: 'auto' }} />
                    Save as reusable template
                  </label>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Continue →</button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-body">
              <div style={{ padding: '8px 0', fontSize: '0.88rem', lineHeight: 1.7 }}>
                <p>Task: <strong>{title}</strong></p>
                <p>Date: <strong>{dateStr}</strong></p>
                <p>Section: <strong>{section}</strong></p>
                {deadline && <p>Deadline: <strong>{deadline}</strong></p>}
                {timeEstimate && <p>Estimate: <strong>{timeEstimate}</strong></p>}
                {subtasks.length > 0 && <p>Subtasks: <strong>{subtasks.length}</strong></p>}
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-xs)', padding: '10px 14px', marginTop: 14, fontSize: '0.8rem', color: '#92400E' }}>
                  ⚠️ Timeline will be locked after confirmation. Ensure the time allocated is sufficient.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setStep('form')}>← Go Back</button>
              <button className="btn btn-primary" onClick={confirmAdd}>✓ Confirm & Create</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
