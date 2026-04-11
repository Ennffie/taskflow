import { useState } from 'react';
import { Search, Filter, Plus, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { TaskStatus, TaskPriority } from '../types';
import {
  mockTasks,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
} from '../types';

export function TaskList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const filtered = mockTasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">All Tasks</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors">
          <Plus size={16} />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/30 focus:border-[var(--color-secondary)]"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowPriorityDropdown(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-sm hover:bg-gray-50"
          >
            <Filter size={14} />
            {statusFilter === 'all' ? 'Status' : STATUS_CONFIG[statusFilter].label}
            <ChevronDown size={14} />
          </button>
          {showStatusDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-10 min-w-[140px] py-1">
              <button onClick={() => { setStatusFilter('all'); setShowStatusDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">All</button>
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowPriorityDropdown(!showPriorityDropdown); setShowStatusDropdown(false); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[var(--color-border)] rounded-lg text-sm hover:bg-gray-50"
          >
            <Filter size={14} />
            {priorityFilter === 'all' ? 'Priority' : PRIORITY_CONFIG[priorityFilter].label}
            <ChevronDown size={14} />
          </button>
          {showPriorityDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg z-10 min-w-[140px] py-1">
              <button onClick={() => { setPriorityFilter('all'); setShowPriorityDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">All</button>
              {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                <button key={p} onClick={() => { setPriorityFilter(p); setShowPriorityDropdown(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Task</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Assignee</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Priority</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Due Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Logs</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((task) => {
              const sc = STATUS_CONFIG[task.status];
              const pc = PRIORITY_CONFIG[task.priority];
              return (
                <tr
                  key={task.id}
                  onClick={() => navigate(`/task/${task.id}`)}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-gray-50/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex gap-1 mt-1">
                      {task.tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-gray-100 text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-white text-xs font-medium">
                        {task.assignee.name.charAt(0)}
                      </div>
                      <span className="text-sm">{task.assignee.name.split(' ')[0]}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${pc.color}`}>
                      <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                      {pc.label}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    {task.dueDate || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                    {task.logCount > 0 ? (
                      <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-full text-xs font-medium">
                        {task.logCount}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Task Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filtered.map((task) => {
          const sc = STATUS_CONFIG[task.status];
          const pc = PRIORITY_CONFIG[task.priority];
          return (
            <div
              key={task.id}
              onClick={() => navigate(`/task/${task.id}`)}
              className="bg-white rounded-xl border border-[var(--color-border)] p-4 active:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-white text-[10px] font-medium">
                      {task.assignee.name.charAt(0)}
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)]">{task.assignee.name.split(' ')[0]}</span>
                  </div>
                </div>
                <span className={`shrink-0 inline-flex px-2 py-1 rounded-full text-[10px] font-medium ${sc.bg} ${sc.color}`}>
                  {sc.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
                <div className={`flex items-center gap-1 text-[10px] font-medium ${pc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                  {pc.label}
                </div>
                {task.dueDate && (
                  <span className="text-[10px] text-[var(--color-text-secondary)]">📅 {task.dueDate}</span>
                )}
                {task.logCount > 0 && (
                  <span className="text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-1.5 py-0.5 rounded-full font-medium">
                    {task.logCount} logs
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
