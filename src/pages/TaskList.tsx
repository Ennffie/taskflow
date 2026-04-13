import { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, ChevronDown, Calendar, FileText, Clock, SlidersHorizontal, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TaskStatus, TaskPriority } from '../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../types';
import { fetchTasks, fetchProfiles, fetchAllLogEntries } from '../lib/api';
import type { TaskWithData, Profile } from '../lib/api';
import { NewTaskForm } from '../components/NewTaskForm';

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

function isDueSoon(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  return diff >= 0 && diff <= 3;
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskWithData[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logsByTask, setLogsByTask] = useState<Record<string, { date: string }[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<'status' | 'priority' | 'advanced' | null>(null);
  const [prioritySort, setPrioritySort] = useState<'high-low' | 'low-high' | null>(null);
  const [dateSort, setDateSort] = useState<'earliest' | 'latest' | null>('earliest');
  const [showNewTask, setShowNewTask] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef<HTMLDivElement>(null);

  const loadTasks = async () => {
    const [tasksData, logsData] = await Promise.all([fetchTasks(), fetchAllLogEntries()]);
    setTasks(tasksData);
    // Group logs by task_id with dates
    const grouped: Record<string, { date: string }[]> = {};
    logsData.forEach((log: any) => {
      if (!grouped[log.task_id]) grouped[log.task_id] = [];
      grouped[log.task_id].push({ date: log.date });
    });
    setLogsByTask(grouped);
    setLoading(false);
  };
  useEffect(() => {
    fetchProfiles().then(setProfiles);
    loadTasks();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (openDropdown &&
        statusRef.current && !statusRef.current.contains(e.target as Node) &&
        priorityRef.current && !priorityRef.current.contains(e.target as Node) &&
        advancedRef.current && !advancedRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (memberFilter !== 'all' && !t.assignees.some(a => a.id === memberFilter) && t.updated_by !== memberFilter) return false;
    // Date filter: check if task has log entries on that date
    if (dateFilter) {
      const taskLogs = logsByTask[t.id] || [];
      const hasLogOnDate = taskLogs.some(log => log.date === dateFilter);
      if (!hasLogOnDate) return false;
    }
    return true;
  }).sort((a, b) => {
    if (prioritySort) {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const diff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (prioritySort === 'high-low') return diff;
      if (prioritySort === 'low-high') return -diff;
    }
    if (dateSort && a.due_date && b.due_date) {
      const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (dateSort === 'earliest') return diff;
      if (dateSort === 'latest') return -diff;
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: 'var(--text-secondary)' }}>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '128px' }} className="lg:pb-8">
      {/* Count */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row" style={{ gap: '12px', marginBottom: '24px' }}>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl text-sm outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', height: '40px', padding: '0 44px 0 20px' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        </div>

        <div className="flex flex-1" style={{ gap: '8px' }}>
          {/* Status Dropdown */}
          <div className="relative flex-1" ref={statusRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all text-gray-600"
              style={{ height: '40px', padding: '0 16px', fontSize: '14px' }}
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
                    : tasks.filter(t => t.status === s).length;
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
          <div className="relative flex-1" ref={priorityRef}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl font-medium hover:border-gray-300 hover:bg-gray-50 transition-all text-gray-600"
              style={{ height: '40px', padding: '0 16px', fontSize: '14px' }}
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
                    : tasks.filter(t => t.priority === p).length;
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

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setOpenDropdown(openDropdown === 'advanced' ? null : 'advanced')}
            className="flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all flex-shrink-0"
            style={{ width: '48px', height: '40px', padding: '0' }}>
            <SlidersHorizontal size={20} className={(memberFilter !== 'all' || dateFilter) ? 'text-purple-500' : 'text-gray-400'} />
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {openDropdown === 'advanced' && (
        <div className="rounded-xl shadow-2xl z-20 mb-4" ref={advancedRef}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Advanced Filters</span>
            <button onClick={() => setOpenDropdown(null)} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Member */}
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Member</label>
              <select value={memberFilter} 
                onChange={(e) => setMemberFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-medium bg-white focus:outline-none"
                style={{ border: '1px solid var(--border)' }}>
                <option value="all">All Members</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {/* Date */}
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Updated Date</label>
              <div className="flex gap-2">
                <input type="date" value={dateFilter} 
                  onChange={(e) => { e.stopPropagation(); setDateFilter(e.target.value); }}
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown('advanced'); }}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm font-medium bg-white focus:outline-none"
                  style={{ border: '1px solid var(--border)', color: dateFilter ? 'var(--text)' : 'var(--text-muted)' }} />
                {dateFilter && (
                  <button onClick={() => { setDateFilter(''); setOpenDropdown(null); }}
                    className="px-3 py-2.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    style={{ color: 'var(--text-secondary)' }}><X size={14} /> Clear</button>
                )}
              </div>
            </div>
            {(memberFilter !== 'all' || dateFilter) && (
              <div className="flex items-end">
                <button onClick={() => { setMemberFilter('all'); setDateFilter(''); }}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}>Clear</button>
              </div>
            )}
          </div>
          
          {/* Sorting */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>Sort By</span>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Priority</label>
                <select value={prioritySort || ''} onChange={(e) => { setPrioritySort(e.target.value as any || null); setDateSort(null); }}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white" style={{ border: '1px solid var(--border)' }}>
                  <option value="">Default</option>
                  <option value="high-low">High → Low</option>
                  <option value="low-high">Low → High</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Due Date</label>
                <select value={dateSort || ''} onChange={(e) => { setDateSort(e.target.value as any || null); setPrioritySort(null); }}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white" style={{ border: '1px solid var(--border)' }}>
                  <option value="">Default</option>
                  <option value="earliest">Earliest First</option>
                  <option value="latest">Latest First</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {(statusFilter !== 'all' || priorityFilter !== 'all' || memberFilter !== 'all' || dateFilter) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Filters:</span>
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full font-medium" style={{ padding: '6px 12px', fontSize: '13px', background: STATUS_CONFIG[statusFilter].bg, color: STATUS_CONFIG[statusFilter].color }}>
              {STATUS_CONFIG[statusFilter].label}
              <button onClick={() => setStatusFilter('all')}><X size={14} /></button>
            </span>
          )}
          {priorityFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full font-medium" style={{ padding: '6px 12px', fontSize: '13px', background: 'rgba(123,104,238,0.1)', color: 'var(--primary)' }}>
              {PRIORITY_CONFIG[priorityFilter].label}
              <button onClick={() => setPriorityFilter('all')}><X size={14} /></button>
            </span>
          )}
          {memberFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 rounded-full font-medium" style={{ padding: '6px 12px', fontSize: '13px', background: 'rgba(123,104,238,0.1)', color: 'var(--primary)' }}>
              {profiles.find(p => p.id === memberFilter)?.name?.split(' ')[0]}
              <button onClick={() => setMemberFilter('all')}><X size={14} /></button>
            </span>
          )}
          {dateFilter && (
            <span className="inline-flex items-center gap-1.5 rounded-full font-medium" style={{ padding: '6px 12px', fontSize: '13px', background: 'rgba(123,104,238,0.1)', color: 'var(--primary)' }}>
              {dateFilter}
              <button onClick={() => setDateFilter('')}><X size={14} /></button>
            </span>
          )}
          <button onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setMemberFilter('all'); setDateFilter(''); }}
            className="font-medium" style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '4px 8px' }}>Clear all</button>
        </div>
      )}

      {/* Task Table — Desktop */}
      <div className="hidden md:block rounded-2xl overflow-x-auto" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Task', 'Assignee', 'Status', 'Priority', 'Due Date', 'Logs'].map((h) => (
                <th key={h} className="text-left text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)', padding: '16px 24px' }}>
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
                  <td style={{ padding: "20px 24px" }}>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{task.title}</p>
                    <div className="flex gap-1.5 mt-2">
                      {task.tags_list.map((tag) => (
                        <span key={tag} className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                          style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px" }}>
                    <div className="flex items-center gap-2">
                      {task.assignees.length > 0 ? (
                        <>
                          {task.assignees.map((a) => (
                            <div key={a.id} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                              style={{ background: 'var(--primary)', color: '#fff' }}>
                              {a.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          ))}
                          {task.assignees.length === 1 && (
                            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{task.assignees[0].name.split(' ')[0]}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "20px 24px" }}>
                    <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>
                  </td>
                  <td style={{ padding: "20px 24px" }}>
                    <div className={`flex items-center gap-2 text-xs font-semibold ${pc.color}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${pc.dot}`} />
                      {pc.label}
                    </div>
                  </td>
                  <td className="text-sm" style={{ padding: '20px 24px', color: isOverdue(task.due_date) ? '#ef4444' : isDueSoon(task.due_date) ? '#f97316' : 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1.5">
                      {isDueSoon(task.due_date) && !isOverdue(task.due_date) && (
                        <span className="w-2 h-2 rounded-full" style={{ background: '#f97316' }} />
                      )}
                      {isOverdue(task.due_date) && (
                        <span className="w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
                      )}
                      {task.due_date || '—'}
                    </span>
                  </td>
                  <td style={{ padding: "20px 24px" }}>
                    {task.log_count > 0 ? (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(123,104,238,0.1)', color: 'var(--primary)' }}>
                        {task.log_count}
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
                    {task.assignees.map((a) => (
                      <div key={a.id} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                        style={{ background: 'var(--primary)', color: '#fff' }}>
                        {a.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    ))}
                    {task.assignees.length === 1 && (
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{task.assignees[0].name.split(' ')[0]}</span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${pc.color}`}>
                    <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                    {pc.label}
                  </div>
                  {task.due_date && (
                    <span className="flex items-center gap-1 text-[11px]" 
                      style={{ color: isOverdue(task.due_date) ? '#ef4444' : isDueSoon(task.due_date) ? '#f97316' : 'var(--text-muted)' }}>
                      <Calendar size={12} />
                      {isDueSoon(task.due_date) && !isOverdue(task.due_date) && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f97316' }} />}
                      {isOverdue(task.due_date) && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444' }} />}
                      {task.due_date}
                    </span>
                  )}
                  {task.log_count > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: 'var(--primary)' }}>
                      <FileText size={12} /> {task.log_count} logs
                    </span>
                  )}
                </div>
                {task.updated_at && (
                  <span className="shrink-0 flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={12} /> {relativeDate(task.updated_at)}
                  </span>
                )}
              </div>
              {task.tags_list.length > 0 && (
                <div className="flex gap-1.5">
                  {task.tags_list.map((tag) => (
                    <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button onClick={() => setShowNewTask(true)}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center z-40 active:scale-95 transition-transform"
        style={{ background: 'var(--primary)' }}>
        <Plus size={24} />
      </button>

      {/* New Task Modal */}
      {showNewTask && (
        <NewTaskForm onClose={() => setShowNewTask(false)} onCreated={() => { setShowNewTask(false); loadTasks(); }} />
      )}
    </div>
  );
}
