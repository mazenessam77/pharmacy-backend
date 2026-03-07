'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrderStore } from '@/store/orderStore';
import ChatWindow from '@/components/shared/ChatWindow';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ArrowLeft } from 'lucide-react';
import { Pharmacy, User } from '@/types';

export default function PatientChatPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentOrder, fetchOrder, isLoading } = useOrderStore();

  useEffect(() => {
    if (orderId) fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  if (isLoading || !currentOrder) {
    return <div className="max-w-3xl"><CardSkeleton /></div>;
  }

  const pharmacy = currentOrder.acceptedPharmacy as Pharmacy | undefined;
  const pharmacyUserId = typeof pharmacy?.userId === 'object'
    ? (pharmacy.userId as User)._id
    : pharmacy?.userId;

  if (!pharmacyUserId) {
    return (
      <div className="max-w-3xl text-center py-16">
        <p className="text-[12px] text-neutral-400">No pharmacy assigned to this order yet</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/patient/chat"
        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </Link>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">
          Order #{currentOrder._id.slice(-8)}
        </p>
        <h1 className="text-[22px] font-light uppercase tracking-wide">
          {pharmacy?.pharmacyName || 'Pharmacy'}
        </h1>
      </div>
      <ChatWindow orderId={orderId} recipientId={pharmacyUserId} />
    </div>
  );
}
