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

  return (
    <div className="max-w-lg">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Settings</p>
      <h1 className="text-[28px] font-light uppercase tracking-wide mb-10">Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" value={user?.email || ''} disabled className="text-neutral-400" />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20xxxxxxxxxx" />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City" />

        <div className="pt-4">
          <Button type="submit" isLoading={saving} size="lg">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
