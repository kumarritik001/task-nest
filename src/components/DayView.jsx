import React, { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, parseISO, isToday, isBefore } from 'date-fns'
import { getDay, getDayOverview, getAllSections, getToday, ensureDay, setDayType, swapDayTypes, enforceHardDayMinimum, getCurrentWeekId, getDatesInWeek, getAllDayTypes, addTask, updateTaskProgress, removeTask } from '../utils/storage'
import TaskCard from './TaskCard'
import AddTaskModal from './AddTaskModal'
import ProgressBar from './ProgressBar'

export default function DayView({ dateStr: propDateStr, onNavigate }) {
  const [dateStr, setDateStr] = useState(propDateStr || getToday());
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSection, setActiveSection] = useState('All');
  const [dayData, setDayData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [selectedSwap, setSelectedSwap] = useState(null);

  const sections = ['All', ...getAllSections()];
  const dayTypes = getAllDayTypes();
  const today = getToday();

  useEffect(() => {
    refresh();
  }, [dateStr]);

  useEffect(() => {
    if (propDateStr) setDateStr(propDateStr);
  }, [propDateStr]);

  const refresh = () => {
    ensureDay(dateStr);
    setDayData(getDay(dateStr));
    setOverview(getDayOverview(dateStr));
  };

  const handleAddTask = (date, section, task) => {
    addTask(date, section, task);
    refresh();
  };

  const handleProgressChange = (date, taskId, progress) => {
    updateTaskProgress(date, taskId, progress);
    refresh();
  };

  const handleRemoveTask = (date, taskId) => {
    removeTask(date, taskId);
    refresh();
  };

  const handleDayTypeChange = (type) => {
    setDayType(dateStr, type);
    refresh();
  };

  const handleSwap = (otherDate) => {
    if (selectedSwap) {
      swapDayTypes(dateStr, otherDate);
      setSelectedSwap(null);
      refresh();
    }
  };

  const d = parseISO(dateStr);
  const dayName = format(d, 'EEEE');
  const dateFormatted = format(d, 'MMM d, yyyy');
  const dayType = dayData?.dayType;

  const filteredTasks = dayData?.tasks?.filter(t =>
    activeSection === 'All' || t.section === activeSection
  ) || [];

  const sectionStats = {};
  for (const s of getAllSections()) {
    const tasks = dayData?.tasks?.filter(t => t.section === s) || [];
    sectionStats[s] = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      progress: tasks.length > 0 ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length : 0
    };
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>{dayName}</h1>
            <p>{dateFormatted}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-sm btn-secondary" onClick={() => { const prev = addDays(parseISO(dateStr), -1); setDateStr(format(prev, 'yyyy-MM-dd')); }}>← Prev</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setDateStr(today)}>Today</button>
            <button className="btn btn-sm btn-secondary" onClick={() => { const next = addDays(parseISO(dateStr), 1); setDateStr(format(next, 'yyyy-MM-dd')); }}>Next →</button>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Task</button>
          </div>
        </div>
      </div>

      {/* Day Type Selector */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Day Type:</span>
        {dayTypes.map(type => (
          <button
            key={type}
            className={`btn btn-sm ${dayType === type ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleDayTypeChange(type)}
            style={{
              background: dayType === type
                ? type === 'hard' ? 'var(--hard)' : type === 'moderate' ? 'var(--moderate)' : 'var(--easy)'
                : undefined,
              color: dayType === type ? 'white' : undefined
            }}
          >
            {type === 'hard' ? '🔴' : type === 'moderate' ? '🟠' : '🟢'} {type}
          </button>
        ))}
        <button
          className="swap-btn"
          onClick={() => setSelectedSwap(selectedSwap ? null : 'pick')}
          style={{ marginLeft: '8px' }}
        >
          🔄 Swap with another day
        </button>
      </div>

      {selectedSwap && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
          <p style={{ fontSize: '0.8rem', marginBottom: '8px' }}>Pick a day to swap day-types with:</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(startOfWeek(parseISO(dateStr), { weekStartsOn: 1 }), i);
              const ds = format(d, 'yyyy-MM-dd');
              if (ds === dateStr) return null;
              return (
                <button key={ds} className="btn btn-sm btn-secondary" onClick={() => handleSwap(ds)}>
                  {format(d, 'EEE d')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Overall Progress */}
      {overview && overview.total > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Daily Progress</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {overview.completed}/{overview.total} tasks done
            </span>
          </div>
          <ProgressBar progress={overview.avgProgress} />
        </div>
      )}

      {/* Section Stats */}
      {overview && (
        <div className="grid-2" style={{ marginBottom: '20px' }}>
          {Object.entries(sectionStats).map(([section, stats]) => (
            <div key={section} className="card" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{section}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {stats.completed}/{stats.total}
                </span>
              </div>
              <ProgressBar progress={stats.progress} size="small" />
            </div>
          ))}
        </div>
      )}

      {/* Section Tabs */}
      <div className="section-tabs">
        {sections.map(s => (
          <button
            key={s}
            className={`section-tab ${activeSection === s ? 'active' : ''}`}
            onClick={() => setActiveSection(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Tasks */}
      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <p>No tasks for this {activeSection === 'All' ? 'day' : activeSection} yet.</p>
          <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => setShowAddModal(true)}>
            + Add First Task
          </button>
        </div>
      ) : (
        filteredTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            dateStr={dateStr}
            onProgressChange={handleProgressChange}
            onRemove={handleRemoveTask}
          />
        ))
      )}

      {showAddModal && (
        <AddTaskModal
          dateStr={dateStr}
          onAdd={handleAddTask}
          onClose={() => { setShowAddModal(false); refresh(); }}
        />
      )}
    </div>
  )
}
