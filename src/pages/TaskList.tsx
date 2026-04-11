import { useState } from 'react';
import { Search, Filter, Plus, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TaskStatus, TaskPriority } from '../types';
import { mockTasks, STATUS_CONFIG, PRIORITY_CONFIG } from '../types';

export function TaskList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [openDropdown, setOpenDropdown] = useState<'status' | 'priority' | null>(null);

  const filtered = mockTasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="pb-24 lg:pb-0">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text)' }}>All Tasks</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="flex items-center gap-2 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
          style={{ background: 'var(--primary)' }}>
          <Plus size={18} strokeWidth={2.5} />
          <span>New Task</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div className="flex gap-2">
          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <Filter size={14} />
              {statusFilter === 'all' ? 'Status' : STATUS_CONFIG[statusFilter].label}
              <ChevronDown size={14} />
            </button>
            {openDropdown === 'status' && (
              <div className="absolute right-0 top-full mt-2 rounded-xl shadow-xl z-20 min-w-[160px] py-2 overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {['all', ...Object.keys(STATUS_CONFIG)].map((s) => (
                  <button key={s} onClick={() => { setStatusFilter(s as TaskStatus | 'all'); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: 'var(--text)' }}>
                    {s === 'all' ? 'All Statuses' : STATUS_CONFIG[s as TaskStatus].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority Dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'priority' ? null : 'priority')}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              <Filter size={14} />
              {priorityFilter === 'all' ? 'Priority' : PRIORITY_CONFIG[priorityFilter].label}
              <ChevronDown size={14} />
            </button>
            {openDropdown === 'priority' && (
              <div className="absolute right-0 top-full mt-2 rounded-xl shadow-xl z-20 min-w-[160px] py-2 overflow-hidden"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                {['all', ...Object.keys(PRIORITY_CONFIG)].map((p) => (
                  <button key={p} onClick={() => { setPriorityFilter(p as TaskPriority | 'all'); setOpenDropdown(null); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--text)' }}>
                    {p !== 'all' && <span className={`w-2.5 h-2.5 rounded-full ${PRIORITY_CONFIG[p as TaskPriority].dot}`} />}
                    {p === 'all' ? 'All Priorities' : PRIORITY_CONFIG[p as TaskPriority].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Table — Desktop */}
      <div className="hidden md:block rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
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
                        {task.assignee.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{task.assignee.name.split(' ')[0]}</span>
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
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
                  style={{ background: 'var(--primary)', color: '#fff' }}>
                  {task.assignee.name.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{task.assignee.name.split(' ')[0]}</span>
              </div>
              <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${pc.color}`}>
                  <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                  {pc.label}
                </div>
                {task.dueDate && (
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>📅 {task.dueDate}</span>
                )}
                {task.logCount > 0 && (
                  <span className="text-[11px] font-bold" style={{ color: 'var(--primary)' }}>
                    📝 {task.logCount} logs
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
