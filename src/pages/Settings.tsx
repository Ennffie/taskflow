import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, ChevronDown, ChevronUp, Check, UserCog, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  initials: string;
}

interface UserPermission {
  permission_key: string;
  granted: boolean;
}

const ALL_PERMISSIONS = [
  { key: 'create_task', label: 'Create Task', default: { admin: true, member: false, viewer: false } },
  { key: 'edit_any_task', label: 'Edit Any Task', default: { admin: true, member: false, viewer: false } },
  { key: 'edit_assigned_task', label: 'Edit Assigned Task', default: { admin: true, member: true, viewer: false } },
  { key: 'delete_task', label: 'Delete Task', default: { admin: true, member: false, viewer: false } },
  { key: 'create_log', label: 'Create Log Entry', default: { admin: true, member: true, viewer: false } },
  { key: 'edit_own_log', label: 'Edit Own Log', default: { admin: true, member: true, viewer: false } },
  { key: 'delete_own_log', label: 'Delete Own Log', default: { admin: true, member: true, viewer: false } },
  { key: 'assign_members', label: 'Assign Members', default: { admin: true, member: true, viewer: false } },
  { key: 'view_audit_log', label: 'View Audit Log', default: { admin: true, member: false, viewer: false } },
  { key: 'manage_users', label: 'Manage Users', default: { admin: true, member: false, viewer: false } },
];

export default function Settings() {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, UserPermission[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .order('role')
      .order('name');
    
    if (data) {
      setUsers(data.map((u: any) => ({
        ...u,
        initials: u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      })));
    }
    setLoading(false);
  }

  async function fetchUserPermissions(userId: string) {
    const { data } = await supabase
      .from('user_permissions')
      .select('permission_key, granted')
      .eq('user_id', userId);
    
    if (data) {
      setUserPermissions(prev => ({ ...prev, [userId]: data }));
    }
  }

  async function updateUserRole(userId: string, newRole: 'admin' | 'member' | 'viewer') {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setMessage('Role updated');
      setTimeout(() => setMessage(''), 2000);
    }
    setSaving(false);
  }

  async function togglePermission(userId: string, permissionKey: string, currentValue: boolean | undefined) {
    setSaving(true);
    const newValue = currentValue === undefined ? true : !currentValue;
    
    const { error } = await supabase
      .from('user_permissions')
      .upsert({
        user_id: userId,
        permission_key: permissionKey,
        granted: newValue,
        set_by: profile?.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,permission_key' });
    
    if (!error) {
      await fetchUserPermissions(userId);
      setMessage('Permission updated');
      setTimeout(() => setMessage(''), 2000);
    }
    setSaving(false);
  }

  async function deleteUser(userId: string) {
    setSaving(true);
    
    try {
      // Step 1: Null out FK references in tasks
      await supabase.from('tasks').update({ created_by: null }).eq('created_by', userId);
      await supabase.from('tasks').update({ updated_by: null }).eq('updated_by', userId);
      
      // Step 2: Remove from task_assignees
      await supabase.from('task_assignees').delete().eq('user_id', userId);
      
      // Step 3: Remove permissions
      await supabase.from('user_permissions').delete().eq('user_id', userId);
      
      // Step 4: Transfer log entries to admin (or null if not allowed)
      await supabase.from('log_entries').update({ created_by: profile?.id || null }).eq('created_by', userId);
      
      // Step 5: Delete profile
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      
      if (error) {
        alert('Delete failed: ' + error.message);
        setSaving(false);
        return;
      }
      
      // Update UI
      setUsers(users.filter(u => u.id !== userId));
      setMessage('User deleted');
      setTimeout(() => setMessage(''), 2000);
      
    } catch (e: any) {
      alert('Delete error: ' + e.message);
    }
    
    setSaving(false);
  }

  function getEffectivePermission(user: Profile, permKey: string): boolean {
    const override = userPermissions[user.id]?.find(p => p.permission_key === permKey);
    if (override !== undefined) return override.granted;
    
    const permDef = ALL_PERMISSIONS.find(p => p.key === permKey);
    return permDef?.default[user.role] ?? false;
  }

  function getPermissionStatus(user: Profile, permKey: string): 'default' | 'overridden' {
    const override = userPermissions[user.id]?.find(p => p.permission_key === permKey);
    return override !== undefined ? 'overridden' : 'default';
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--bg)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Shield size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>Admin Only</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Only administrators can access settings.</p>
            <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium" style={{ color: 'var(--primary)' }}>Back to Tasks</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-4 md:px-6 py-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} style={{ color: 'var(--text-muted)' }} />
            </button>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
          </div>
          {message && (
            <span className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>{message}</span>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 space-y-6" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
        {/* User Management Section */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <UserCog size={20} style={{ color: 'var(--primary)' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>User Management</h2>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Manage roles and permissions for team members</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading users...</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {users.map(user => (
                <div key={user.id} className="px-6 py-4">
                  {/* User Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold" style={{ background: 'var(--primary)', color: '#fff' }}>
                        {user.initials}
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{user.name}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Role Badge */}
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                        disabled={user.id === profile?.id || saving}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border focus:outline-none disabled:opacity-50"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      
                      {/* Expand Button */}
                      <button
                        onClick={() => {
                          if (expandedUser === user.id) {
                            setExpandedUser(null);
                          } else {
                            setExpandedUser(user.id);
                            fetchUserPermissions(user.id);
                          }
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {expandedUser === user.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {/* Delete Button */}
                      {user.id !== profile?.id && (
                        <button
                          onClick={() => { setDeleteTarget(user); }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          style={{ color: '#ef4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permissions Panel */}
                  {expandedUser === user.id && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>
                        Individual Permission Overrides
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALL_PERMISSIONS.map(perm => {
                          const effective = getEffectivePermission(user, perm.key);
                          const status = getPermissionStatus(user, perm.key);
                          return (
                            <button
                              key={perm.key}
                              onClick={() => togglePermission(user.id, perm.key, effective)}
                              disabled={saving || user.role === 'admin'}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                                user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                              } ${status === 'overridden' ? 'border' : ''}`}
                              style={{ 
                                borderColor: status === 'overridden' ? 'var(--primary)' : 'var(--border)',
                                background: status === 'overridden' ? 'rgba(123,104,238,0.05)' : 'var(--bg)'
                              }}
                            >
                              <span style={{ color: effective ? 'var(--text)' : 'var(--text-muted)' }}>{perm.label}</span>
                              <div className="flex items-center gap-2">
                                {status === 'overridden' && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'var(--primary)', color: '#fff' }}>Override</span>
                                )}
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                  effective ? 'text-white' : ''
                                }`} style={{ background: effective ? 'var(--primary)' : 'var(--bg-secondary)' }}>
                                  {effective && <Check size={12} />}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                        Gray = inherited from role • Purple badge = custom override
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log Section Preview */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              <Shield size={20} style={{ color: 'var(--primary)' }} />
              <div className="flex-1">
                <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Audit Log</h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Track all actions in the system</p>
              </div>
              <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--bg)', color: 'var(--primary)', border: '1px solid var(--border)' }}>
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete User Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="w-full max-w-sm rounded-2xl" style={{ background: 'var(--surface)', padding: '32px 28px' }} onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
                <Trash2 size={22} style={{ color: '#ef4444' }} />
              </div>
              <h4 className="text-base font-bold mb-2" style={{ color: 'var(--text)' }}>Delete User</h4>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Are you sure you want to remove <strong>{deleteTarget.name}</strong>? Their previous records will remain in the system.
              </p>
              <div className="flex w-full gap-3">
                <button onClick={() => setDeleteTarget(null)} 
                  className="flex-1 rounded-xl text-sm font-medium" 
                  style={{ padding: '12px 0', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                <button onClick={async () => {
                  await deleteUser(deleteTarget.id);
                  setDeleteTarget(null);
                }} 
                  className="flex-1 rounded-xl text-sm font-medium text-white"
                  style={{ padding: '12px 0', background: '#ef4444' }}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
