'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variants = {
  default: 'bg-neutral-100 text-neutral-600',
  success: 'bg-neutral-900 text-white',
  warning: 'bg-neutral-200 text-neutral-800',
  danger: 'bg-black text-white',
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
