import { useEffect, useState } from 'react';
import { Clock, Calendar, ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CAT } from '../types';
import { supabase } from '../lib/supabase';
import { fetchTasks } from '../lib/api';
import type { TaskWithData } from '../lib/api';

interface LogEntry {
  id: string;
  task_id: string;
  date: string;
  event: string;
  category: 'design' | 'research' | 'meeting' | 'review' | 'other';
  time_spent: string | null;
  file_name: string | null;
  created_by: string;
  created_by_profile?: { id: string; name: string; initials?: string };
}

interface LogWithTask extends LogEntry {
  task?: TaskWithData;
}

export function MyLog() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [logs, setLogs] = useState<LogWithTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch tasks first
      const taskList = await fetchTasks();
      const tMap = Object.fromEntries(taskList.map(t => [t.id, t]));

      // Fetch all log entries with details
      const { data: logsData, error } = await supabase
        .from('log_entries')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('fetch logs:', error);
        setLoading(false);
        return;
      }

      // Fetch profiles for created_by
      const { data: profilesData } = await supabase.from('profiles').select('*');
      const profileMap = new Map((profilesData || []).map((p: any) => [p.id, {...p, initials: p.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}]));

      // Filter by current user and attach task + profile
      const allLogs = (logsData || []).map((log: any) => ({
        ...log,
        created_by_profile: profileMap.get(log.created_by),
        task: tMap[log.task_id],
      })) as LogWithTask[];

      const myLogs = allLogs.filter(log => log.created_by === profile?.id);
      setLogs(myLogs);
      setLoading(false);
    }
    if (profile) load();
  }, [profile]);

  function groupedLogs() {
    const groups: Record<string, LogWithTask[]> = {};
    logs.forEach(log => {
      const date = log.date || 'Unknown';
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }

  const grouped = groupedLogs();
  const dates = Object.keys(grouped).sort().reverse();

  return (
    <div className="min-h-screen pb-32" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-5 md:px-6 py-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>My Log</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8" style={{ paddingLeft: '24px', paddingRight: '24px' }}>
        {loading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No log entries yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {dates.map(date => (
              <div key={date}>
                <div className="flex items-center gap-4 mb-4">
                  <Calendar size={18} style={{ color: 'var(--primary)' }} />
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{date}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', background: 'var(--bg)' }}>{grouped[date].length} entries</span>
                </div>
                <div className="ml-4 pl-8 space-y-4" style={{ borderLeft: '2px solid var(--border)' }}>
                  {grouped[date].map(entry => {
                    const cat = CAT[entry.category || 'other'];
                    const task = entry.task;
                    const creator = entry.created_by_profile;
                    return (
                      <div
                        key={entry.id}
                        className="rounded-xl p-5 cursor-pointer transition-colors hover:opacity-90"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        onClick={() => task && navigate(`/task/${task.id}`)}
                      >
                        {/* Header: Category + Task + Time */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                            {task && (
                              <span className="text-xs truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>in {task.title}</span>
                            )}
                          </div>
                          {entry.time_spent && (
                            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                              <Clock size={12} /> {entry.time_spent}
                            </span>
                          )}
                        </div>
                        
                        {/* Event Content */}
                        <div className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
                          {entry.event.split('\n').map((line: string, i: number) => {
                            if (line.startsWith('[Status:') && line.endsWith(']')) {
                              return <div key={i} className="font-medium mb-1" style={{ color: 'var(--primary)', fontSize: 13 }}>{line.slice(1, -1)}</div>;
                            }
                            return <p key={i}>{line}</p>;
                          })}
                        </div>
                        
                        {/* Footer: File + User (bottom) */}
                        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          {entry.file_name ? (
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                              <FileText size={12} /> {entry.file_name}
                            </div>
                          ) : (
                            <div />
                          )}
                          {creator && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                                {creator.initials}
                              </div>
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{creator.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
