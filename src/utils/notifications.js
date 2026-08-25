export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function sendNotification(title, body, icon = '📋') {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>` });
  }
}

export function scheduleNotifications(getUpcomingTasksFn) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // 12am check - remind to add tomorrow's tasks
  if (hours === 0 && minutes < 5) {
    sendNotification('🌙 Daily Planning', "It's a new day! Add your tasks for today.", '📝');
  }

  // Every 6 hours check
  if (hours % 6 === 0 && minutes < 5) {
    const tasks = getUpcomingTasksFn();
    const todayTasks = tasks.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.date === today;
    });
    if (todayTasks.length > 0) {
      const completed = todayTasks.filter(t => t.completed).length;
      sendNotification(
        '⏰ 6-Hour Check-in',
        `${completed}/${todayTasks.length} tasks done today. Keep going!`,
        '⏰'
      );
    }
  }
}

export function startNotificationService(getUpcomingTasksFn) {
  requestNotificationPermission();
  // Check every minute
  setInterval(() => scheduleNotifications(getUpcomingTasksFn), 60000);
  // Also check on load
  scheduleNotifications(getUpcomingTasksFn);
}
