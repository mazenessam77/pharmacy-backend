'use client';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

// Monochrome tiers — distinguished by fill vs. outline vs. grey (no hue).
const variants = {
  default: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
  success: 'bg-black text-white border border-black',
  warning: 'bg-neutral-200 text-black border border-neutral-300',
  danger: 'bg-white text-black border border-black',
  info: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
};

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
