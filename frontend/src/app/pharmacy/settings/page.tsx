'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { userService } from '@/lib/services/userService';
import { pharmacyService } from '@/lib/services/pharmacyService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Pharmacy } from '@/types';

export default function PharmacySettingsPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await userService.getProfile();
        const data = res.data.data;
        if (data.pharmacy) setPharmacy(data.pharmacy);
      } catch {
        // silent
      }
    };
    loadProfile();
  }, []);

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
      <h1 className="text-[28px] font-light uppercase tracking-wide mb-10">Pharmacy Profile</h1>

      {/* Pharmacy Info (Read Only) */}
      {pharmacy && (
        <div className="border border-neutral-200 p-6 mb-8 space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">Pharmacy Details</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Name</p>
              <p className="text-[14px]">{pharmacy.pharmacyName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">License</p>
              <p className="text-[14px]">{pharmacy.license}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Rating</p>
              <p className="text-[14px]">{pharmacy.rating?.toFixed(1)} ({pharmacy.totalReviews} reviews)</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Status</p>
              <p className="text-[14px]">{pharmacy.isVerified ? 'Verified' : 'Pending Verification'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Hours</p>
              <p className="text-[14px]">{pharmacy.workingHours.open} – {pharmacy.workingHours.close}</p>
            </div>
          </div>
        </div>
      )}

      {/* Editable Profile */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Contact Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" value={user?.email || ''} disabled className="text-neutral-400" />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

        <div className="pt-4">
          <Button type="submit" isLoading={saving} size="lg">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
