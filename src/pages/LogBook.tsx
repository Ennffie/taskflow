import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Paperclip,
  Clock,
  Calendar,
  FileText,
  ChevronDown,
} from 'lucide-react';
import type { LogEntry } from '../types';
import {
  mockTasks,
  mockLogEntries,
  STATUS_CONFIG,
  CURRENT_USER,
} from '../types';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  design: { label: 'Design', color: 'text-purple-600', bg: 'bg-purple-100', icon: '🎨' },
  research: { label: 'Research', color: 'text-blue-600', bg: 'bg-blue-100', icon: '🔍' },
  meeting: { label: 'Meeting', color: 'text-green-600', bg: 'bg-green-100', icon: '🤝' },
  review: { label: 'Review', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: '👀' },
  other: { label: 'Other', color: 'text-gray-600', bg: 'bg-gray-100', icon: '📝' },
};

export function LogBook() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const task = mockTasks.find((t) => t.id === taskId);
  const entries = taskId ? (mockLogEntries[taskId] || []) : [];

  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    event: '',
    category: 'design' as string,
    timeSpent: '',
    fileName: '',
  });

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--color-text-secondary)]">Task not found</p>
      </div>
    );
  }

  const sc = STATUS_CONFIG[task.status];

  // Group entries by date
  const grouped = entries.reduce<Record<string, LogEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const handleSubmit = () => {
    if (!newEntry.event.trim()) return;
    // In real app, this would call an API
    alert(`Log entry saved!\n\nDate: ${newEntry.date}\nEvent: ${newEntry.event}\nCategory: ${newEntry.category}${newEntry.fileName ? `\nFile: ${newEntry.fileName}` : ''}`);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      event: '',
      category: 'design',
      timeSpent: '',
      fileName: '',
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-0">
      {/* Back Button + Task Header */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-3"
        >
          <ArrowLeft size={16} />
          Back to Tasks
        </button>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-bold">{task.title}</h2>
              {task.description && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{task.description}</p>
              )}
            </div>
            <span className={`shrink-0 inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
              {sc.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-white text-xs font-medium">
                {task.assignee.name.charAt(0)}
              </div>
              <span className="text-sm">{task.assignee.name}</span>
            </div>
            {task.dueDate && (
              <span className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                <Calendar size={14} />
                Due: {task.dueDate}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
              <FileText size={14} />
              {entries.length} log entr{entries.length !== 1 ? 'ies' : 'y'}
            </span>
          </div>
        </div>
      </div>

      {/* Add New Entry Form */}
      {showForm ? (
        <div className="bg-white rounded-xl border-2 border-[var(--color-secondary)] p-4 md:p-6">
          <h3 className="text-sm font-semibold mb-4">New Log Entry</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Date</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/30"
                />
              </div>
              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Category</label>
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/30 bg-white"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Event */}
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Event / Description</label>
              <textarea
                value={newEntry.event}
                onChange={(e) => setNewEntry({ ...newEntry, event: e.target.value })}
                placeholder="What did you do today?"
                rows={3}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* File */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">File Attachment</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] cursor-pointer hover:bg-gray-50 flex-1">
                    <Paperclip size={14} />
                    <span className="truncate">{newEntry.fileName || 'Choose file...'}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setNewEntry({ ...newEntry, fileName: f.name });
                      }}
                    />
                  </label>
                </div>
              </div>
              {/* Time Spent */}
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Time Spent</label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
                  <input
                    type="text"
                    value={newEntry.timeSpent}
                    onChange={(e) => setNewEntry({ ...newEntry, timeSpent: e.target.value })}
                    placeholder="e.g. 02:30"
                    className="w-full pl-9 pr-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-light)]"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Timeline */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Log Book Timeline
          </h3>
          <span className="text-xs text-[var(--color-text-secondary)]">{entries.length} entries</span>
        </div>

        {sortedDates.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-[var(--color-text-secondary)]">No log entries yet.</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Click the + button to add your first entry.</p>
          </div>
        ) : (
          sortedDates.map((date) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                <h4 className="text-sm font-semibold">{date}</h4>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  ({grouped[date].length} entr{grouped[date].length !== 1 ? 'ies' : 'y'})
                </span>
              </div>

              {/* Entries */}
              <div className="ml-1 border-l-2 border-[var(--color-border)] pl-6 space-y-3">
                {grouped[date].map((entry) => {
                  const cat = CATEGORY_CONFIG[entry.category || 'other'];
                  return (
                    <div key={entry.id} className="relative bg-white rounded-xl border border-[var(--color-border)] p-4">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-4 w-3 h-3 rounded-full bg-[var(--color-secondary)] border-2 border-white" />

                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.bg} ${cat.color}`}>
                              {cat.icon} {cat.label}
                            </span>
                            {entry.timeSpent && (
                              <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
                                <Clock size={10} /> {entry.timeSpent}
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed">{entry.event}</p>
                          {entry.fileName && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--color-secondary)]">
                              <Paperclip size={12} />
                              <span className="underline">{entry.fileName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--color-border)]">
                        <div className="w-5 h-5 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-white text-[8px] font-medium">
                          {entry.createdBy.name.charAt(0)}
                        </div>
                        <span className="text-[10px] text-[var(--color-text-secondary)]">
                          {entry.createdBy.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB - Mobile (Add Entry) */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[var(--color-primary)] text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-[var(--color-primary-light)]"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
