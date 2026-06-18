import { Task, TASKS } from './tasks';

const STORAGE_KEY = 'mootion_tasks_v1';
const QUOTA_KEY = 'mootion_playground_quota_v1';
const TEACHER_ASSIGNED_KEY = 'mootion_teacher_assigned_v1';

export function getStoredTasks(): Task[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // If not set, initialize with default TASKS
    localStorage.setItem(STORAGE_KEY, JSON.stringify(TASKS));
    return TASKS;
  }
  return JSON.parse(stored);
}

export function saveStoredTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function updateTaskStatus(taskId: string, status: 'Not Started' | 'In Progress' | 'Completed', score?: number) {
  const tasks = getStoredTasks();
  const updated = tasks.map(t => {
    if (t.id === taskId) {
      return { ...t, status, score: score !== undefined ? score : t.score };
    }
    return t;
  });
  saveStoredTasks(updated);
  return updated;
}

export function completeAllTasks() {
  const tasks = getStoredTasks();
  const updated = tasks.map(t => ({ ...t, status: 'Completed' as const, score: t.score || 85 }));
  saveStoredTasks(updated);
  return updated;
}

export function resetAllTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(TASKS));
  return TASKS;
}

// Generations Quota
export function getPlaygroundQuota(): number {
  const stored = localStorage.getItem(QUOTA_KEY);
  if (!stored) {
    localStorage.setItem(QUOTA_KEY, '4');
    return 4;
  }
  return parseInt(stored, 10);
}

export function incrementPlaygroundQuota(): number {
  const current = getPlaygroundQuota();
  const next = Math.min(10, current + 1);
  localStorage.setItem(QUOTA_KEY, next.toString());
  return next;
}

export function setPlaygroundQuota(val: number) {
  localStorage.setItem(QUOTA_KEY, val.toString());
}

// Teacher Assigned Status Simulation
export function getTeacherAssignedNew(): boolean {
  return localStorage.getItem(TEACHER_ASSIGNED_KEY) === 'true';
}

export function setTeacherAssignedNew(val: boolean) {
  localStorage.setItem(TEACHER_ASSIGNED_KEY, val ? 'true' : 'false');
}

// Utility to check if any non-completed tasks are in the actual tasks list
export function hasPendingTasks(): boolean {
  // If teacher has simulated assigning a new task
  if (getTeacherAssignedNew()) {
    return true;
  }
  const tasks = getStoredTasks();
  return tasks.some(t => t.status !== 'Completed');
}
