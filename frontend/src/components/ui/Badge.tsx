'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variants = {
  default: 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300',
  success: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400',
  danger:  'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400',
  info:    'bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-widest rounded-full ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
