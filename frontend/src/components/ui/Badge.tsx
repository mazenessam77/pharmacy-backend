'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variants = {
  default: 'bg-neutral-100 text-neutral-600',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block px-3 py-1 text-[10px] uppercase tracking-widest ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
