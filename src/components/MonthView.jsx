import React, { useState, useEffect } from 'react'
import { format, addMonths, parseISO, startOfWeek, addDays, eachDayOfInterval, endOfMonth } from 'date-fns'
import { ensureMonth, getMonthOverview, getDatesInMonth, getCurrentMonth, getDayOverview, getDay, ensureDay } from '../utils/storage'
import ProgressBar from './ProgressBar'

export default function MonthView({ yearMonth: propYM, onNavigateToWeek, onNavigateToDay }) {
  const [yearMonth, setYearMonth] = useState(propYM || getCurrentMonth());
  const [overview, setOverview] = useState(null);

  const dates = getDatesInMonth(yearMonth);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    refresh();
  }, [yearMonth]);

  useEffect(() => {
    if (propYM) setYearMonth(propYM);
  }, [propYM]);

  const refresh = () => {
    ensureMonth(yearMonth);
    setOverview(getMonthOverview(yearMonth));
  };

  const [y, m] = yearMonth.split('-').map(Number);
  const monthDate = new Date(y, m - 1, 1);
  const weeksInMonth = [];
  const allDates = getDatesInMonth(yearMonth);
  let currentWeekStart = startOfWeek(allDates[0] ? parseISO(allDates[0]) : new Date(), { weekStartsOn: 1 });

  while (format(currentWeekStart, 'yyyy-MM') === yearMonth || weeksInMonth.length < 5) {
    const weekStart = currentWeekStart;
    const weekEnd = addDays(weekStart, 6);
    const weekDates = eachDayOfInterval({ start: weekStart, end: weekEnd })
      .filter(d => format(d, 'yyyy-MM') === yearMonth)
      .map(d => format(d, 'yyyy-MM-dd'));

    if (weekDates.length > 0) {
      weeksInMonth.push({
        id: format(weekStart, 'yyyy-MM-dd'),
        dates: weekDates,
        start: weekStart,
        end: weekEnd
      });
    }

    currentWeekStart = addDays(currentWeekStart, 7);
    if (weeksInMonth.length >= 6) break;
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>{format(monthDate, 'MMMM yyyy')}</h1>
            <p>Monthly overview and planning</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm btn-secondary" onClick={() => setYearMonth(format(addMonths(monthDate, -1), 'yyyy-MM'))}>← Prev</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setYearMonth(getCurrentMonth())}>This Month</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setYearMonth(format(addMonths(monthDate, 1), 'yyyy-MM'))}>Next →</button>
          </div>
        </div>
      </div>

      {/* Month Summary */}
      {overview && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600 }}>Month Summary</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {overview.completedTasks}/{overview.totalTasks} tasks • {Math.round(overview.avgProgress)}% avg
            </span>
          </div>
          <ProgressBar progress={overview.avgProgress} />
        </div>
      )}

      {/* Calendar Grid */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Calendar</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', padding: '4px' }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {(() => {
            const firstDay = parseISO(dates[0] || today);
            const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
            const blanks = Array(startDow).fill(null);
            return [...blanks, ...dates].map((dateStr, i) => {
              if (!dateStr) return <div key={`blank-${i}`} />;
              const d = parseISO(dateStr);
              const overview = getDayOverview(dateStr);
              const isCurrent = dateStr === today;

              return (
                <div
                  key={dateStr}
                  onClick={() => onNavigateToDay(dateStr)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: 'var(--radius-sm)',
                    border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--border-light)',
                    background: overview.total > 0 ? 'var(--bg-card)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'center',
                    minHeight: '60px',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--accent-dark)' : 'var(--text-primary)' }}>
                    {format(d, 'd')}
                  </div>
                  {overview.total > 0 && (
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {overview.completed}/{overview.total}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Weeks */}
      <h3 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Weeks</h3>
      {weeksInMonth.map(week => {
        let totalTasks = 0, completedTasks = 0, totalProgress = 0, count = 0;
        week.dates.forEach(d => {
          const ov = getDayOverview(d);
          totalTasks += ov.total;
          completedTasks += ov.completed;
          if (ov.total > 0) { totalProgress += ov.avgProgress; count++; }
        });
        const avgProg = count > 0 ? totalProgress / count : 0;

        return (
          <div
            key={week.id}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => onNavigateToWeek(week.id)}
          >
            <div className="card-header">
              <span className="card-title">
                {format(week.start, 'MMM d')} — {format(week.end, 'MMM d')}
              </span>
              <span className="card-meta">{completedTasks}/{totalTasks} tasks</span>
            </div>
            <ProgressBar progress={avgProg} size="small" />
          </div>
        );
      })}
    </div>
  )
}
