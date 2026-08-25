import React, { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, parseISO, isToday } from 'date-fns'
import { ensureWeek, getWeekOverview, getDatesInWeek, getCurrentWeekId, getDayOverview, enforceHardDayMinimum, getWeekDayTypes, setDayType, swapDayTypes, getAllDayTypes, getDay } from '../utils/storage'
import ProgressBar from './ProgressBar'

export default function WeekView({ weekId: propWeekId, onNavigateToDay }) {
  const [weekId, setWeekId] = useState(propWeekId || getCurrentWeekId());
  const [overview, setOverview] = useState(null);
  const [dayTypes, setDayTypesState] = useState({});
  const [showSwap, setShowSwap] = useState(false);
  const [swapSource, setSwapSource] = useState(null);

  const dates = getDatesInWeek(weekId);
  const dayTypesList = getAllDayTypes();
  const today = getToday();

  useEffect(() => {
    refresh();
  }, [weekId]);

  useEffect(() => {
    if (propWeekId) setWeekId(propWeekId);
  }, [propWeekId]);

  const refresh = () => {
    const ym = weekId.substring(0, 7);
    ensureWeek(ym, weekId);
    setOverview(getWeekOverview(weekId));
    setDayTypesState(getWeekDayTypes(weekId));
  };

  const handleDayTypeChange = (dateStr, type) => {
    setDayType(dateStr, type);
    refresh();
  };

  const handleSwap = (targetDate) => {
    if (swapSource && swapSource !== targetDate) {
      swapDayTypes(swapSource, targetDate);
      setShowSwap(false);
      setSwapSource(null);
      refresh();
    }
  };

  const hasMinHard = enforceHardDayMinimum(weekId);

  const weekStart = parseISO(weekId);
  const weekEnd = addDays(weekStart, 6);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Week View</h1>
            <p>{format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm btn-secondary" onClick={() => { const prev = addDays(parseISO(weekId), -7); setWeekId(format(startOfWeek(prev, { weekStartsOn: 1 }), 'yyyy-MM-dd')); }}>← Prev</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setWeekId(getCurrentWeekId())}>This Week</button>
            <button className="btn btn-sm btn-secondary" onClick={() => { const next = addDays(parseISO(weekId), 7); setWeekId(format(startOfWeek(next, { weekStartsOn: 1 }), 'yyyy-MM-dd')); }}>Next →</button>
          </div>
        </div>
      </div>

      {/* Week Summary */}
      {overview && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600 }}>Week Summary</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {overview.completedTasks}/{overview.totalTasks} tasks • {Math.round(overview.avgProgress)}% avg
            </span>
          </div>
          <ProgressBar progress={overview.avgProgress} />
          {!hasMinHard && overview.totalTasks > 0 && (
            <div className="conflict-warning" style={{ marginTop: '12px' }}>
              ⚠️ You need at least 2 hard days this week. Currently: {Object.values(dayTypes).filter(t => t === 'hard').length} hard day(s).
            </div>
          )}
        </div>
      )}

      {/* Day Type Allocation */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Day Type Allocation</span>
          <button className="btn btn-sm btn-secondary" onClick={() => { setShowSwap(!showSwap); setSwapSource(null); }}>
            🔄 Swap Days
          </button>
        </div>

        <div className="grid-7">
          {dates.map(dateStr => {
            const d = parseISO(dateStr);
            const dt = dayTypes[dateStr];
            const dayOverview = getDayOverview(dateStr);
            const isCurrentDay = dateStr === today;
            const isSwapSource = swapSource === dateStr;

            return (
              <div
                key={dateStr}
                className={`day-card ${isCurrentDay ? 'selected' : ''}`}
                onClick={() => {
                  if (showSwap) {
                    if (!swapSource) setSwapSource(dateStr);
                    else handleSwap(dateStr);
                  } else {
                    onNavigateToDay(dateStr);
                  }
                }}
                style={{
                  border: isSwapSource ? '2px solid var(--accent)' : undefined,
                  cursor: showSwap ? 'pointer' : 'pointer'
                }}
              >
                <div className="day-name">{format(d, 'EEE')}</div>
                <div className="day-date">{format(d, 'MMM d')}</div>
                {dt && (
                  <span className={`day-type-badge day-type-${dt}`}>
                    {dt}
                  </span>
                )}
                {dayOverview.total > 0 && (
                  <div className="task-count" style={{ marginTop: '6px' }}>
                    {dayOverview.completed}/{dayOverview.total} done
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-day detail cards */}
      <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Day Details</h3>
      {dates.map(dateStr => {
        const d = parseISO(dateStr);
        const dayOverview = getDayOverview(dateStr);
        const dt = dayTypes[dateStr];

        if (dayOverview.total === 0) return null;

        return (
          <div key={dateStr} className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigateToDay(dateStr)}>
            <div className="card-header">
              <div>
                <span className="card-title">{format(d, 'EEEE, MMM d')}</span>
                {dt && <span className={`day-type-badge day-type-${dt}`} style={{ marginLeft: '8px' }}>{dt}</span>}
              </div>
              <span className="card-meta">{dayOverview.completed}/{dayOverview.total} tasks</span>
            </div>
            <ProgressBar progress={dayOverview.avgProgress} size="small" />
          </div>
        );
      })}

      {dates.every(d => getDayOverview(d).total === 0) && (
        <div className="empty-state">
          <div className="icon">📅</div>
          <p>No tasks this week. Start by planning your days!</p>
        </div>
      )}
    </div>
  )
}
