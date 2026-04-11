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

export async function insertLogEntry(entry: {
  task_id: string;
  date: string;
  event: string;
  category: string;
  time_spent?: string;
  file_name?: string;
  created_by: string;
}) {
  const { data, error } = await supabase.from('log_entries').insert(entry).select();
  if (error) { console.error('insertLogEntry:', error); return null; }
  return data;
}
