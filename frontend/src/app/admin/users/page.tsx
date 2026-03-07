'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/services/adminService';
import { User } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { ListSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { Ban, CheckCircle, Users } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        page,
        search: search || undefined,
        role: roleFilter || undefined,
      });
      setUsers(res.data.data?.users || res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1 });
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleBan = async (userId: string) => {
    try {
      await adminService.banUser(userId);
      setUsers(users.map((u) => (u._id === userId ? { ...u, isBanned: !u.isBanned } : u)));
      toast.success('User status updated');
    } catch {
      toast.error('Action failed');
    }
  };

  return (
    <div className="max-w-5xl">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Management</p>
      <h1 className="text-[28px] font-light uppercase tracking-wide mb-8">Users</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['', 'patient', 'pharmacy', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest border transition-colors ${
                roleFilter === role
                  ? 'bg-black text-white border-black'
                  : 'border-neutral-200 text-neutral-500 hover:border-black'
              }`}
            >
              {role || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : users.length === 0 ? (
        <div className="border border-neutral-200 p-16 text-center">
          <Users className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[12px] text-neutral-400">No users found</p>
        </div>
      ) : (
        <div className="border border-neutral-200">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-neutral-200 bg-neutral-50">
            <div className="col-span-3 text-[10px] uppercase tracking-widest text-neutral-400">Name</div>
            <div className="col-span-3 text-[10px] uppercase tracking-widest text-neutral-400">Email</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Role</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Status</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400 text-right">Actions</div>
          </div>
          {users.map((u) => (
            <div key={u._id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-neutral-100 items-center">
              <div className="col-span-3 text-[13px]">{u.name}</div>
              <div className="col-span-3 text-[13px] text-neutral-500 truncate">{u.email}</div>
              <div className="col-span-2">
                <Badge>{u.role}</Badge>
              </div>
              <div className="col-span-2">
                {u.isBanned ? (
                  <Badge variant="danger">Banned</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
              <div className="col-span-2 text-right">
                {u.role !== 'admin' && (
                  <button
                    onClick={() => handleBan(u._id)}
                    className="text-neutral-400 hover:text-black transition-colors"
                    title={u.isBanned ? 'Unban' : 'Ban'}
                  >
                    {u.isBanned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => fetchUsers(i + 1)}
              className={`w-8 h-8 text-[11px] border transition-colors ${
                pagination.page === i + 1
                  ? 'bg-black text-white border-black'
                  : 'border-neutral-200 hover:border-black'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
