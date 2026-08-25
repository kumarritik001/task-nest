import React from 'react'

export default function ProgressBar({ progress, size = 'normal' }) {
  const clamped = Math.min(100, Math.max(0, progress));
  let tempClass = 'cold';
  let emoji = '❄️';
  let label = 'Just started';

  if (clamped > 75) { tempClass = 'hot'; emoji = '🔥'; label = 'Almost there!'; }
  else if (clamped > 40) { tempClass = 'warm'; emoji = '☀️'; label = 'Making progress'; }
  else if (clamped > 10) { tempClass = 'warm'; emoji = '🌤️'; label = 'Warming up'; }
  else if (clamped > 0) { label = 'Just started'; }

  const height = size === 'small' ? '6px' : size === 'large' ? '14px' : '10px';

  return (
    <div>
      <div className="progress-bar-container" style={{ height }}>
        <div
          className={`progress-bar-fill ${tempClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <span className="temp-emoji">{emoji}</span>
        <span className="temp-text">{label}</span>
      </div>
    </div>
  )
}
