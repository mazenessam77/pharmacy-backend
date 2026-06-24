'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/lib/services/userService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function PatientProfilePage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userService.updateProfile({ name, phone, address });
      setUser(res.data.data?.user || res.data.data);
      toast.success('Profile updated');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'P';

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mb-1">Account</p>
        <h1 className="text-2xl font-black text-neutral-900">My Profile</h1>
      </div>

      {/* Avatar banner */}
      <div className="relative overflow-hidden rounded-[20px] p-6 mb-6 text-white flex items-center gap-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-[0_24px_60px_-25px_rgba(79,70,229,0.55)]">
        <div className="absolute inset-0 opacity-25 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.5) 0%, transparent 45%)' }} />
        <div className="relative w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 backdrop-blur-sm">
          {initials}
        </div>
        <div className="relative">
          <p className="text-lg font-bold">{user?.name || 'Patient'}</p>
          <p className="text-white/75 text-[13px]">{user?.email}</p>
          <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] uppercase tracking-widest font-semibold">
            Patient
          </span>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-[20px] border border-neutral-100 shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={user?.email || ''} disabled className="text-neutral-400" />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20xxxxxxxxxx" />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City" />

          <div className="pt-2">
            <Button type="submit" variant="indigo" isLoading={saving} size="lg" className="w-full">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
