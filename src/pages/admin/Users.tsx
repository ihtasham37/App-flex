import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Search, User, Mail, Calendar, Shield, Power, Ban, CheckCircle2, MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    // Load max 100 users once to prevent massive read costs
    import('firebase/firestore').then(({ getDocs, limit, query, collection, orderBy }) => {
      const q = query(collection(db, 'users'), limit(100)); // optionally orderBy('createdAt', 'desc') if index exists
      getDocs(q).then((snap) => {
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }).catch((error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      });
    });
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
    const actionText = newStatus === 'banned' ? 'BAN (Turn OFF)' : 'ACTIVATE (Turn ON)';
    
    if (window.confirm(`Are you sure you want to ${actionText} this user account?`)) {
      setUpdatingId(userId);
      setOpenMenuId(null);
      try {
        await updateDoc(doc(db, 'users', userId), {
          status: newStatus,
          updatedAt: new Date()
        });
      } catch (error) {
        console.error("Error updating user status:", error);
      } finally {
        setUpdatingId(null);
      }
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? 'Promote to ADMIN' : 'Demote to USER';
    
    if (window.confirm(`Are you sure you want to ${actionText}?`)) {
      setUpdatingId(userId);
      setOpenMenuId(null);
      try {
        await updateDoc(doc(db, 'users', userId), {
          role: newRole,
          updatedAt: new Date()
        });
      } catch (error) {
        console.error("Error updating user role:", error);
      } finally {
        setUpdatingId(null);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900">User Account Management</h1>
        <p className="text-xs text-slate-500 font-medium">
          Manage user permissions and account status securely.
        </p>
      </div>

      <GlassCard className="p-6 bg-white border border-slate-200 shadow-xs" hover={false}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <Input 
            placeholder="Search users by email or name..."
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border-slate-200 rounded-xl max-w-md w-full"
          />
          <div className="text-xs font-bold text-slate-500">
            Total Users: <span className="text-slate-900 font-black">{users.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center font-bold animate-pulse text-slate-400 text-xs">
            Fetching real-time user database...
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const isBanned = user.status === 'banned';
                  const isAdminRole = user.role === 'admin';
                  const isUpdating = updatingId === user.id;
                  const isMenuOpen = openMenuId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Name & Icon */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 font-bold text-xs">
                            {user.name ? user.name[0].toUpperCase() : <User size={16} />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{user.name || 'User'}</span>
                            <span className="text-[10px] text-slate-400 font-medium">UID: {user.id?.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-xs text-slate-700 font-bold">
                        {user.email || 'No email'}
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                          isAdminRole ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {user.role || 'user'}
                        </span>
                      </td>

                      {/* Status Indicator */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={cn("w-2 h-2 rounded-full", isBanned ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
                          <span className={cn(
                            "text-xs font-bold capitalize",
                            isBanned ? "text-red-600 font-black" : "text-emerald-600 font-bold"
                          )}>
                            {isBanned ? 'Disabled / Banned' : 'Active (ON)'}
                          </span>
                        </div>
                      </td>

                      {/* Actions column with 3-dot menu */}
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : user.id);
                            }}
                            disabled={isUpdating}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl border border-slate-100 z-50 py-1 overflow-hidden">
                              {/* Change Role */}
                              <button
                                onClick={() => handleToggleRole(user.id, user.role)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Shield size={14} className={isAdminRole ? "text-slate-400" : "text-purple-600"} />
                                {isAdminRole ? 'Make Regular User' : 'Make Admin'}
                              </button>

                              {/* Toggle Status */}
                              <button
                                onClick={() => handleToggleStatus(user.id, user.status)}
                                disabled={isAdminRole}
                                className={cn(
                                  "w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold transition-colors",
                                  isAdminRole ? "text-slate-300 cursor-not-allowed" : "text-slate-700 hover:bg-slate-50"
                                )}
                              >
                                <Power size={14} className={isBanned ? "text-emerald-600" : "text-red-600"} />
                                {isBanned ? 'Activate Account (ON)' : 'Deactivate Account (OFF)'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">
                No users found.
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
