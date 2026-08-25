import React, { useState, useEffect } from 'react'
import { format, parseISO, addDays, startOfWeek } from 'date-fns'
import {
  getToday, getCurrentWeekId, getCurrentMonth,
  getTasks, getDayOverview, getWeekOverview, getMonthOverview,
  getDayType, setDayType, swapDayTypes, hardDayCount,
  getAllSections, getAllDayTypes, getDatesInWeek, getDatesInMonth, getWeeksInMonth,
  getProgressLog, getTemplates, addTemplate, removeTemplate,
  getSettings, updateSettings, getUpcomingTasks, getKPIData,
  getHours, setHours
} from './utils/storage'
import { startNotificationService } from './utils/notifications'
import { getCriticismQuote, getAppreciationQuote, getAllCriticismQuotes, getAllAppreciationQuotes } from './utils/quotes'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'
import TaskCard from './components/TaskCard'
import AddTaskModal from './components/AddTaskModal'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const SECTIONS = getAllSections();
const DAY_TYPES = getAllDayTypes();
const HOUR_STANDARDS = { hard: 11, moderate: 6, easy: 4 };
const SECTION_COLORS = {
  'Core Engineering': { bg: '#FEF3C7', text: '#92400E', tag: 'tag-core' },
  'Project': { bg: '#DBEAFE', text: '#1E40AF', tag: 'tag-project' },
  'Job': { bg: '#D1FAE5', text: '#065F46', tag: 'tag-job' },
  'Market Analysis': { bg: '#EDE9FE', text: '#5B21B6', tag: 'tag-market' },
};

// ═══════════════════════════════════════════
// APP
// ═══════════════════════════════════════════
export default function App() {
  const [view, setView] = useState('today');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekId());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [refreshKey, setRefreshKey] = useState(0);
  const [addTaskFor, setAddTaskFor] = useState(null); // { dateStr } or null

  useEffect(() => { startNotificationService(getUpcomingTasks); }, []);

  const refresh = () => setRefreshKey(k => k + 1);

  const goDay = (d) => { setSelectedDate(d); setView('today'); };
  const goWeek = (w) => { setSelectedWeek(w); setView('week'); };
  const openAddFor = (dateStr) => setAddTaskFor({ dateStr });
  const closeAdd = () => { setAddTaskFor(null); refresh(); };

  const navItems = [
    { group: 'Planning', items: [
      { id: 'today', icon: '◎', label: 'Today' },
      { id: 'week', icon: '▦', label: 'Week Planner' },
      { id: 'month', icon: '▣', label: 'Month View' },
    ]},
    { group: 'Insights', items: [
      { id: 'progress', icon: '◐', label: 'Progress' },
      { id: 'quotes', icon: '⚡', label: 'Reality Check' },
    ]},
    { group: 'Config', items: [
      { id: 'settings', icon: '⚙', label: 'Settings' },
    ]},
  ];

  const todayOv = getDayOverview(getToday());

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }} key={refreshKey}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1><span>●</span> TaskNest</h1>
          <p>Track · Plan · Deliver</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(g => (
            <div key={g.group}>
              <div className="nav-group-label">{g.group}</div>
              {g.items.map(n => (
                <button key={n.id} className={`nav-btn ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
                  <span className="icon">{n.icon}</span>
                  <span>{n.label}</span>
                  {n.id === 'today' && todayOv.total > 0 && (
                    <span className="badge">{todayOv.done}/{todayOv.total}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          {getToday()} · {Object.keys(get().tasks || {}).length} days tracked
        </div>
      </aside>

      <main className="main">
        {view === 'today' && <TodayView dateStr={selectedDate} refresh={refresh} goDay={goDay} />}
        {view === 'week' && <WeekView weekId={selectedWeek} refresh={refresh} goDay={goDay} goWeek={goWeek} openAddFor={openAddFor} />}
        {view === 'month' && <MonthView month={selectedMonth} refresh={refresh} goDay={goDay} goWeek={goWeek} openAddFor={openAddFor} />}
        {view === 'progress' && <ProgressView />}
        {view === 'quotes' && <QuotesView />}
        {view === 'settings' && <SettingsView />}
      </main>

      {addTaskFor && <AddTaskModal dateStr={addTaskFor.dateStr} onClose={closeAdd} />}
    </div>
  );
}

function get() { try { return JSON.parse(localStorage.getItem('tn_data')) || {}; } catch { return {}; } }

// ═══════════════════════════════════════════
// TODAY VIEW
// ═══════════════════════════════════════════
function TodayView({ dateStr, refresh, goDay }) {
  const [showAdd, setShowAdd] = useState(false);
  const [activeSection, setActiveSection] = useState('All');
  const tasks = getTasks(dateStr);
  const ov = getDayOverview(dateStr);
  const dayType = getDayType(dateStr);
  const d = parseISO(dateStr);
  const today = getToday();
  const kpi = getKPIData();

  const filtered = activeSection === 'All' ? tasks : tasks.filter(t => t.section === activeSection);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div>
            <h2>{format(d, 'EEEE')}</h2>
            <div className="subtitle">{format(d, 'MMMM d, yyyy')}</div>
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => goDay(format(addDays(d, -1), 'yyyy-MM-dd'))}>← Prev</button>
          {dateStr !== today && <button className="btn btn-ghost btn-sm" onClick={() => goDay(today)}>Today</button>}
          <button className="btn btn-ghost btn-sm" onClick={() => goDay(format(addDays(d, 1), 'yyyy-MM-dd'))}>Next →</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ New Task</button>
        </div>
      </div>

      <div className="page-body">
        {/* ── KPI: No Mercy Review ── */}
        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>⚡ No Mercy Review</h3>
        <div className="stats-row" style={{ marginBottom: 8 }}>
          <div className="stat-card yellow">
            <div className="stat-label">Completion Rate</div>
            <div className="stat-value">{kpi.completionRate}%</div>
            <div className="stat-sub">{kpi.totalDone}/{kpi.totalTasksEver} tasks finished</div>
            <div className="progress-wrap" style={{ marginTop: 6 }}>
              <div className="progress-track"><div className={`progress-fill ${kpi.completionRate > 70 ? 'hot' : kpi.completionRate > 30 ? 'warm' : 'cold'}`} style={{ width: `${kpi.completionRate}%` }} /></div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: `3px solid ${kpi.streak >= 3 ? 'var(--green)' : kpi.streak >= 1 ? 'var(--yellow)' : 'var(--red)'}` }}>
            <div className="stat-label">Active Streak</div>
            <div className="stat-value">{kpi.streak} day{kpi.streak !== 1 ? 's' : ''}</div>
            <div className="stat-sub">{kpi.streak === 0 ? 'You slipped. Start today.' : kpi.streak >= 7 ? 'Unstoppable.' : 'Keep it going.'}</div>
          </div>
          <div className="stat-card" style={{ borderLeft: `3px solid ${kpi.overdueTasks > 0 ? 'var(--red)' : 'var(--green)'}` }}>
            <div className="stat-label">Overdue Tasks</div>
            <div className="stat-value" style={{ color: kpi.overdueTasks > 0 ? 'var(--red)' : 'var(--green)' }}>{kpi.overdueTasks}</div>
            <div className="stat-sub">{kpi.overdueRate}% of open tasks are late</div>
          </div>
          <div className="stat-card" style={{ borderLeft: `3px solid ${kpi.hardDays >= 2 ? 'var(--green)' : 'var(--red)'}` }}>
            <div className="stat-label">Hard Days This Week</div>
            <div className="stat-value">{kpi.hardDays}/2</div>
            <div className="stat-sub">{kpi.hardDays >= 2 ? '✓ Minimum met' : '⚠ Need 2 hard days'}</div>
          </div>
        </div>

        <div className="stats-row" style={{ marginBottom: 20 }}>
          <div className="stat-card" style={{ borderLeft: '3px solid var(--purple)' }}>
            <div className="stat-label">Avg Progress</div>
            <div className="stat-value">{kpi.avgProgress}%</div>
            <div className="stat-sub">across all tasks ever</div>
          </div>
          <div className="stat-card" style={{ borderLeft: `3px solid ${kpi.weakestRate < 30 ? 'var(--red)' : 'var(--orange)'}` }}>
            <div className="stat-label">Weakest Section</div>
            <div className="stat-value" style={{ fontSize: '1rem' }}>{kpi.weakestSection}</div>
            <div className="stat-sub">{kpi.weakestRate < 101 ? `${kpi.weakestRate}% completion` : 'No data'}</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-label">Today's Tasks</div>
            <div className="stat-value">{kpi.todayDone}/{kpi.todayTasks}</div>
            <div className="stat-sub">{kpi.todayTasks === 0 ? 'Nothing planned' : kpi.todayDone === kpi.todayTasks ? 'All done!' : `${kpi.todayTasks - kpi.todayDone} remaining`}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Month Progress</div>
            <div className="stat-value">{kpi.monthProgress}%</div>
            <div className="stat-sub">{kpi.monthDone}/{kpi.monthTotal} tasks this month</div>
          </div>
        </div>

        {/* ── Hours Tracker ── */}
        <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>⏱ Hours Tracker</h3>
        <div className="stats-row" style={{ marginBottom: 8 }}>
          <div className="stat-card" style={{ borderLeft: `3px solid ${kpi.todayHours >= kpi.todayRequired && kpi.todayRequired > 0 ? 'var(--green)' : 'var(--red)'}` }}>
            <div className="stat-label">Today's Hours</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div className="stat-value">{kpi.todayHours}h</div>
              <div className="stat-sub">/ {kpi.todayRequired}h required</div>
            </div>
            <div className="stat-sub">
              {kpi.todayDayType ? `${kpi.todayDayType} day standard` : 'Set day type to see requirement'}
            </div>
            {kpi.todayRequired > 0 && (
              <div className="progress-wrap" style={{ marginTop: 6 }}>
                <div className="progress-track">
                  <div className={`progress-fill ${kpi.todayHours >= kpi.todayRequired ? 'hot' : kpi.todayHours >= kpi.todayRequired * 0.5 ? 'warm' : 'cold'}`}
                    style={{ width: `${Math.min(100, (kpi.todayHours / kpi.todayRequired) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="stat-card" style={{ borderLeft: `3px solid ${kpi.weekHoursStudied >= kpi.weekHoursRequired ? 'var(--green)' : 'var(--orange)'}` }}>
            <div className="stat-label">This Week</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div className="stat-value">{kpi.weekHoursStudied}h</div>
              <div className="stat-sub">/ {kpi.weekHoursRequired}h</div>
            </div>
            <div className="stat-sub">
              {kpi.weekHoursRequired > 0 ? `${Math.round((kpi.weekHoursStudied / kpi.weekHoursRequired) * 100)}% of target` : 'No day types set'}
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: `3px solid ${kpi.monthHoursStudied >= kpi.monthHoursRequired ? 'var(--green)' : 'var(--orange)'}` }}>
            <div className="stat-label">This Month</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div className="stat-value">{kpi.monthHoursStudied}h</div>
              <div className="stat-sub">/ {kpi.monthHoursRequired}h</div>
            </div>
            <div className="stat-sub">
              {kpi.monthHoursRequired > 0 ? `${Math.round((kpi.monthHoursStudied / kpi.monthHoursRequired) * 100)}% of target` : 'No day types set'}
            </div>
          </div>
          <div className="stat-card blue">
            <div className="stat-label">Total Hours Logged</div>
            <div className="stat-value">{kpi.totalHoursEver}h</div>
            <div className="stat-sub">all time</div>
          </div>
        </div>

        {/* Hours input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Log hours for today:</span>
          <input
            type="number"
            min="0"
            max="24"
            step="0.5"
            value={kpi.todayHours}
            onChange={(e) => { setHours(today, e.target.value); refresh(); }}
            style={{ width: 70, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', fontSize: '0.85rem', fontFamily: 'inherit', textAlign: 'center' }}
          />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            hours
            {kpi.todayRequired > 0 && (
              kpi.todayHours >= kpi.todayRequired
                ? <span style={{ color: 'var(--green)', fontWeight: 600 }}> ✓ Target met!</span>
                : <span style={{ color: 'var(--red)' }}> — need {kpi.todayRequired - kpi.todayHours}h more</span>
            )}
          </span>
        </div>

        {/* ── Harsh verdict ── */}
        {kpi.totalTasksEver > 0 && (
          <div style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 20,
            fontSize: '0.82rem',
            fontWeight: 600,
            background: kpi.completionRate >= 70 && kpi.streak >= 2 ? '#ECFDF5' : kpi.completionRate >= 40 ? '#FFFBEB' : '#FEF2F2',
            color: kpi.completionRate >= 70 && kpi.streak >= 2 ? '#065F46' : kpi.completionRate >= 40 ? '#92400E' : '#991B1B',
            border: `1px solid ${kpi.completionRate >= 70 && kpi.streak >= 2 ? '#A7F3D0' : kpi.completionRate >= 40 ? '#FDE68A' : '#FECACA'}`
          }}>
            {kpi.completionRate >= 70 && kpi.streak >= 3 && '🔥 You\'re on fire. Don\'t stop.'}
            {kpi.completionRate >= 70 && kpi.streak < 3 && kpi.streak >= 1 && '💪 Good completion. Build the streak.'}
            {kpi.completionRate >= 70 && kpi.streak === 0 && '⚠️ Great completion rate but you broke your streak. Consistency matters.'}
            {kpi.completionRate >= 40 && kpi.completionRate < 70 && '😐 Average. You\'re leaving too much on the table.'}
            {kpi.completionRate < 40 && '🚨 Embarrassing. Less than half your tasks are done. What are you doing?'}
            {kpi.overdueTasks > 3 && ' | 🚨 And you have ' + kpi.overdueTasks + ' overdue tasks. Deadlines mean nothing to you?'}
            {kpi.hardDays < 2 && ' | ⚠️ You haven\'t even scheduled 2 hard days. Comfort zone is not a strategy.'}
            {kpi.todayRequired > 0 && kpi.todayHours < kpi.todayRequired && ' | ⏱ You studied ' + kpi.todayHours + 'h today. Required was ' + kpi.todayRequired + 'h. Slack.'}
            {kpi.todayRequired > 0 && kpi.todayHours >= kpi.todayRequired && ' | ⏱ ' + kpi.todayHours + 'h logged. Target hit. Respect.'}
          </div>
        )}

        {/* ── Today's progress bar ── */}
        {ov.total > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div className="progress-track" style={{ height: 8 }}>
              <div className={`progress-fill ${ov.progress > 75 ? 'hot' : ov.progress > 30 ? 'warm' : 'cold'}`} style={{ width: `${ov.progress}%` }} />
            </div>
            <div className="progress-info"><span>{ov.progress}% today</span></div>
          </div>
        )}

        <div className="section-tabs">
          <button className={`section-tab ${activeSection === 'All' ? 'active' : ''}`} onClick={() => setActiveSection('All')}>All</button>
          {SECTIONS.map(s => (
            <button key={s} className={`section-tab ${activeSection === s ? 'active' : ''}`} onClick={() => setActiveSection(s)}>
              {s} {tasks.filter(t => t.section === s).length > 0 && `(${tasks.filter(t => t.section === s).length})`}
            </button>
          ))}
        </div>

        <div className="task-list">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="icon">📋</div>
              <p>No tasks yet. Click "+ New Task" to get started.</p>
            </div>
          ) : filtered.map(task => (
            <TaskCard key={task.id} task={task} dateStr={dateStr} refresh={refresh} />
          ))}
        </div>
      </div>

      {showAdd && <AddTaskModal dateStr={dateStr} onClose={() => { setShowAdd(false); refresh(); }} />}
    </>
  );
}

// ═══════════════════════════════════════════
// WEEK VIEW
// ═══════════════════════════════════════════
function WeekView({ weekId, refresh, goDay, goWeek, openAddFor }) {
  const dates = getDatesInWeek(weekId);
  const ov = getWeekOverview(weekId);
  const today = getToday();
  const weekStart = parseISO(weekId);
  const hc = hardDayCount(weekId);

  const changeDayType = (dateStr, newType) => {
    const currentType = getDayType(dateStr);
    // If changing FROM hard, check if we'd drop below 2
    if (currentType === 'hard' && newType !== 'hard') {
      if (hc <= 2) {
        alert('Cannot change: you need at least 2 hard days per week. Remove hard from another day first.');
        return;
      }
    }
    setDayType(dateStr, newType);
    refresh();
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div>
            <h2>Week Planner</h2>
            <div className="subtitle">{format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}</div>
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => goWeek(format(addDays(parseISO(weekId), -7), 'yyyy-MM-dd'))}>← Prev</button>
          <button className="btn btn-ghost btn-sm" onClick={() => goWeek(getCurrentWeekId())}>This Week</button>
          <button className="btn btn-ghost btn-sm" onClick={() => goWeek(format(addDays(parseISO(weekId), 7), 'yyyy-MM-dd'))}>Next →</button>
          <button className="btn btn-primary" onClick={() => openAddFor(today)}>+ New Task</button>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-row">
          <div className="stat-card yellow"><div className="stat-label">Total Tasks</div><div className="stat-value">{ov.total}</div></div>
          <div className="stat-card green"><div className="stat-label">Completed</div><div className="stat-value">{ov.done}</div></div>
          <div className="stat-card orange"><div className="stat-label">Progress</div><div className="stat-value">{ov.progress}%</div></div>
          <div className={`stat-card ${hc >= 2 ? 'green' : 'orange'}`}>
            <div className="stat-label">Hard Days</div>
            <div className="stat-value">{hc}/2</div>
            <div className="stat-sub">{hc < 2 ? '⚠ Need ≥2 hard days' : '✓ Minimum met'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Day Allocation</h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--red)', color: '#fff', fontSize: '0.68rem', padding: '5px 14px' }}
              onClick={() => {
                dates.forEach((ds, i) => setDayType(ds, i === 0 || i === 3 ? 'hard' : 'easy'));
                refresh();
              }}
            >
              🔴 2 Hard + Easy
            </button>
            <button
              className="btn btn-sm"
              style={{ background: 'var(--orange)', color: '#fff', fontSize: '0.68rem', padding: '5px 14px' }}
              onClick={() => {
                dates.forEach((ds, i) => setDayType(ds, i < 5 ? 'moderate' : 'easy'));
                refresh();
              }}
            >
              🟠 Moderate Week
            </button>
            <button
              className="btn btn-sm"
              style={{ background: '#E5E7EB', color: '#374151', fontSize: '0.68rem', padding: '5px 14px' }}
              onClick={() => {
                dates.forEach(ds => setDayType(ds, null));
                refresh();
              }}
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="day-grid" style={{ marginBottom: 28 }}>
          {dates.map(ds => {
            const d2 = parseISO(ds);
            const dt = getDayType(ds);
            const dov = getDayOverview(ds);
            const isToday = ds === today;
            const hoursStudied = getHours(ds);
            const required = dt === 'hard' ? 11 : dt === 'moderate' ? 6 : dt === 'easy' ? 4 : 0;
            return (
              <div key={ds} className={`day-cell ${isToday ? 'today' : ''}`}>
                <div onClick={() => goDay(ds)} style={{ cursor: 'pointer' }}>
                  {dt && <div className={`day-type-dot ${dt}`} />}
                  <div className="day-label">{format(d2, 'EEE')}</div>
                  <div className="day-num">{format(d2, 'd')}</div>
                  {dov.total > 0 && <div className="day-count">{dov.done}/{dov.total} tasks</div>}
                  {dt && <div style={{ fontSize: '0.55rem', textTransform: 'capitalize', color: dt === 'hard' ? 'var(--red)' : dt === 'moderate' ? 'var(--orange)' : 'var(--green)', fontWeight: 600, marginTop: 2 }}>{dt} · {required}h</div>}
                  {hoursStudied > 0 && <div style={{ fontSize: '0.55rem', color: hoursStudied >= required ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{hoursStudied}h logged</div>}
                </div>
                {/* Day type switcher */}
                <div style={{ display: 'flex', gap: 3, marginTop: 6, justifyContent: 'center' }}>
                  {DAY_TYPES.map(t => (
                    <button
                      key={t}
                      onClick={(e) => { e.stopPropagation(); changeDayType(ds, t); }}
                      style={{
                        width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer',
                        background: dt === t
                          ? (t === 'hard' ? 'var(--red)' : t === 'moderate' ? 'var(--orange)' : 'var(--green)')
                          : '#E5E7EB',
                        opacity: dt === t ? 1 : 0.5,
                        transition: 'all 0.15s'
                      }}
                      title={`Set ${t}`}
                    />
                  ))}
                </div>
                <button
                  className="btn btn-sm"
                  style={{ marginTop: 4, padding: '2px 8px', fontSize: '0.6rem', background: 'var(--yellow)', color: '#000', borderRadius: 4 }}
                  onClick={(e) => { e.stopPropagation(); openAddFor(ds); }}
                >
                  + Add
                </button>
              </div>
            );
          })}
        </div>

        {hc < 2 && (
          <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontSize: '0.8rem', fontWeight: 600, background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}>
            🚨 You have {hc} hard day{hc !== 1 ? 's' : ''}. Minimum 2 required. Click the red dot on any day to make it hard.
          </div>
        )}

        <h3 style={{ fontSize: '0.85rem', marginBottom: 12, fontWeight: 700 }}>Day Details</h3>
        {dates.map(ds => {
          const dov = getDayOverview(ds);
          const dt = getDayType(ds);
          return (
            <div key={ds} className="task-card" style={{ marginBottom: 8 }}>
              <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => goDay(ds)}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{format(parseISO(ds), 'EEEE, MMM d')}</span>
                  {dt && <span className={`tag tag-${dt === 'hard' ? 'hard' : dt === 'moderate' ? 'moderate' : 'easy'}`} style={{ marginLeft: 8 }}>{dt}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{dov.done}/{dov.total} done</span>
                  <button
                    className="btn btn-sm"
                    style={{ padding: '3px 10px', fontSize: '0.68rem', background: 'var(--yellow)', color: '#000' }}
                    onClick={(e) => { e.stopPropagation(); openAddFor(ds); }}
                  >
                    + Add
                  </button>
                </div>
              </div>
              <div style={{ padding: '0 18px 14px' }}>
                <div className="progress-track"><div className={`progress-fill ${dov.progress > 75 ? 'hot' : dov.progress > 30 ? 'warm' : 'cold'}`} style={{ width: `${dov.progress}%` }} /></div>
              </div>
            </div>
          );
        })}

        {dates.every(ds => getDayOverview(ds).total === 0) && (
          <div className="empty"><div className="icon">▦</div><p>No tasks this week. Go to Today to add some.</p></div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
// MONTH VIEW
// ═══════════════════════════════════════════
function MonthView({ month, refresh, goDay, goWeek, openAddFor }) {
  const dates = getDatesInMonth(month);
  const weeks = getWeeksInMonth(month);
  const ov = getMonthOverview(month);
  const today = getToday();
  const [y, m] = month.split('-').map(Number);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <div>
            <h2>{format(new Date(y, m - 1), 'MMMM yyyy')}</h2>
            <div className="subtitle">Monthly overview</div>
          </div>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => { const d = new Date(y, m - 2); refresh(); }}>← Prev</button>
          <button className="btn btn-ghost btn-sm" onClick={() => refresh()}>This Month</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { const d = new Date(y, m); refresh(); }}>Next →</button>
          <button className="btn btn-primary" onClick={() => openAddFor(today)}>+ New Task</button>
        </div>
      </div>

      <div className="page-body">
        <div className="stats-row">
          <div className="stat-card yellow"><div className="stat-label">Total Tasks</div><div className="stat-value">{ov.total}</div></div>
          <div className="stat-card green"><div className="stat-label">Completed</div><div className="stat-value">{ov.done}</div></div>
          <div className="stat-card orange"><div className="stat-label">Avg Progress</div><div className="stat-value">{ov.progress}%</div></div>
          <div className="stat-card blue"><div className="stat-label">Weeks</div><div className="stat-value">{weeks.length}</div></div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: '0.85rem', marginBottom: 14, fontWeight: 700 }}>Calendar</h3>
          <div className="cal-grid">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="cal-header">{d}</div>)}
            {(() => {
              const first = parseISO(dates[0]);
              const startDow = (first.getDay() + 6) % 7;
              const blanks = Array(startDow).fill(null);
              return [...blanks, ...dates].map((ds, i) => {
                if (!ds) return <div key={`b${i}`} />;
                const dov = getDayOverview(ds);
                return (
                  <div key={ds} className={`cal-day ${ds === today ? 'today' : ''} ${dov.total > 0 ? 'has-tasks' : ''}`} style={{ position: 'relative' }}>
                    <span onClick={() => goDay(ds)} style={{ cursor: 'pointer' }}>
                      {format(parseISO(ds), 'd')}
                    </span>
                    {dov.total > 0 && <div className="cal-count">{dov.done}/{dov.total}</div>}
                    <button
                      onClick={(e) => { e.stopPropagation(); openAddFor(ds); }}
                      style={{ position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: '50%', border: 'none', background: 'var(--yellow)', color: '#000', fontSize: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}
                      title="Add task"
                    >+</button>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <h3 style={{ fontSize: '0.85rem', marginBottom: 12, fontWeight: 700 }}>Weeks</h3>
        {weeks.map(w => {
          let total = 0, done = 0;
          w.dates.forEach(ds => { const o = getDayOverview(ds); total += o.total; done += o.done; });
          return (
            <div key={w.id} className="task-card" style={{ marginBottom: 8 }}>
              <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }} onClick={() => goWeek(w.id)}>{format(w.start, 'MMM d')} — {format(w.end, 'MMM d')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{done}/{total} tasks</span>
                  <button className="btn btn-sm" style={{ padding: '3px 10px', fontSize: '0.68rem', background: 'var(--yellow)', color: '#000' }}
                    onClick={() => openAddFor(w.dates[Math.min(6, w.dates.length - 1)])}>
                    + Add to week
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
// PROGRESS VIEW
// ═══════════════════════════════════════════
function ProgressView() {
  const log = getProgressLog();
  const dates = [...new Set(log.map(p => p.date))].sort().slice(-30);

  const datasets = SECTIONS.map(s => ({
    label: s,
    data: dates.map(ds => { const e = log.find(p => p.date === ds && p.section === s); return e ? e.progress : null; }),
    borderColor: s === 'Core Engineering' ? '#F5B731' : s === 'Project' ? '#3B82F6' : s === 'Job' ? '#22C55E' : '#8B5CF6',
    backgroundColor: (s === 'Core Engineering' ? '#F5B731' : s === 'Project' ? '#3B82F6' : s === 'Job' ? '#22C55E' : '#8B5CF6') + '15',
    fill: true, tension: 0.4, pointRadius: 3, spanGaps: true
  }));

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><div><h2>Progress</h2><div className="subtitle">Track progress across all sections</div></div></div>
      </div>
      <div className="page-body">
        <div className="chart-card" style={{ height: 380 }}>
          {dates.length > 0 ? (
            <Line data={{ labels: dates.map(d => format(parseISO(d), 'MMM d')), datasets }}
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } } },
                scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } }, x: { ticks: { maxTicksLimit: 12 } } } }} />
          ) : (
            <div className="empty"><div className="icon">◐</div><p>No data yet. Complete tasks to see your progress chart.</p></div>
          )}
        </div>

        <div className="stats-row">
          {SECTIONS.map(s => {
            const sl = log.filter(p => p.section === s);
            const latest = sl[sl.length - 1];
            return (
              <div key={s} className="stat-card" style={{ borderLeft: `3px solid ${SECTION_COLORS[s].bg}` }}>
                <div className="stat-label">{s}</div>
                <div className="stat-value" style={{ fontSize: '1.3rem' }}>{latest ? latest.progress + '%' : '—'}</div>
                <div className="stat-sub">{sl.length} data points</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
// QUOTES VIEW
// ═══════════════════════════════════════════
function QuotesView() {
  const [crit, setCrit] = useState(getCriticismQuote());
  const [apprec, setApprec] = useState(getAppreciationQuote());
  const [showAll, setShowAll] = useState(false);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><div><h2>Reality Check</h2><div className="subtitle">Criticism when you slack · Motivation when you grind</div></div></div>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => { setCrit(getCriticismQuote()); setApprec(getAppreciationQuote()); }}>↻ Refresh</button>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
          <div className="quote-block criticism">
            <p>"{crit.text}"</p>
            <div className="author">— {crit.author}</div>
          </div>
          <div className="quote-block appreciation">
            <p>"{apprec.text}"</p>
            <div className="author">— {apprec.author}</div>
          </div>
        </div>

        <button className="btn btn-ghost btn-sm" onClick={() => setShowAll(!showAll)} style={{ marginBottom: 14 }}>
          {showAll ? 'Collapse' : `Show All (${getAllCriticismQuotes().length + getAllAppreciationQuotes().length})`}
        </button>

        {showAll && (
          <>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--red)', marginBottom: 10, fontWeight: 700 }}>🔥 When You're Slacking</h3>
            {getAllCriticismQuotes().map((q, i) => (
              <div key={i} className="quote-block criticism"><p>"{q.text}"</p><div className="author">— {q.author}</div></div>
            ))}
            <h3 style={{ fontSize: '0.85rem', color: 'var(--green)', marginTop: 20, marginBottom: 10, fontWeight: 700 }}>💪 When You're Grinding</h3>
            {getAllAppreciationQuotes().map((q, i) => (
              <div key={i} className="quote-block appreciation"><p>"{q.text}"</p><div className="author">— {q.author}</div></div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════
// SETTINGS VIEW
// ═══════════════════════════════════════════
function SettingsView() {
  const [email, setEmail] = useState(() => getSettings().email || '');
  const [saved, setSaved] = useState(false);

  const save = () => { updateSettings({ email }); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const exportData = () => {
    const blob = new Blob([localStorage.getItem('tn_data') || '{}'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tasknest-${getToday()}.json`;
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { localStorage.setItem('tn_data', ev.target.result); window.location.reload(); }
      catch { alert('Invalid file'); }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><div><h2>Settings</h2><div className="subtitle">Configure TaskNest</div></div></div>
      </div>
      <div className="page-body">
        <div className="setting-group">
          <h3>Email for Notifications</h3>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ maxWidth: 360 }} />
          <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={save}>{saved ? '✓ Saved' : 'Save'}</button>
        </div>
        <div className="setting-group">
          <h3>Data</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={exportData}>📤 Export</button>
            <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>📥 Import<input type="file" accept=".json" onChange={importData} style={{ display: 'none' }} /></label>
            <button className="btn btn-danger" onClick={() => { if (confirm('Delete all data?')) { localStorage.removeItem('tn_data'); window.location.reload(); } }}>🗑 Clear All</button>
          </div>
        </div>
        <div className="setting-group">
          <h3>About</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            TaskNest — minimalist task tracker with subtasks, 4 focus areas, and progress tracking. Data stays in your browser.
          </p>
        </div>
      </div>
    </>
  );
}
