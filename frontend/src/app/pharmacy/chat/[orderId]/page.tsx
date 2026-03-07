'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import ChatWindow from '@/components/shared/ChatWindow';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ArrowLeft } from 'lucide-react';
import { User } from '@/types';

export default function PharmacyChatPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentOrder, fetchOrder, isLoading } = useOrderStore();

  useEffect(() => {
    if (orderId) fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  if (isLoading || !currentOrder) {
    return <div className="max-w-3xl"><CardSkeleton /></div>;
  }

  const patient = currentOrder.patientId as User | undefined;
  const patientId = typeof patient === 'object' ? patient._id : currentOrder.patientId as string;

  return (
    <div className="max-w-3xl">
      <Link
        href="/pharmacy/chat"
        className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </Link>
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1">
          Order #{currentOrder._id.slice(-8)}
        </p>
        <h1 className="text-[22px] font-light uppercase tracking-wide">
          {typeof patient === 'object' ? patient.name : 'Patient'}
        </h1>
      </div>
      <ChatWindow orderId={orderId} recipientId={patientId} />
    </div>
  );
}
