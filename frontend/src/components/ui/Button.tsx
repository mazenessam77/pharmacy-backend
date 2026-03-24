'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'indigo' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = {
  primary: 'bg-black text-white hover:bg-neutral-800',
  indigo: 'bg-indigo-600 text-white hover:bg-indigo-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  outline: 'border border-black text-black hover:bg-black hover:text-white',
  ghost: 'text-black hover:underline',
};

const sizes = {
  sm: 'px-6 py-2 text-[11px]',
  md: 'px-8 py-3 text-[12px]',
  lg: 'px-10 py-4 text-[13px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 uppercase tracking-widest font-light transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export default Button;
