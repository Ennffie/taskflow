import { supabase } from './supabase';
import type { TaskStatus, TaskPriority } from '../types';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  avatar_url?: string;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskAssigneeRow {
  id: string;
  task_id: string;
  user_id: string;
}

export interface LogEntryRow {
  id: string;
  task_id: string;
  date: string;
  event: string;
  category: 'design' | 'research' | 'meeting' | 'review' | 'other';
  time_spent: string | null;
  file_name: string | null;
  file_url: string | null;
  created_by: string;
  created_at: string;
}

export interface TagRow {
  id: string;
  task_id: string;
  name: string;
}

export interface TaskWithData extends TaskRow {
  assignees: Profile[];
  tags_list: string[];
  updated_by_profile?: Profile;
  log_count: number;
}

// ============ READ ============

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) { console.error('fetchProfiles:', error); return []; }
  return data || [];
}

export async function fetchTasks(): Promise<TaskWithData[]> {
  const [tasksRes, assigneesRes, tagsRes, logsRes, profilesRes] = await Promise.all([
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('task_assignees').select('*'),
    supabase.from('tags').select('*'),
    supabase.from('log_entries').select('task_id'),
    supabase.from('profiles').select('*'),
  ]);

  if (tasksRes.error) { console.error('fetchTasks:', tasksRes.error); return []; }

  const profiles: Profile[] = profilesRes.data || [];
  const profileMap = new Map(profiles.map(p => [p.id, p]));
  const assignees: TaskAssigneeRow[] = assigneesRes.data || [];
  const tags: TagRow[] = tagsRes.data || [];
  const logs: { task_id: string }[] = logsRes.data || [];

  const logCountMap = new Map<string, number>();
  logs.forEach(l => { logCountMap.set(l.task_id, (logCountMap.get(l.task_id) || 0) + 1); });

  return (tasksRes.data || []).map((task: TaskRow) => ({
    ...task,
    assignees: assignees.filter(a => a.task_id === task.id).map(a => profileMap.get(a.user_id)).filter(Boolean) as Profile[],
    tags_list: tags.filter(t => t.task_id === task.id).map(t => t.name),
    updated_by_profile: task.updated_by ? profileMap.get(task.updated_by) : undefined,
    log_count: logCountMap.get(task.id) || 0,
  }));
}

export async function fetchLogEntries(taskId: string): Promise<(LogEntryRow & { created_by_profile?: Profile })[]> {
  const [logsRes, profilesRes] = await Promise.all([
    supabase.from('log_entries').select('*').eq('task_id', taskId).order('date', { ascending: false }),
    supabase.from('profiles').select('*'),
  ]);

  if (logsRes.error) { console.error('fetchLogEntries:', logsRes.error); return []; }

  const profiles: Profile[] = profilesRes.data || [];
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return (logsRes.data || []).map((log: LogEntryRow) => ({
    ...log,
    created_by_profile: profileMap.get(log.created_by),
  }));
}

export async function fetchAllLogEntries(): Promise<{ id: string; task_id: string; date: string; created_by: string }[]> {
  const { data, error } = await supabase.from('log_entries').select('id, task_id, date, created_by');
  if (error) { console.error('fetchAllLogEntries:', error); return []; }
  return data || [];
}

// ============ CREATE ============

export async function createTask(params: {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  assignee_ids: string[];
  tags: string[];
  created_by: string;
}): Promise<TaskWithData | null> {
  const { title, description, status, priority, due_date, assignee_ids, tags, created_by } = params;

  // Insert task
  const { data: taskData, error: taskErr } = await supabase.from('tasks').insert({
    title,
    description: description || null,
    status,
    priority,
    due_date: due_date || null,
    created_by,
    updated_by: created_by,
  }).select().single();

  if (taskErr || !taskData) { 
    console.error('createTask:', taskErr); 
    alert(`Create task failed: ${taskErr?.message || 'Unknown error'}`);
    return null; 
  }

  const taskId = taskData.id;

  // Insert assignees
  if (assignee_ids.length > 0) {
    const { error: assignErr } = await supabase.from('task_assignees').insert(
      assignee_ids.map(uid => ({ task_id: taskId, user_id: uid }))
    );
    if (assignErr) console.error('createTask assignees:', assignErr);
  }

  // Insert tags
  if (tags.length > 0) {
    const { error: tagErr } = await supabase.from('tags').insert(
      tags.filter(t => t.trim()).map(name => ({ task_id: taskId, name: name.trim() }))
    );
    if (tagErr) console.error('createTask tags:', tagErr);
  }

  // Fetch complete task
  const allTasks = await fetchTasks();
  return allTasks.find(t => t.id === taskId) || null;
}

export async function insertLogEntry(params: {
  task_id: string;
  date: string;
  event: string;
  category: string;
  time_spent?: string;
  file_name?: string;
  created_by: string;
}) {
  const { data, error } = await supabase.from('log_entries').insert(params).select();
  if (error) { 
    console.error('insertLogEntry:', error); 
    alert(`Add log failed: ${error?.message || 'Unknown error'}`);
    return null; 
  }
  return data;
}

export async function updateLogEntry(logId: string, updates: {
  date?: string;
  event?: string;
  category?: string;
  time_spent?: string;
  file_name?: string;
}) {
  const { data, error } = await supabase.from('log_entries').update(updates).eq('id', logId).select();
  if (error) { console.error('updateLogEntry:', error); return null; }
  return data;
}

// ============ UPDATE ============

export async function updateTask(taskId: string, updates: {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  updated_by: string;
}): Promise<boolean> {
  const { error } = await supabase.from('tasks').update(updates).eq('id', taskId);
  if (error) { console.error('updateTask:', error); return false; }
  return true;
}

export async function updateTaskAssignees(taskId: string, assigneeIds: string[]): Promise<boolean> {
  // Delete existing
  await supabase.from('task_assignees').delete().eq('task_id', taskId);
  // Insert new
  if (assigneeIds.length > 0) {
    const { error } = await supabase.from('task_assignees').insert(
      assigneeIds.map(uid => ({ task_id: taskId, user_id: uid }))
    );
    if (error) { console.error('updateTaskAssignees:', error); return false; }
  }
  return true;
}

export async function updateTaskTags(taskId: string, tagNames: string[]): Promise<boolean> {
  await supabase.from('tags').delete().eq('task_id', taskId);
  const filtered = tagNames.filter(t => t.trim());
  if (filtered.length > 0) {
    const { error } = await supabase.from('tags').insert(
      filtered.map(name => ({ task_id: taskId, name: name.trim() }))
    );
    if (error) { console.error('updateTaskTags:', error); return false; }
  }
  return true;
}

// ============ DELETE ============

export async function deleteTask(taskId: string): Promise<boolean> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) { console.error('deleteTask:', error); return false; }
  return true;
}

export async function deleteLogEntry(entryId: string): Promise<boolean> {
  const { error } = await supabase.from('log_entries').delete().eq('id', entryId);
  if (error) { console.error('deleteLogEntry:', error); return false; }
  return true;
}

// ============ AUTH ============

// Current user fallback for PMC tracker data writes.
// Existing database rows and seeded relationships depend on this id.
export const CURRENT_USER_ID = 'a0000001-0000-0000-0000-000000000001';
