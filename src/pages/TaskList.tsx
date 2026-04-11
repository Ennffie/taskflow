import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, ChevronDown, Calendar, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TaskStatus, TaskPriority } from '../types';
import { mockTasks, STATUS_CONFIG, PRIORITY_CONFIG } from '../types';

function relativeDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TaskList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [openDropdown, setOpenDropdown] = useState<'status' | 'priority' | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
          setOpenDropdown(null);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = mockTasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="pb-24 lg:pb-0" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </p>
        <button className="flex items-center gap-2 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
          style={{ background: 'var(--primary)' }}>
          <Plus size={16} strokeWidth={2.5} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-11 py-3 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        </div>

        <div className="flex gap-2">
          {/* Status Dropdown */}
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <Filter size={16} className="text-gray-400" />
              <span>{statusFilter === 'all' ? 'Status' : STATUS_CONFIG[statusFilter].label}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {openDropdown === 'status' && (
              <div className="absolute left-0 sm:right-0 top-full mt-2 rounded-xl shadow-2xl z-20"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: '200px', padding: '8px' }}>
                {['all', ...Object.keys(STATUS_CONFIG)].map((s, idx) => {
                  const count = s === 'all' 
                    ? filtered.length 
                    : mockTasks.filter(t => t.status === s).length;
                  return (
                    <button key={s} onClick={() => { setStatusFilter(s as TaskStatus | 'all'); setOpenDropdown(null); }}
                      className="w-full flex items-center justify-between text-left font-medium hover:bg-gray-100 rounded-lg transition-colors"
                      style={{ color: 'var(--text)', padding: '8px 12px', marginBottom: idx === 4 ? 0 : '8px', fontSize: '14px' }}>
                      <span>{s === 'all' ? 'All Statuses' : STATUS_CONFIG[s as TaskStatus].label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Priority Dropdown */}
          <div className="relative" ref={priorityRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
              className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <Filter size={16} className="text-gray-400" />
              <span>{priorityFilter === 'all' ? 'Priority' : PRIORITY_CONFIG[priorityFilter].label}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {openDropdown === 'priority' && (
              <div className="absolute right-0 top-full mt-2 rounded-xl shadow-2xl z-20"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: '200px', padding: '8px' }}>
                {['all', ...Object.keys(PRIORITY_CONFIG)].map((p, idx) => {
                  const count = p === 'all'
                    ? filtered.length
                    : mockTasks.filter(t => t.priority === p).length;
                  return (
                    <button key={p} onClick={() => { setPriorityFilter(p as TaskPriority | 'all'); setOpenDropdown(null); }}
                      className="w-full flex items-center justify-between text-left font-medium hover:bg-gray-100 rounded-lg transition-colors"
                      style={{ color: 'var(--text)', padding: '8px 12px', marginBottom: idx === 4 ? 0 : '8px', fontSize: '14px' }}>
                      <span className="flex items-center gap-2">
                        {p !== 'all' && <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p as TaskPriority].dot}`} />}
                        {p === 'all' ? 'All Priorities' : PRIORITY_CONFIG[p as TaskPriority].label}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Table — Desktop */}
      <div className="hidden md:block rounded-2xl overflow-x-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Task', 'Assignee', 'Status', 'Priority', 'Due Date', 'Logs'].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => {
              const sc = STATUS_CONFIG[task.status];
              const pc = PRIORITY_CONFIG[task.priority];
              return (
                <tr key={task.id}
                  onClick={() => navigate(`/task/${task.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{task.title}</p>
                    <div className="flex gap-1.5 mt-2">
                      {task.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                        style={{ background: 'var(--primary)', color: '#fff' }}>
                        {task.updatedBy.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{task.updatedBy.name.split(' ')[0]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-2 text-xs font-semibold ${pc.color}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${pc.dot}`} />
                      {pc.label}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {task.dueDate || '—'}
                  </td>
                  <td className="px-6 py-5">
                    {task.logCount > 0 ? (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(123,104,238,0.1)', color: 'var(--primary)' }}>
                        {task.logCount}
                      </span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Task Cards — Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((task) => {
          const sc = STATUS_CONFIG[task.status];
          const pc = PRIORITY_CONFIG[task.priority];
          return (
            <div key={task.id}
              onClick={() => navigate(`/task/${task.id}`)}
              className="rounded-2xl p-5 active:scale-[0.99] cursor-pointer transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-[15px] font-semibold leading-snug flex-1" style={{ color: 'var(--text)' }}>{task.title}</p>
                <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold ${sc.bg} ${sc.color}`}>
                  {sc.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                      style={{ background: 'var(--primary)', color: '#fff' }}>
                      {task.updatedBy.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{task.updatedBy.name.split(' ')[0]}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${pc.color}`}>
                    <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                    {pc.label}
                  </div>
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}><Calendar size={12} /> {task.dueDate}</span>
                  )}
                  {task.logCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: 'var(--primary)' }}>
                      <FileText size={12} /> {task.logCount} logs
                    </span>
                  )}
                </div>
                {task.updatedAt && (
                  <span className="shrink-0 flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={12} /> {relativeDate(task.updatedAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
