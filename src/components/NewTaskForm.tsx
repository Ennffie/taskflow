import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { TaskStatus, TaskPriority } from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../types';
import { fetchProfiles, createTask } from '../lib/api';
import type { Profile } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function NewTaskForm({ onClose, onCreated }: Props) {
  const { profile, isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfiles().then(profs => {
      setProfiles(profs);
    });
  }, []);

  // Member: auto-assign self when profile loaded
  useEffect(() => {
    if (!isAdmin && profile?.id && assigneeIds.length === 0) {
      setAssigneeIds([profile.id]);
    }
  }, [profile, isAdmin]);

  const toggleAssignee = (id: string) => {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !profile?.id) return;
    setSaving(true);
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const result = await createTask({
      title: title.trim(),
      description,
      status,
      priority,
      due_date: dueDate || undefined,
      assignee_ids: assigneeIds,
      tags,
      created_by: profile.id,
    });
    setSaving(false);
    if (result) {
      onCreated();
    } else {
      // Task creation failed, stay on form
      console.error('Task creation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: '16px' }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '32px 24px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
          <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>New Task</h3>
          <button onClick={onClose} style={{ padding: '4px' }} className="hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..."
              className="w-full rounded-xl text-sm focus:outline-none" style={{ padding: '12px 16px', border: '1px solid var(--border)' }} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Task description..." rows={3}
              className="w-full rounded-xl text-sm focus:outline-none resize-none" style={{ padding: '12px 16px', border: '1px solid var(--border)' }} />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2" style={{ gap: '16px' }}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl text-sm focus:outline-none bg-white" style={{ padding: '12px 16px', border: '1px solid var(--border)' }}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl text-sm focus:outline-none bg-white" style={{ padding: '12px 16px', border: '1px solid var(--border)' }}>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full rounded-xl text-sm focus:outline-none" style={{ padding: '12px 16px', border: '1px solid var(--border)' }} />
          </div>

          {/* Assignees */}
          {isAdmin ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Assignees</label>
            <div className="flex flex-wrap" style={{ gap: '8px' }}>
              {profiles.filter(p => p.name && p.email).map(p => (
                <button key={p.id} onClick={() => toggleAssignee(p.id)}
                  className="flex items-center rounded-lg text-sm font-medium transition-all"
                  style={{
                    gap: '8px',
                    padding: '8px 12px',
                    background: assigneeIds.includes(p.id) ? 'var(--primary)' : 'var(--bg)',
                    color: assigneeIds.includes(p.id) ? '#fff' : 'var(--text-secondary)',
                    border: assigneeIds.includes(p.id) ? '1px solid var(--primary)' : '1px solid var(--border)',
                  }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold"
                    style={{ background: assigneeIds.includes(p.id) ? 'rgba(255,255,255,0.2)' : 'var(--primary)', color: '#fff' }}>
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Assignee</label>
            <div className="flex items-center" style={{ gap: '8px' }}>
              {assigneeIds.map(id => {
                const p = profiles.find(x => x.id === id);
                if (!p) return null;
                const initials = p.name.split(' ').map((n: string) => n[0]).join('');
                return (
                  <div key={id} className="flex items-center rounded-lg text-sm font-medium" style={{ gap: '8px', padding: '8px 12px', background: 'var(--primary)', color: '#fff' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                      {initials}
                    </div>
                    {p.name}
                  </div>
                );
              })}
            </div>
          </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider" style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>Tags (comma separated)</label>
            <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Design, Mobile, Dashboard..."
              className="w-full rounded-xl text-sm focus:outline-none" style={{ padding: '12px 16px', border: '1px solid var(--border)' }} />
          </div>

          {/* Actions */}
          <div className="flex justify-end" style={{ gap: '12px', paddingTop: '8px' }}>
            <button onClick={onClose} className="rounded-xl text-sm font-medium" style={{ color: 'var(--text-secondary)', padding: '12px 24px' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving || !title.trim()}
              className="rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--primary)', padding: '12px 28px' }}>
              {saving ? 'Saving...' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
