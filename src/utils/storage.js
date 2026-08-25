import { v4 as uuidv4 } from 'uuid';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, addMonths, isToday, parseISO, differenceInCalendarDays } from 'date-fns';

const SECTIONS = ['Core Engineering', 'Project', 'Job', 'Market Analysis'];
const DAY_TYPES = ['hard', 'moderate', 'easy'];

function getStore() {
  try {
    return JSON.parse(localStorage.getItem('tasknest_data')) || {};
  } catch { return {}; }
}

function setStore(data) {
  localStorage.setItem('tasknest_data', JSON.stringify(data));
}

function initData() {
  const data = getStore();
  if (!data.months) data.months = {};
  if (!data.templates) data.templates = [];
  if (!data.dayTypes) data.dayTypes = {};
  if (!data.progressLog) data.progressLog = [];
  if (!data.settings) data.settings = { email: '', notificationsEnabled: true };
  setStore(data);
  return data;
}

export function getMonth(yearMonth) {
  const data = initData();
  return data.months[yearMonth] || null;
}

export function ensureMonth(yearMonth) {
  const data = initData();
  if (!data.months[yearMonth]) {
    data.months[yearMonth] = { weeks: {}, createdAt: new Date().toISOString() };
    setStore(data);
  }
  return data.months[yearMonth];
}

export function getWeek(weekId) {
  const data = initData();
  for (const ym of Object.keys(data.months)) {
    if (data.months[ym].weeks[weekId]) return data.months[ym].weeks[weekId];
  }
  return null;
}

export function ensureWeek(yearMonth, weekId) {
  const data = initData();
  ensureMonth(yearMonth);
  if (!data.months[yearMonth].weeks[weekId]) {
    data.months[yearMonth].weeks[weekId] = { days: {}, createdAt: new Date().toISOString() };
    setStore(data);
  }
  return data.months[yearMonth].weeks[weekId];
}

export function getDay(dateStr) {
  const data = initData();
  for (const ym of Object.keys(data.months)) {
    for (const wk of Object.keys(data.months[ym].weeks)) {
      if (data.months[ym].weeks[wk].days[dateStr]) {
        return data.months[ym].weeks[wk].days[dateStr];
      }
    }
  }
  return null;
}

export function ensureDay(dateStr) {
  const data = initData();
  const d = parseISO(dateStr);
  const yearMonth = format(d, 'yyyy-MM');
  const weekStart = startOfWeek(d, { weekStartsOn: 1 });
  const weekId = format(weekStart, 'yyyy-MM-dd');

  ensureWeek(yearMonth, weekId);
  if (!data.months[yearMonth].weeks[weekId].days[dateStr]) {
    data.months[yearMonth].weeks[weekId].days[dateStr] = {
      tasks: [],
      dayType: null,
      createdAt: new Date().toISOString()
    };
    setStore(data);
  }
  return data.months[yearMonth].weeks[weekId].days[dateStr];
}

export function addTask(dateStr, section, task) {
  const data = initData();
  ensureDay(dateStr);
  for (const ym of Object.keys(data.months)) {
    for (const wk of Object.keys(data.months[ym].weeks)) {
      if (data.months[ym].weeks[wk].days[dateStr]) {
        const day = data.months[ym].weeks[wk].days[dateStr];
        const newTask = {
          id: uuidv4(),
          title: task.title,
          description: task.description || '',
          section,
          progress: 0,
          completed: false,
          isTemplate: task.isTemplate || false,
          templateId: task.templateId || null,
          createdAt: new Date().toISOString(),
          deadline: task.deadline || null,
          timeEstimate: task.timeEstimate || '',
        };
        day.tasks.push(newTask);
        setStore(data);
        logProgress(dateStr, section);
        return newTask;
      }
    }
  }
  return null;
}

export function updateTaskProgress(dateStr, taskId, progress) {
  const data = initData();
  for (const ym of Object.keys(data.months)) {
    for (const wk of Object.keys(data.months[ym].weeks)) {
      if (data.months[ym].weeks[wk].days[dateStr]) {
        const day = data.months[ym].weeks[wk].days[dateStr];
        const task = day.tasks.find(t => t.id === taskId);
        if (task) {
          task.progress = progress;
          task.completed = progress >= 100;
          setStore(data);
          logProgress(dateStr, task.section);
        }
        return;
      }
    }
  }
}

export function removeTask(dateStr, taskId) {
  const data = initData();
  for (const ym of Object.keys(data.months)) {
    for (const wk of Object.keys(data.months[ym].weeks)) {
      if (data.months[ym].weeks[wk].days[dateStr]) {
        const day = data.months[ym].weeks[wk].days[dateStr];
        const task = day.tasks.find(t => t.id === taskId);
        day.tasks = day.tasks.filter(t => t.id !== taskId);
        setStore(data);
        if (task) logProgress(dateStr, task.section);
        return;
      }
    }
  }
}

export function setDayType(dateStr, dayType) {
  const data = initData();
  for (const ym of Object.keys(data.months)) {
    for (const wk of Object.keys(data.months[ym].weeks)) {
      if (data.months[ym].weeks[wk].days[dateStr]) {
        data.months[ym].weeks[wk].days[dateStr].dayType = dayType;
        setStore(data);
        return;
      }
    }
  }
}

export function swapDayTypes(dateStr1, dateStr2) {
  const data = initData();
  let dt1 = null, dt2 = null;
  for (const ym of Object.keys(data.months)) {
    for (const wk of Object.keys(data.months[ym].weeks)) {
      const days = data.months[ym].weeks[wk].days;
      if (days[dateStr1]) dt1 = days[dateStr1].dayType;
      if (days[dateStr2]) dt2 = days[dateStr2].dayType;
    }
  }
  setDayType(dateStr1, dt2);
  setDayType(dateStr2, dt1);
}

export function getWeekDayTypes(weekId) {
  const data = initData();
  for (const ym of Object.keys(data.months)) {
    if (data.months[ym].weeks[weekId]) {
      const days = data.months[ym].weeks[weekId].days;
      const result = {};
      for (const d of Object.keys(days)) {
        result[d] = days[d].dayType;
      }
      return result;
    }
  }
  return {};
}

export function enforceHardDayMinimum(weekId) {
  const dayTypes = getWeekDayTypes(weekId);
  const types = Object.values(dayTypes).filter(Boolean);
  const hardCount = types.filter(t => t === 'hard').length;
  return hardCount >= 2;
}

function logProgress(dateStr, section) {
  const data = initData();
  const day = getDay(dateStr);
  if (!day) return;
  const sectionTasks = day.tasks.filter(t => t.section === section);
  const avgProgress = sectionTasks.length > 0
    ? sectionTasks.reduce((s, t) => s + t.progress, 0) / sectionTasks.length
    : 0;
  const existing = data.progressLog.findIndex(p => p.date === dateStr && p.section === section);
  const entry = { date: dateStr, section, progress: avgProgress, timestamp: new Date().toISOString() };
  if (existing >= 0) data.progressLog[existing] = entry;
  else data.progressLog.push(entry);
  setStore(data);
}

export function getProgressLog() {
  return getStore().progressLog || [];
}

export function getTemplates() {
  return getStore().templates || [];
}

export function addTemplate(template) {
  const data = initData();
  const newTpl = { id: uuidv4(), ...template, createdAt: new Date().toISOString() };
  data.templates.push(newTpl);
  setStore(data);
  return newTpl;
}

export function removeTemplate(id) {
  const data = initData();
  data.templates = data.templates.filter(t => t.id !== id);
  setStore(data);
}

export function getSettings() {
  return getStore().settings || { email: '', notificationsEnabled: true };
}

export function updateSettings(settings) {
  const data = initData();
  data.settings = { ...data.settings, ...settings };
  setStore(data);
}

export function getDayOverview(dateStr) {
  const day = getDay(dateStr);
  if (!day) return { total: 0, completed: 0, avgProgress: 0, sections: {} };
  const sections = {};
  for (const s of SECTIONS) {
    const tasks = day.tasks.filter(t => t.section === s);
    sections[s] = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      avgProgress: tasks.length > 0 ? tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length : 0
    };
  }
  const allTasks = day.tasks;
  return {
    total: allTasks.length,
    completed: allTasks.filter(t => t.completed).length,
    avgProgress: allTasks.length > 0 ? allTasks.reduce((sum, t) => sum + t.progress, 0) / allTasks.length : 0,
    sections
  };
}

export function getWeekOverview(weekId) {
  const data = initData();
  for (const ym of Object.keys(data.months)) {
    if (data.months[ym].weeks[weekId]) {
      const days = data.months[ym].weeks[weekId].days;
      let totalTasks = 0, completedTasks = 0, totalProgress = 0, count = 0;
      for (const d of Object.keys(days)) {
        const overview = getDayOverview(d);
        totalTasks += overview.total;
        completedTasks += overview.completed;
        if (overview.total > 0) {
          totalProgress += overview.avgProgress;
          count++;
        }
      }
      return {
        totalTasks,
        completedTasks,
        avgProgress: count > 0 ? totalProgress / count : 0,
        dayTypes: getWeekDayTypes(weekId)
      };
    }
  }
  return { totalTasks: 0, completedTasks: 0, avgProgress: 0, dayTypes: {} };
}

export function getMonthOverview(yearMonth) {
  const data = initData();
  if (!data.months[yearMonth]) return { totalTasks: 0, completedTasks: 0, avgProgress: 0 };
  const weeks = data.months[yearMonth].weeks;
  let totalTasks = 0, completedTasks = 0, totalProgress = 0, count = 0;
  for (const wk of Object.keys(weeks)) {
    const overview = getWeekOverview(wk);
    totalTasks += overview.totalTasks;
    completedTasks += overview.completedTasks;
    if (overview.totalTasks > 0) {
      totalProgress += overview.avgProgress;
      count++;
    }
  }
  return {
    totalTasks,
    completedTasks,
    avgProgress: count > 0 ? totalProgress / count : 0
  };
}

export function getDatesInMonth(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getDatesInWeek(weekId) {
  const start = parseISO(weekId);
  const end = endOfWeek(start, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getCurrentWeekId() {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

export function getCurrentMonth() {
  return format(new Date(), 'yyyy-MM');
}

export function getToday() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getAllSections() {
  return SECTIONS;
}

export function getAllDayTypes() {
  return DAY_TYPES;
}

export function moveTaskToDate(fromDate, taskId, toDate) {
  const data = initData();
  let movedTask = null;
  for (const ym of Object.keys(data.months)) {
    for (const wk of Object.keys(data.months[ym].weeks)) {
      const fromDay = data.months[ym].weeks[wk].days[fromDate];
      if (fromDay) {
        const idx = fromDay.tasks.findIndex(t => t.id === taskId);
        if (idx >= 0) {
          movedTask = fromDay.tasks.splice(idx, 1)[0];
          break;
        }
      }
    }
    if (movedTask) break;
  }
  if (movedTask) {
    ensureDay(toDate);
    for (const ym of Object.keys(data.months)) {
      for (const wk of Object.keys(data.months[ym].weeks)) {
        const toDay = data.months[ym].weeks[wk].days[toDate];
        if (toDay) {
          toDay.tasks.push(movedTask);
          break;
        }
      }
    }
    setStore(data);
  }
}

export function getUpcomingTasks() {
  const today = getToday();
  const data = initData();
  const tasks = [];
  for (const ym of Object.keys(data.months)) {
    for (const wk of Object.keys(data.months[ym].weeks)) {
      for (const d of Object.keys(data.months[ym].weeks[wk].days)) {
        if (d >= today) {
          const day = data.months[ym].weeks[wk].days[d];
          for (const t of day.tasks) {
            if (!t.completed) tasks.push({ ...t, date: d });
          }
        }
      }
    }
  }
  return tasks.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
}

export function getNextDayType(weekId, preferredType) {
  const dayTypes = getWeekDayTypes(weekId);
  const dates = getDatesInWeek(weekId);
  const today = getToday();
  for (const d of dates) {
    if (d >= today && !dayTypes[d]) return { date: d, type: preferredType };
  }
  return null;
}
