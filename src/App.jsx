import React, { useState, useEffect } from 'react'
import { getToday, getCurrentWeekId, getCurrentMonth } from './utils/storage'
import { startNotificationService } from './utils/notifications'
import { getUpcomingTasks } from './utils/storage'
import DayView from './components/DayView'
import WeekView from './components/WeekView'
import MonthView from './components/MonthView'
import ProgressChart from './components/ProgressChart'
import QuotesSection from './components/QuotesSection'
import NotificationBanner from './components/NotificationBanner'

const NAV_ITEMS = [
  { id: 'day', label: 'Today', icon: '📋', section: 'planning' },
  { id: 'week', label: 'Week', icon: '📅', section: 'planning' },
  { id: 'month', label: 'Month', icon: '📆', section: 'planning' },
  { id: 'progress', label: 'Progress', icon: '📊', section: 'insights' },
  { id: 'quotes', label: 'Reality Check', icon: '🔥', section: 'insights' },
  { id: 'settings', label: 'Settings', icon: '⚙️', section: 'config' },
];

export default function App() {
  const [activeView, setActiveView] = useState('day');
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedWeek, setSelectedWeek] = useState(getCurrentWeekId());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [notificationDismissed, setNotificationDismissed] = useState(false);

  useEffect(() => {
    startNotificationService(getUpcomingTasks);
  }, []);

  const navigateToDay = (dateStr) => {
    setSelectedDate(dateStr);
    setActiveView('day');
  };

  const navigateToWeek = (weekId) => {
    setSelectedWeek(weekId);
    setActiveView('week');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'day':
        return <DayView dateStr={selectedDate} />;
      case 'week':
        return <WeekView weekId={selectedWeek} onNavigateToDay={navigateToDay} />;
      case 'month':
        return <MonthView yearMonth={selectedMonth} onNavigateToWeek={navigateToWeek} onNavigateToDay={navigateToDay} />;
      case 'progress':
        return <ProgressChart />;
      case 'quotes':
        return <QuotesSection />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DayView dateStr={selectedDate} />;
    }
  };

  const sections = [...new Set(NAV_ITEMS.map(n => n.section))];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          TaskNest
          <span>Track. Plan. Deliver.</span>
        </div>

        {sections.map(section => (
          <React.Fragment key={section}>
            <div className="nav-section">{section}</div>
            {NAV_ITEMS.filter(n => n.section === section).map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </React.Fragment>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {!notificationDismissed && (
          <div style={{ marginBottom: '16px' }}>
            <NotificationBanner onDismiss={() => setNotificationDismissed(true)} />
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

function SettingsView() {
  const [email, setEmail] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tasknest_data'))?.settings?.email || ''; }
    catch { return ''; }
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const data = JSON.parse(localStorage.getItem('tasknest_data') || '{}');
    if (!data.settings) data.settings = {};
    data.settings.email = email;
    localStorage.setItem('tasknest_data', JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const data = localStorage.getItem('tasknest_data');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasknest-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        localStorage.setItem('tasknest_data', JSON.stringify(data));
        window.location.reload();
      } catch { alert('Invalid backup file'); }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      localStorage.removeItem('tasknest_data');
      window.location.reload();
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure your TaskNest experience</p>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Email Notifications</h3>
        <label>Email Address (for reminders)</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
        />
        <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={handleSave}>
          {saved ? '✓ Saved!' : 'Save Email'}
        </button>
      </div>

      <div className="card" style={{ marginTop: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>Data Management</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            📤 Export Backup
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            📥 Import Backup
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button className="btn btn-danger" onClick={handleClearAll}>
            🗑️ Clear All Data
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '12px' }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>About</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          TaskNest — A minimalist task tracker for chemical engineers preparing for placements.
          Track your work across months, weeks, and days with 4 focus areas:
          Core Engineering, Project, Job, and Market Analysis.
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
          Built with React • Data stored locally in your browser
        </p>
      </div>
    </div>
  );
}
