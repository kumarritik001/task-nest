import React, { useState, useEffect } from 'react'
import { getUpcomingTasks, getToday } from '../utils/storage'
import { sendNotification, requestNotificationPermission } from '../utils/notifications'

export default function NotificationBanner() {
  const [tasks, setTasks] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    const upcoming = getUpcomingTasks();
    const today = getToday();
    const todayTasks = upcoming.filter(t => t.date === today && !t.completed);
    setTasks(todayTasks);
    setNotifEnabled('Notification' in window && Notification.permission === 'granted');
  }, []);

  const handleEnableNotifications = async () => {
    await requestNotificationPermission();
    setNotifEnabled('Notification' in window && Notification.permission === 'granted');
    if ('Notification' in window && Notification.permission === 'granted') {
      sendNotification('🔔 Notifications Enabled', 'You will receive reminders every 6 hours and at midnight.', '🔔');
    }
  };

  const handleTestNotification = () => {
    sendNotification('⏰ Test Notification', 'This is what your 6-hour reminder looks like!', '⏰');
  };

  if (dismissed) return null;

  return (
    <div>
      {!notifEnabled && (
        <div className="notification-bar">
          <span>🔔 Enable notifications to get 6-hour check-ins and daily reminders at midnight</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm" style={{ background: 'white', color: 'var(--accent-dark)' }} onClick={handleEnableNotifications}>
              Enable
            </button>
            <button className="close-btn" onClick={() => setDismissed(true)}>✕</button>
          </div>
        </div>
      )}

      {notifEnabled && tasks.length > 0 && !dismissed && (
        <div className="notification-bar" style={{ background: 'var(--easy)' }}>
          <span>📋 You have {tasks.length} task(s) remaining today. Keep going!</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm" style={{ background: 'white', color: 'var(--easy)' }} onClick={handleTestNotification}>
              Test Alert
            </button>
            <button className="close-btn" onClick={() => setDismissed(true)}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}
