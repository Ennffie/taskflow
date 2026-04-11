import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Paperclip, Clock, Calendar, FileText, Palette, Search, Users, Eye, FileEdit } from 'lucide-react';
import { STATUS_CONFIG } from '../types';
import { fetchTasks, fetchLogEntries } from '../lib/api';
import type { TaskWithData } from '../lib/api';
import type { LogEntryRow } from '../lib/api';

const CAT: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  design:   { label: 'Design',   color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  icon: Palette },
  research: { label: 'Research', color: '#2563eb', bg: 'rgba(37,99,235,0.1)',   icon: Search },
  meeting:  { label: 'Meeting',  color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   icon: Users },
  review:   { label: 'Review',   color: '#d97706', bg: 'rgba(217,119,6,0.1)',   icon: Eye },
  other:    { label: 'Other',    color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: FileEdit },
};

interface LogEntryWithProfile extends LogEntryRow {
  created_by_profile?: { id: string; name: string; email: string; role: string };
}

export function LogBook() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskWithData | null>(null);
  const [entries, setEntries] = useState<LogEntryWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], event: '', category: 'design', timeSpent: '', fileName: '' });

  useEffect(() => {
    if (!taskId) return;
    Promise.all([
      fetchTasks(),
      fetchLogEntries(taskId),
    ]).then(([tasks, logs]) => {
      const t = tasks.find(t => t.id === taskId);
      setTask(t || null);
      setEntries(logs as LogEntryWithProfile[]);
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
    <div className="pb-24 lg:pb-0" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      {/* Back */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-medium mb-6 transition-colors"
        style={{ color: 'var(--primary)' }}>
        <ArrowLeft size={16} /> Back to Tasks
      </button>

      {/* Task Header Card */}
      <div className="rounded-2xl p-6 md:p-8 mb-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>{task.title}</h2>
            {task.description && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>}
          </div>
          <span className={`shrink-0 inline-flex px-4 py-2 rounded-xl text-xs font-bold ${sc.bg} ${sc.color}`}>
            {sc.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-5 mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            {task.updated_by_profile && (
              <>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                  {task.updated_by_profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm font-medium">{task.updated_by_profile.name}</span>
              </>
            )}
          </div>
          {task.due_date && (
            <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Calendar size={15} /> {task.due_date}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <FileText size={15} /> {entries.length} log{entries.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* New Entry Form */}
      {showForm && (
        <div className="rounded-2xl p-6 md:p-8 mb-8" style={{ background: 'var(--surface)', border: '2px solid var(--primary)' }}>
          <h3 className="text-base font-bold mb-5" style={{ color: 'var(--text)' }}>New Log Entry</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ border: '1px solid var(--border)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none bg-white"
                  style={{ border: '1px solid var(--border)' }}>
                  {Object.entries(CAT).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Event / Description</label>
              <textarea value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })}
                placeholder="What did you do?" rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none resize-none"
                style={{ border: '1px solid var(--border)' }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>File Attachment</label>
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm cursor-pointer transition-colors hover:bg-gray-50"
                  style={{ border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                  <Paperclip size={15} />
                  <span className="truncate">{form.fileName || 'Choose file...'}</span>
                  <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm({ ...form, fileName: f.name }); }} />
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Time Spent</label>
                <div className="relative">
                  <Clock size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type="text" value={form.timeSpent} onChange={(e) => setForm({ ...form, timeSpent: e.target.value })}
                    placeholder="e.g. 02:30"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ border: '1px solid var(--border)' }} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="px-5 py-3 rounded-xl text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={() => { if (!form.event.trim()) return; alert('Saved!'); setShowForm(false); setForm({ date: new Date().toISOString().split('T')[0], event: '', category: 'design', timeSpent: '', fileName: '' }); }}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}>Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-6" style={{ marginTop: '40px' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Log Book Timeline</h3>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{entries.length} entries</span>
        </div>

        {/* Add Entry Button — Desktop */}
        <button onClick={() => setShowForm(!showForm)}
          className="hidden md:flex items-center gap-2 text-sm font-semibold px-5 py-3 rounded-xl mb-6 transition-all"
          style={{ background: 'rgba(123,104,238,0.1)', color: 'var(--primary)' }}>
          <Plus size={16} /> Add Log Entry
        </button>

        {dates.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <FileText size={48} className="mx-auto mb-4" style={{ color: '#d1d5db' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No log entries yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click + to add your first entry</p>
          </div>
        ) : dates.map((date) => (
          <div key={date} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: 'var(--primary)' }} />
              <h4 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{date}</h4>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {grouped[date].length} entr{grouped[date].length !== 1 ? 'ies' : 'y'}
              </span>
            </div>
            <div className="ml-1.5 pl-8 space-y-3" style={{ borderLeft: '2px solid var(--border)' }}>
              {grouped[date].map((entry) => {
                const cat = CAT[entry.category || 'other'];
                const creatorName = entry.created_by_profile?.name || 'Unknown';
                return (
                  <div key={entry.id} className="relative rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div className="absolute -left-[34px] top-6 w-3.5 h-3.5 rounded-full border-[3px] border-white" style={{ background: 'var(--primary)' }} />
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                        style={{ background: cat.bg, color: cat.color }}>
                        <cat.icon size={12} /> {cat.label}
                      </span>
                      {entry.time_spent && (
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          <Clock size={11} /> {entry.time_spent}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text)' }}>{entry.event}</p>
                    {entry.file_name && (
                      <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--primary)' }}>
                        <Paperclip size={12} /> {entry.file_name}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                        {creatorName.charAt(0)}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{creatorName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FAB — Mobile */}
      <button onClick={() => setShowForm(!showForm)}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-2xl text-white shadow-xl flex items-center justify-center z-40 active:scale-95 transition-transform"
        style={{ background: 'var(--primary)' }}>
        <Plus size={24} />
      </button>
    </div>
  );
}
