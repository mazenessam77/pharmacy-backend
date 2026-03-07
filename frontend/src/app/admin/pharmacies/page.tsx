'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/lib/services/adminService';
import { Pharmacy, User } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { ListSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { Building2, Check, X } from 'lucide-react';

export default function AdminPharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<(Pharmacy & { userId: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingPharmacies();
      setPharmacies(res.data.data?.pharmacies || res.data.data || []);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminService.verifyPharmacy(id, 'approve');
      setPharmacies(pharmacies.filter((p) => p._id !== id));
      toast.success('Pharmacy approved');
    } catch {
      toast.error('Approval failed');
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await adminService.verifyPharmacy(rejectModal, 'reject', rejectReason);
      setPharmacies(pharmacies.filter((p) => p._id !== rejectModal));
      setRejectModal(null);
      setRejectReason('');
      toast.success('Pharmacy rejected');
    } catch {
      toast.error('Rejection failed');
    }
  };

  return (
    <div className="max-w-4xl">
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Verification</p>
      <h1 className="text-[28px] font-light uppercase tracking-wide mb-8">Pending Pharmacies</h1>

      {loading ? (
        <ListSkeleton count={3} />
      ) : pharmacies.length === 0 ? (
        <div className="border border-neutral-200 p-16 text-center">
          <Building2 className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[12px] text-neutral-400">No pharmacies pending verification</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pharmacies.map((pharmacy) => (
            <div key={pharmacy._id} className="border border-neutral-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[16px] font-medium">{pharmacy.pharmacyName}</p>
                  <p className="text-[12px] text-neutral-500">
                    {typeof pharmacy.userId === 'object' ? pharmacy.userId.email : ''}
                  </p>
                </div>
                <Badge>Pending</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">License</p>
                  <p className="text-[13px]">{pharmacy.license}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Hours</p>
                  <p className="text-[13px]">{pharmacy.workingHours.open} – {pharmacy.workingHours.close}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Location</p>
                  <p className="text-[13px]">
                    {pharmacy.location.coordinates[1].toFixed(4)}, {pharmacy.location.coordinates[0].toFixed(4)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button size="sm" onClick={() => handleApprove(pharmacy._id)}>
                  <Check className="w-3 h-3" />
                  Approve
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRejectModal(pharmacy._id)}>
                  <X className="w-3 h-3" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Pharmacy">
        <div className="space-y-4">
          <Textarea
            label="Reason"
            placeholder="Reason for rejection..."
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button onClick={handleReject} className="flex-1">Confirm Reject</Button>
            <Button variant="outline" onClick={() => setRejectModal(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
