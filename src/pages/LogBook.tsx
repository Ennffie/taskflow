import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, Calendar, FileText, Edit2, Link2, Trash2 } from 'lucide-react';
import { STATUS_CONFIG, PRIORITY_CONFIG, CAT } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchTasks, fetchLogEntries, insertLogEntry, updateLogEntry, updateTask, fetchProfiles, updateTaskAssignees, deleteLogEntry, deleteTask } from '../lib/api';
import type { TaskWithData, Profile } from '../lib/api';
import type { LogEntryRow } from '../lib/api';
import { CURRENT_USER_ID } from '../lib/api';

interface LogEntryWithProfile extends LogEntryRow {
  created_by_profile?: { id: string; name: string; email: string; role: string };
}

export function LogBook() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [task, setTask] = useState<TaskWithData | null>(null);
  const [entries, setEntries] = useState<LogEntryWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], event: '', category: 'design', status: '' as string, timeSpent: '', fileName: '' });
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<'log' | 'task'>('log');
  const [editForm, setEditForm] = useState({ title: '', description: '', status: 'todo' as any, priority: 'medium' as any, assigneeIds: [] as string[] });

  useEffect(() => {
    if (!taskId) return;
    Promise.all([
      fetchTasks(),
      fetchLogEntries(taskId),
      fetchProfiles(),
    ]).then(([tasks, logs, profs]) => {
      const t = tasks.find(t => t.id === taskId);
      setTask(t || null);
      setEntries(logs as LogEntryWithProfile[]);
      setProfiles(profs);
      setLoading(false);
    });
  }, [taskId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>;
  }

  if (!task) return <div className="flex items-center justify-center h-64"><p style={{ color: 'var(--text-secondary)' }}>Task not found</p></div>;

  const sc = STATUS_CONFIG[task.status];
  const grouped = entries.reduce<Record<string, LogEntryWithProfile[]>>((a, e) => { (a[e.date] = a[e.date] || []).push(e); return a; }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="pb-24 lg:pb-0">
      <div style={{ maxWidth: '1024px', marginLeft: 'auto', marginRight: 'auto' }}>
      {/* Back */}
      <button onClick={() => navigate('/')} className="flex items-center font-medium transition-colors"
        style={{ color: 'var(--primary)', padding: '10px 16px', fontSize: '15px', gap: '8px', marginBottom: '24px' }}>
        <ArrowLeft size={18} /> Back to Tasks
      </button>

      {/* Edit Task Inline Form */}
      {showEditTask && task && (
        <div className="rounded-2xl max-h-[80vh] overflow-y-auto" style={{ background: 'var(--surface)', border: '2px solid var(--primary)', padding: '32px 24px', marginBottom: '16px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>Edit Task</h3>
            <button 
              onClick={() => { setConfirmDeleteTarget('task'); setShowConfirmDelete(true); }}
              className="text-sm font-medium rounded-lg transition-colors"
              style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '6px 12px' }}>
              Delete
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-muted)' }}>Title</label>
              <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-muted)' }}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} rows={3}
                style={{ width: '100%', padding: '14px 18px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div className="grid grid-cols-2" style={{ gap: '12px' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-muted)' }}>Status</label>
                <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value as any})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 14, boxSizing: 'border-box' }}>
                  {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-muted)' }}>Priority</label>
                <select value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value as any})}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 14, boxSizing: 'border-box' }}>
                  {Object.keys(PRIORITY_CONFIG).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p as keyof typeof PRIORITY_CONFIG].label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, display: 'block', color: 'var(--text-muted)' }}>Assignees</label>
              <div className="flex flex-wrap" style={{ gap: '8px' }}>
                {profiles.filter(p => p.name && p.email).map(p => (
                  <button key={p.id} onClick={() => {
                    const ids = editForm.assigneeIds.includes(p.id) 
                      ? editForm.assigneeIds.filter(id => id !== p.id)
                      : [...editForm.assigneeIds, p.id];
                    setEditForm({...editForm, assigneeIds: ids});
                  }}
                  className="rounded-lg text-xs font-medium transition-colors"
                  style={{ background: editForm.assigneeIds.includes(p.id) ? 'var(--primary)' : 'var(--bg)', border: '1px solid var(--border)', color: editForm.assigneeIds.includes(p.id) ? '#fff' : 'var(--text)', padding: '6px 12px' }}>
                    {p.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end" style={{ gap: '12px', marginTop: '48px' }}>
            <button onClick={() => setShowEditTask(false)} style={{ padding: '12px 24px', borderRadius: 12, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
            <button onClick={async () => {
              await updateTask(task.id, { title: editForm.title, description: editForm.description, status: editForm.status, priority: editForm.priority, updated_by: CURRENT_USER_ID });
              await updateTaskAssignees(task.id, editForm.assigneeIds);
              setShowEditTask(false);
              const tasks = await fetchTasks();
              setTask(tasks.find(t => t.id === taskId) || null);
            }} style={{ padding: '12px 28px', borderRadius: 12, background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Save</button>
          </div>
        </div>
      )}

      {/* Task Header Card - hidden when editing */}
      {!showEditTask && task && (
      <>
      <div className="rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px 32px', marginBottom: '16px' }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between" style={{ gap: '16px' }}>
          <div style={{ flex: '1 1 0%' }}>
            <div className="flex items-start justify-between" style={{ gap: '12px', marginBottom: '8px' }}>
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text)' }}>{task.title}</h2>
              {isAdmin && (
              <button 
                onClick={() => {
                  setEditForm({ 
                    title: task.title, 
                    description: task.description || '', 
                    status: task.status, 
                    priority: task.priority, 
                    assigneeIds: task.assignees.map(a => a.id)
                  });
                  setShowEditTask(true);
                }}
                className="flex items-center rounded-lg text-xs font-medium border transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', gap: '6px', padding: '6px 12px' }}>
                <Edit2 size={12} /> Edit
              </button>
              )}
            </div>
            {task.description && <p className="text-sm" style={{ lineHeight: '1.625', color: 'var(--text-secondary)' }}>{task.description}</p>}
          </div>
          <span className={`shrink-0 inline-flex rounded-xl text-xs font-bold ${sc.bg} ${sc.color}`} style={{ padding: '8px 16px' }}>
            {sc.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center" style={{ gap: '20px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          {task.assignees.length > 0 && (
            <div className="flex items-center" style={{ gap: '10px' }}>
              {task.assignees.length === 1 ? (
                <>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                    {task.assignees[0].name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-sm font-medium">{task.assignees[0].name}</span>
                </>
              ) : (
                <div className="flex" style={{ marginLeft: '-8px' }}>
                  {task.assignees.map((a, i) => (
                    <div key={a.id} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2" 
                      style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--surface)', zIndex: task.assignees.length - i, marginLeft: i === 0 ? 0 : '-8px' }}>
                      {a.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className={`flex items-center text-xs font-semibold ${PRIORITY_CONFIG[task.priority].color}`} style={{ gap: '6px' }}>
            <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[task.priority].dot}`} />
            {PRIORITY_CONFIG[task.priority].label}
          </div>
          {task.due_date && (
            <span className="flex items-center text-sm" style={{ color: 'var(--text-secondary)', gap: '6px' }}>
              <Calendar size={15} /> {task.due_date}
            </span>
          )}
          <span className="flex items-center text-sm" style={{ color: 'var(--text-secondary)', gap: '6px' }}>
            <FileText size={15} /> {entries.length} log{entries.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      </>
      )}
      {showForm && (
        <div className="rounded-2xl max-h-[80vh] overflow-y-auto" style={{ background: 'var(--surface)', border: '2px solid var(--primary)', padding: '32px 24px', marginBottom: '32px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>{editingLogId ? 'Edit Log Entry' : 'New Log Entry'}</h3>
            {editingLogId && (
              <button 
                onClick={() => { setConfirmDeleteTarget('log'); setShowConfirmDelete(true); }}
                className="text-sm font-medium rounded-lg transition-colors"
                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '6px 12px' }}>
                Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '16px' }}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl text-sm focus:outline-none"
                  style={{ padding: '12px 16px', border: '1px solid var(--border)' }} />
              </div>
              <div className="grid grid-cols-2" style={{ gap: '16px' }}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-xl text-sm focus:outline-none bg-white"
                  style={{ padding: '12px 16px', border: '1px solid var(--border)' }}>
                  {Object.entries(CAT).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl text-sm focus:outline-none bg-white"
                  style={{ padding: '12px 16px', border: '1px solid var(--border)' }}>
                  <option value="">No change</option>
                  {Object.entries(STATUS_CONFIG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
              </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Event / Description</label>
              <textarea value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })}
                placeholder="What did you do?" rows={3}
                className="w-full rounded-xl text-sm focus:outline-none resize-none"
                style={{ padding: '12px 16px', border: '1px solid var(--border)' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '16px' }}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>File / Link</label>
                <div className="relative">
                  <Link2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type="url" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl text-sm focus:outline-none"
                    style={{ border: '1px solid var(--border)', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Time Spent</label>
                <div className="relative">
                  <Clock size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <select value={form.timeSpent} onChange={(e) => setForm({ ...form, timeSpent: e.target.value })}
                    className="w-full rounded-xl text-sm focus:outline-none bg-white appearance-none"
                    style={{ border: '1px solid var(--border)', paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}>
                    <option value="">Select time...</option>
                    {[15,30,45,60,75,90,105,120,135,150,165,180,210,240,300,360,420,480].map(mins => {
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      const label = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
                      return <option key={mins} value={label}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end" style={{ gap: '12px', paddingTop: '8px' }}>
              <button onClick={() => { setShowForm(false); setEditingLogId(null); }} className="rounded-xl text-sm font-medium" style={{ color: 'var(--text-secondary)', padding: '12px 24px' }}>Cancel</button>
              <button onClick={async () => {
                if (!form.event.trim() || !taskId) return;
                let eventText = form.event.trim();
                if (form.status && task) {
                  const sLabel = STATUS_CONFIG[form.status as keyof typeof STATUS_CONFIG]?.label || form.status;
                  const oLabel = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG]?.label || task.status;
                  eventText = `[Status: ${oLabel} → ${sLabel}]\n${eventText}`;
                }
                if (editingLogId) {
                  await updateLogEntry(editingLogId, {
                    date: form.date,
                    event: eventText,
                    category: form.category,
                    time_spent: form.timeSpent || undefined,
                    file_name: form.fileName || undefined,
                  });
                } else {
                  await insertLogEntry({
                    task_id: taskId,
                    date: form.date,
                    event: eventText,
                    category: form.category,
                    time_spent: form.timeSpent || undefined,
                    file_name: form.fileName || undefined,
                    created_by: CURRENT_USER_ID,
                  });
                }
                // Update task status if changed
                if (form.status && task) {
                  await updateTask(task.id, { status: form.status as any, updated_by: CURRENT_USER_ID });
                }
                setShowForm(false);
                setEditingLogId(null);
                setForm({ date: new Date().toISOString().split('T')[0], event: '', category: 'design', status: '', timeSpent: '', fileName: '' });
                // Reload entries and force refresh to show new log
                const logs = await fetchLogEntries(taskId);
                setEntries(logs as LogEntryWithProfile[]);
                
                // Small delay to ensure Supabase sync before reload
                setTimeout(() => {
                  // Force page reload with cache busting
                  window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
                }, 300);
              }}
                className="rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)', padding: '12px 28px' }}>{editingLogId ? 'Update Entry' : 'Save Entry'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div style={{ marginBottom: '24px', marginTop: '40px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Log Book Timeline</h3>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{entries.length} entries</span>
        </div>

        {/* Add Entry Button — Desktop */}
        <button onClick={() => setShowForm(!showForm)}
          className="hidden md:flex items-center text-sm font-semibold rounded-xl transition-all"
          style={{ background: 'rgba(123,104,238,0.1)', color: 'var(--primary)', gap: '8px', padding: '12px 20px', marginBottom: '24px' }}>
          <Plus size={16} /> Add Log Entry
        </button>

        {dates.length === 0 ? (
          <div className="rounded-2xl text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '48px' }}>
            <FileText size={48} className="mx-auto" style={{ color: '#d1d5db', marginBottom: '16px' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No log entries yet</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Click + to add your first entry</p>
          </div>
        ) : dates.map((date) => (
          <div key={date} style={{ marginBottom: '56px' }}>
            <div className="flex items-center" style={{ gap: '12px', marginBottom: '20px' }}>
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--primary)' }} />
              <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{date}</h4>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {grouped[date].length} entr{grouped[date].length !== 1 ? 'ies' : 'y'}
              </span>
            </div>
            <div className="ml-1.5" style={{ paddingLeft: '32px', borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {grouped[date].map((entry) => {
                const cat = CAT[entry.category || 'other'];
                const creatorName = entry.created_by_profile?.name || 'Unknown';
                return (
                  <div key={entry.id} 
                    onClick={() => {
                      setEditingLogId(entry.id);
                      setForm({ 
                        date: entry.date, 
                        event: entry.event, 
                        category: entry.category || 'design', 
                        status: '',
                        timeSpent: entry.time_spent || '', 
                        fileName: entry.file_name || ''
                      });
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="relative rounded-2xl cursor-pointer hover:shadow-md transition-shadow z-10" 
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '24px' }}>
                    {/* Header: Category + Status + User */}
                    <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                      <div className="flex items-center" style={{ gap: '10px' }}>
                        <span className="inline-flex items-center rounded-lg text-[11px] font-semibold"
                          style={{ background: cat.bg, color: cat.color, gap: '4px', padding: '6px 12px' }}>
                          {cat.label}
                        </span>
                        {entry.time_spent && (
                          <span className="flex items-center text-[11px]" style={{ color: 'var(--text-muted)', gap: '4px' }}>
                            <Clock size={11} /> {entry.time_spent}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center" style={{ gap: '8px' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                          {creatorName.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{creatorName}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div style={{ color: 'var(--text)' }}>
                      {entry.event.split('\n').map((line, i) => {
                        if (line.startsWith('[Status:') && line.endsWith(']')) {
                          return <div key={i} className="font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--primary)', marginBottom: '12px', padding: '8px 12px', background: 'rgba(123,104,238,0.08)', borderRadius: '8px', display: 'inline-block' }}>{line.slice(1, -1)}</div>;
                        }
                        return <p key={i} style={{ lineHeight: '1.7', fontSize: '14px', marginBottom: '8px' }}>{line}</p>;
                      })}
                    </div>
                    
                    {/* Footer: File attachment */}
                    {entry.file_name && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <div className="flex items-center text-xs font-medium" style={{ color: 'var(--primary)', gap: '8px', padding: '8px 12px', background: 'rgba(123,104,238,0.05)', borderRadius: '8px', display: 'inline-flex' }}>
                          <Link2 size={14} /> 
                          <span>{entry.file_name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Delete Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" style={{ padding: '16px' }} onClick={() => setShowConfirmDelete(false)}>
          <div className="w-full max-w-sm rounded-2xl" style={{ background: 'var(--surface)', padding: '32px 28px' }} onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', marginBottom: '16px' }}>
                <Trash2 size={22} style={{ color: '#ef4444' }} />
              </div>
              <h4 className="text-base font-bold" style={{ color: 'var(--text)', marginBottom: '8px' }}>{confirmDeleteTarget === 'task' ? 'Delete Task' : 'Delete Log Entry'}</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{confirmDeleteTarget === 'task' ? 'Are you sure you want to delete this task? All logs will be lost. This action cannot be undone.' : 'Are you sure you want to delete this entry? This action cannot be undone.'}</p>
              <div className="flex w-full" style={{ gap: '12px' }}>
                <button onClick={() => setShowConfirmDelete(false)} 
                  className="flex-1 rounded-xl text-sm font-medium" 
                  style={{ padding: '12px 0', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                <button onClick={async () => {
                  if (confirmDeleteTarget === 'task' && task) {
                    await deleteTask(task.id);
                    setShowConfirmDelete(false);
                    navigate('/');
                  } else if (editingLogId) {
                    await deleteLogEntry(editingLogId);
                    setEditingLogId(null);
                    setShowForm(false);
                    setForm({ date: new Date().toISOString().split('T')[0], event: '', category: 'design', status: '', timeSpent: '', fileName: '' });
                    const logs = await fetchLogEntries(taskId || '');
                    setEntries(logs as LogEntryWithProfile[]);
                  }
                  setShowConfirmDelete(false);
                }} 
                  className="flex-1 rounded-xl text-sm font-medium text-white" 
                  style={{ padding: '12px 0', background: '#ef4444' }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB — Mobile */}
      <button onClick={() => setShowForm(!showForm)}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center z-40 active:scale-95 transition-transform"
        style={{ background: 'var(--primary)' }}>
        <Plus size={24} />
      </button>
      </div>
    </div>
  );
}
