import React, { useState } from 'react'
import ProgressBar from './ProgressBar'
import { removeTask } from '../utils/storage'

export default function TaskCard({ task, dateStr, onProgressChange, onRemove }) {
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div className="card" style={{ padding: '14px 18px' }}>
      <div className="card-header">
        <div>
          <div className="card-title" style={{ textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.6 : 1 }}>
            {task.title}
          </div>
          {task.description && (
            <div className="card-meta" style={{ marginTop: '4px' }}>{task.description}</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {task.timeEstimate && <span className="card-meta">⏱ {task.timeEstimate}</span>}
          {task.deadline && <span className="card-meta">📅 {task.deadline}</span>}
          <button className="btn btn-sm btn-secondary" onClick={() => setShowSlider(!showSlider)}>
            {showSlider ? 'Hide' : `${task.progress}%`}
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => onRemove(dateStr, task.id)}>✕</button>
        </div>
      </div>

      {showSlider && (
        <div className="slider-container">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={task.progress}
            onChange={(e) => onProgressChange(dateStr, task.id, parseInt(e.target.value))}
          />
          <span className="slider-value">{task.progress}%</span>
        </div>
      )}

      {!showSlider && (
        <ProgressBar progress={task.progress} size="small" />
      )}
    </div>
  )
}
