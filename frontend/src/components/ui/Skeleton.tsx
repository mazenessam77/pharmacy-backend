'use client';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-neutral-100 dark:bg-slate-700 rounded ${className}`} />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-neutral-200 dark:border-slate-700 rounded-2xl p-6 space-y-4 bg-white dark:bg-slate-800">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-neutral-200 dark:border-slate-700 rounded-xl p-5 flex items-center gap-4 bg-white dark:bg-slate-800">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
