import React, { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { getDatesInWeek, getToday } from '../utils/storage'

export default function MoveToDayModal({ task, weekId, month, onClose, onMove }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const isWeekly = !!weekId;
  const dates = isWeekly ? getDatesInWeek(weekId) : [];
  const today = getToday();

  // For monthly, show all dates in month
  let allDates = dates;
  if (!isWeekly && month) {
    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);
    allDates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      allDates.push(format(d, 'yyyy-MM-dd'));
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h2>Move to Day</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Move <strong>"{task.title}"</strong> to a specific day:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {allDates.map(ds => {
              const d = parseISO(ds);
              const isT = ds === today;
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDay(ds)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-xs)',
                    border: selectedDay === ds ? '2px solid var(--yellow)' : '1px solid var(--border)',
                    background: selectedDay === ds ? 'var(--yellow-bg)' : isT ? 'var(--bg-hover)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    fontWeight: isT ? 700 : 500,
                    transition: 'all 0.15s'
                  }}
                >
                  <div>{format(d, 'EEE')}</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{format(d, 'd')}</div>
                  {isT && <div style={{ fontSize: '0.55rem', color: 'var(--yellow-dark)' }}>today</div>}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--yellow-bg)', borderRadius: 'var(--radius-xs)', fontSize: '0.8rem', fontWeight: 600, color: '#92400E' }}>
              ✓ Will move to {format(parseISO(selectedDay), 'EEEE, MMM d')}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!selectedDay} onClick={() => { onMove(selectedDay); onClose(); }}>
            Move to {selectedDay ? format(parseISO(selectedDay), 'EEE d') : '...'}
          </button>
        </div>
      </div>
    </div>
  );
}
