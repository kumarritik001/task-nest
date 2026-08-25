import React, { useState } from 'react'
import { getTemplates, addTemplate, removeTemplate, getAllSections, getAllDayTypes } from '../utils/storage'

export default function AddTaskModal({ dateStr, onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState('Core Engineering');
  const [deadline, setDeadline] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [templates, setTemplates] = useState(getTemplates());

  const sections = getAllSections();

  const handleSubmit = () => {
    if (!title.trim()) return;
    setShowConfirm(true);
  };

  const confirmAdd = () => {
    const task = {
      title: selectedTemplate ? selectedTemplate.title : title,
      description: selectedTemplate ? selectedTemplate.description : description,
      deadline: selectedTemplate ? selectedTemplate.deadline : deadline,
      timeEstimate: selectedTemplate ? selectedTemplate.timeEstimate : timeEstimate,
      isTemplate: false,
      templateId: selectedTemplate ? selectedTemplate.id : null,
    };

    if (saveAsTemplate && !selectedTemplate) {
      addTemplate({ title, description, section, deadline, timeEstimate });
    }

    onAdd(dateStr, selectedTemplate ? selectedTemplate.section : section, task);
    onClose();
  };

  const handleTemplateSelect = (tpl) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.title);
    setDescription(tpl.description);
    setSection(tpl.section);
    setDeadline(tpl.deadline || '');
    setTimeEstimate(tpl.timeEstimate || '');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {!showConfirm ? (
          <>
            <h2>Add Task — {dateStr}</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                className={`btn btn-sm ${!useTemplate ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setUseTemplate(false); setSelectedTemplate(null); }}
              >
                New Task
              </button>
              <button
                className={`btn btn-sm ${useTemplate ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setUseTemplate(true)}
              >
                From Template ({templates.length})
              </button>
            </div>

            {useTemplate ? (
              <div className="template-list">
                {templates.length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No templates yet. Create a task first and save it as template.
                  </div>
                )}
                {templates.map(tpl => (
                  <div
                    key={tpl.id}
                    className="template-item"
                    style={{ cursor: 'pointer', background: selectedTemplate?.id === tpl.id ? 'var(--bg-hover)' : 'transparent' }}
                    onClick={() => handleTemplateSelect(tpl)}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{tpl.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tpl.section}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); removeTemplate(tpl.id); setTemplates(getTemplates()); }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <label>Task Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                />

                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details..."
                  rows={2}
                />

                <label>Section</label>
                <select value={section} onChange={(e) => setSection(e.target.value)}>
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="grid-2">
                  <div>
                    <label>Deadline</label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Time Estimate</label>
                    <input
                      type="text"
                      value={timeEstimate}
                      onChange={(e) => setTimeEstimate(e.target.value)}
                      placeholder="e.g. 2 hours"
                    />
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="saveTemplate"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                    style={{ width: 'auto' }}
                  />
                  <label htmlFor="saveTemplate" style={{ margin: 0, fontSize: '0.78rem' }}>
                    Save as daily template (reuse later)
                  </label>
                </div>
              </>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                Add Task
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>⚠️ Confirm Timeline</h2>
            <div style={{ padding: '16px 0', fontSize: '0.88rem', lineHeight: 1.6 }}>
              <p>You're adding <strong>{selectedTemplate ? selectedTemplate.title : title}</strong> to <strong>{dateStr}</strong>.</p>
              <p style={{ marginTop: '8px' }}>Time estimate: <strong>{timeEstimate || 'Not specified'}</strong></p>
              {deadline && <p>Deadline: <strong>{deadline}</strong></p>}
              <div className="conflict-warning" style={{ marginTop: '16px' }}>
                ⚠️ This timeline is now locked. Make sure you've allocated enough time. No changes after confirmation.
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Go Back</button>
              <button className="btn btn-primary" onClick={confirmAdd}>
                ✓ Confirm & Lock Timeline
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
