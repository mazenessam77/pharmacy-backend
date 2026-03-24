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
import { Building2, Check, X, Trash2 } from 'lucide-react';

export default function AdminPharmaciesPage() {
  const [pending, setPending] = useState<(Pharmacy & { userId: User })[]>([]);
  const [all, setAll] = useState<(Pharmacy & { userId: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAll, setLoadingAll] = useState(true);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPending();
    loadAll();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPendingPharmacies();
      setPending(res.data.data?.pharmacies || res.data.data || []);
    } catch {
      toast.error('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    setLoadingAll(true);
    try {
      const res = await adminService.getAllPharmacies();
      setAll(res.data.data?.pharmacies || res.data.data || []);
    } catch {
      // silent
    } finally {
      setLoadingAll(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await adminService.verifyPharmacy(id, 'approve');
      setPending(pending.filter((p) => p._id !== id));
      loadAll();
      toast.success('Pharmacy approved');
    } catch {
      toast.error('Approval failed');
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    try {
      await adminService.verifyPharmacy(rejectModal, 'reject', rejectReason);
      setPending(pending.filter((p) => p._id !== rejectModal));
      setRejectModal(null);
      setRejectReason('');
      toast.success('Pharmacy rejected');
    } catch {
      toast.error('Rejection failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete pharmacy "${name}"? This cannot be undone.`)) return;
    try {
      await adminService.deletePharmacy(id);
      setPending(pending.filter((p) => p._id !== id));
      setAll(all.filter((p) => p._id !== id));
      toast.success('Pharmacy deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Pending Verification */}
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Verification</p>
      <h1 className="text-[28px] font-light uppercase tracking-wide mb-8">Pending Pharmacies</h1>

      {loading ? (
        <ListSkeleton count={3} />
      ) : pending.length === 0 ? (
        <div className="border border-neutral-200 p-10 text-center mb-12">
          <Building2 className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <p className="text-[12px] text-neutral-400">No pharmacies pending verification</p>
        </div>
      ) : (
        <div className="space-y-4 mb-12">
          {pending.map((pharmacy) => (
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
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Governorate</p>
                  <p className="text-[13px]">{pharmacy.governorate}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-0.5">Hours</p>
                  <p className="text-[13px]">{pharmacy.workingHours?.open} – {pharmacy.workingHours?.close}</p>
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
                <Button variant="outline" size="sm" onClick={() => handleDelete(pharmacy._id, pharmacy.pharmacyName)}>
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Pharmacies */}
      <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">Management</p>
      <h2 className="text-[22px] font-light uppercase tracking-wide mb-6">All Pharmacies</h2>

      {loadingAll ? (
        <ListSkeleton count={4} />
      ) : all.length === 0 ? (
        <div className="border border-neutral-200 p-10 text-center">
          <p className="text-[12px] text-neutral-400">No pharmacies found</p>
        </div>
      ) : (
        <div className="border border-neutral-200">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-neutral-200 bg-neutral-50">
            <div className="col-span-3 text-[10px] uppercase tracking-widest text-neutral-400">Name</div>
            <div className="col-span-3 text-[10px] uppercase tracking-widest text-neutral-400">Owner</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Governorate</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400">Status</div>
            <div className="col-span-2 text-[10px] uppercase tracking-widest text-neutral-400 text-right">Delete</div>
          </div>
          {all.map((pharmacy) => (
            <div key={pharmacy._id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-neutral-100 items-center">
              <div className="col-span-3 text-[13px]">{pharmacy.pharmacyName}</div>
              <div className="col-span-3 text-[12px] text-neutral-500">
                {typeof pharmacy.userId === 'object' ? pharmacy.userId.email : ''}
              </div>
              <div className="col-span-2 text-[12px]">{pharmacy.governorate}</div>
              <div className="col-span-2">
                {pharmacy.isVerified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="warning">Pending</Badge>
                )}
              </div>
              <div className="col-span-2 text-right">
                <button
                  onClick={() => handleDelete(pharmacy._id, pharmacy.pharmacyName)}
                  className="text-neutral-400 hover:text-red-600 transition-colors"
                  title="Delete pharmacy"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
