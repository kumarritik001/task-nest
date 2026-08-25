import { v4 as uuidv4 } from 'uuid';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, parseISO } from 'date-fns';

const SECTIONS = ['Core Engineering', 'Project', 'Job', 'Market Analysis'];
const DAY_TYPES = ['hard', 'moderate', 'easy'];

function get() {
  try { return JSON.parse(localStorage.getItem('tn_data')) || {}; }
  catch { return {}; }
}

function set(d) { localStorage.setItem('tn_data', JSON.stringify(d)); }

function init() {
  const d = get();
  if (!d.tasks) d.tasks = {};
  if (!d.templates) d.templates = [];
  if (!d.dayTypes) d.dayTypes = {};
  if (!d.progressLog) d.progressLog = [];
  if (!d.settings) d.settings = { email: '' };
  set(d);
  return d;
}

// ── Tasks ──

export function getTasks(dateStr) {
  const d = init();
  return d.tasks[dateStr] || [];
}

export function addTask(dateStr, task) {
  const d = init();
  if (!d.tasks[dateStr]) d.tasks[dateStr] = [];
  const newTask = {
    id: uuidv4(),
    title: task.title,
    description: task.description || '',
    section: task.section || 'Core Engineering',
    progress: 0,
    completed: false,
    deadline: task.deadline || null,
    timeEstimate: task.timeEstimate || '',
    subtasks: (task.subtasks || []).map(st => ({
      id: uuidv4(),
      title: st.title,
      completed: false
    })),
    createdAt: new Date().toISOString()
  };
  d.tasks[dateStr].push(newTask);
  set(d);
  logProgress(dateStr, newTask.section);
  return newTask;
}

export function updateTask(dateStr, taskId, updates) {
  const d = init();
  const tasks = d.tasks[dateStr] || [];
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    Object.assign(task, updates);
    if (task.subtasks) {
      const done = task.subtasks.filter(s => s.completed).length;
      task.progress = task.subtasks.length > 0
        ? Math.round((done / task.subtasks.length) * 100)
        : task.progress;
      task.completed = task.subtasks.length > 0
        ? task.subtasks.every(s => s.completed)
        : task.completed;
    }
    set(d);
    logProgress(dateStr, task.section);
  }
}

export function setTaskProgress(dateStr, taskId, progress) {
  const d = init();
  const task = (d.tasks[dateStr] || []).find(t => t.id === taskId);
  if (task) {
    task.progress = progress;
    task.completed = progress >= 100;
    if (task.subtasks && task.subtasks.length > 0) {
      const count = Math.round((progress / 100) * task.subtasks.length);
      task.subtasks.forEach((st, i) => { st.completed = i < count; });
    }
    set(d);
    logProgress(dateStr, task.section);
  }
}

export function removeTask(dateStr, taskId) {
  const d = init();
  const task = (d.tasks[dateStr] || []).find(t => t.id === taskId);
  if (task) {
    d.tasks[dateStr] = d.tasks[dateStr].filter(t => t.id !== taskId);
    set(d);
    logProgress(dateStr, task.section);
  }
}

export function toggleSubtask(dateStr, taskId, subtaskId) {
  const d = init();
  const task = (d.tasks[dateStr] || []).find(t => t.id === taskId);
  if (task) {
    const st = task.subtasks.find(s => s.id === subtaskId);
    if (st) {
      st.completed = !st.completed;
      const done = task.subtasks.filter(s => s.completed).length;
      task.progress = Math.round((done / task.subtasks.length) * 100);
      task.completed = task.subtasks.every(s => s.completed);
      set(d);
      logProgress(dateStr, task.section);
    }
  }
}

export function addSubtask(dateStr, taskId, title) {
  const d = init();
  const task = (d.tasks[dateStr] || []).find(t => t.id === taskId);
  if (task) {
    task.subtasks.push({ id: uuidv4(), title, completed: false });
    const done = task.subtasks.filter(s => s.completed).length;
    task.progress = Math.round((done / task.subtasks.length) * 100);
    set(d);
  }
}

export function removeSubtask(dateStr, taskId, subtaskId) {
  const d = init();
  const task = (d.tasks[dateStr] || []).find(t => t.id === taskId);
  if (task) {
    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
    if (task.subtasks.length > 0) {
      const done = task.subtasks.filter(s => s.completed).length;
      task.progress = Math.round((done / task.subtasks.length) * 100);
      task.completed = task.subtasks.every(s => s.completed);
    } else {
      task.progress = task.completed ? 100 : 0;
    }
    set(d);
  }
}

// ── Day Types ──

export function getDayType(dateStr) {
  return get().dayTypes[dateStr] || null;
}

export function setDayType(dateStr, type) {
  const d = init();
  d.dayTypes[dateStr] = type;
  set(d);
}

export function getWeekDayTypes(weekId) {
  const d = init();
  const dates = getDatesInWeek(weekId);
  const result = {};
  dates.forEach(ds => { result[ds] = d.dayTypes[ds] || null; });
  return result;
}

export function swapDayTypes(d1, d2) {
  const d = init();
  const t1 = d.dayTypes[d1], t2 = d.dayTypes[d2];
  d.dayTypes[d1] = t2 || null;
  d.dayTypes[d2] = t1 || null;
  set(d);
}

export function hardDayCount(weekId) {
  const types = Object.values(getWeekDayTypes(weekId));
  return types.filter(t => t === 'hard').length;
}

// ── Progress ──

function logProgress(dateStr, section) {
  const d = init();
  const tasks = d.tasks[dateStr] || [];
  const secTasks = tasks.filter(t => t.section === section);
  const avg = secTasks.length > 0
    ? secTasks.reduce((s, t) => s + t.progress, 0) / secTasks.length
    : 0;
  const idx = d.progressLog.findIndex(p => p.date === dateStr && p.section === section);
  const entry = { date: dateStr, section, progress: Math.round(avg) };
  if (idx >= 0) d.progressLog[idx] = entry;
  else d.progressLog.push(entry);
  set(d);
}

export function getProgressLog() { return get().progressLog || []; }

// ── Templates ──

export function getTemplates() { return get().templates || []; }

export function addTemplate(tpl) {
  const d = init();
  const newTpl = { id: uuidv4(), ...tpl, createdAt: new Date().toISOString() };
  d.templates.push(newTpl);
  set(d);
  return newTpl;
}

export function removeTemplate(id) {
  const d = init();
  d.templates = d.templates.filter(t => t.id !== id);
  set(d);
}

// ── Settings ──

export function getSettings() { return get().settings || { email: '' }; }

export function updateSettings(s) {
  const d = init();
  d.settings = { ...d.settings, ...s };
  set(d);
}

// ── Date Helpers ──

export function getToday() { return format(new Date(), 'yyyy-MM-dd'); }
export function getCurrentWeekId() { return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'); }
export function getCurrentMonth() { return format(new Date(), 'yyyy-MM'); }

export function getDatesInWeek(weekId) {
  const start = parseISO(weekId);
  return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getDatesInMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  return eachDayOfInterval({ start, end: endOfMonth(start) }).map(d => format(d, 'yyyy-MM-dd'));
}

export function getWeeksInMonth(ym) {
  const dates = getDatesInMonth(ym);
  if (dates.length === 0) return [];
  const weeks = [];
  let cursor = startOfWeek(parseISO(dates[0]), { weekStartsOn: 1 });

  for (let i = 0; i < 6; i++) {
    const wStart = cursor;
    const wEnd = addDays(wStart, 6);
    const wDates = eachDayOfInterval({ start: wStart, end: wEnd })
      .filter(d => format(d, 'yyyy-MM') === ym)
      .map(d => format(d, 'yyyy-MM-dd'));
    if (wDates.length > 0) {
      weeks.push({ id: format(wStart, 'yyyy-MM-dd'), dates: wDates, start: wStart, end: wEnd });
    }
    cursor = addDays(cursor, 7);
    if (format(wStart, 'yyyy-MM') !== ym && weeks.length > 0) break;
  }
  return weeks;
}

// ── Overviews ──

export function getDayOverview(dateStr) {
  const tasks = getTasks(dateStr);
  const sections = {};
  SECTIONS.forEach(s => {
    const st = tasks.filter(t => t.section === s);
    sections[s] = {
      total: st.length,
      done: st.filter(t => t.completed).length,
      progress: st.length > 0 ? Math.round(st.reduce((sum, t) => sum + t.progress, 0) / st.length) : 0
    };
  });
  return {
    total: tasks.length,
    done: tasks.filter(t => t.completed).length,
    progress: tasks.length > 0 ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length) : 0,
    sections
  };
}

export function getWeekOverview(weekId) {
  const dates = getDatesInWeek(weekId);
  let total = 0, done = 0, progSum = 0, count = 0;
  dates.forEach(ds => {
    const ov = getDayOverview(ds);
    total += ov.total;
    done += ov.done;
    if (ov.total > 0) { progSum += ov.progress; count++; }
  });
  return { total, done, progress: count > 0 ? Math.round(progSum / count) : 0 };
}

export function getMonthOverview(ym) {
  const dates = getDatesInMonth(ym);
  let total = 0, done = 0, progSum = 0, count = 0;
  dates.forEach(ds => {
    const ov = getDayOverview(ds);
    total += ov.total;
    done += ov.done;
    if (ov.total > 0) { progSum += ov.progress; count++; }
  });
  return { total, done, progress: count > 0 ? Math.round(progSum / count) : 0 };
}

export function getUpcomingTasks() {
  const today = getToday();
  const d = init();
  const tasks = [];
  Object.keys(d.tasks).forEach(dateStr => {
    if (dateStr >= today) {
      d.tasks[dateStr].forEach(t => {
        if (!t.completed) tasks.push({ ...t, date: dateStr });
      });
    }
  });
  return tasks.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);
}

export function getAllSections() { return SECTIONS; }
export function getAllDayTypes() { return DAY_TYPES; }
