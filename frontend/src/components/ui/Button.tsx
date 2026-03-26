'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'indigo' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = {
  primary:
    'bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 active:scale-[0.97] btn-shine',
  indigo:
    'bg-sky-600 text-white hover:bg-sky-700 hover:shadow-lg hover:shadow-sky-300/40 dark:hover:shadow-sky-900/40 active:scale-[0.97] btn-shine',
  danger:  'bg-red-600 text-white hover:bg-red-700 active:scale-[0.97]',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.97]',
  outline:
    'border border-black dark:border-slate-500 text-black dark:text-slate-200 hover:bg-black dark:hover:bg-slate-700 hover:text-white active:scale-[0.97]',
  ghost: 'text-black dark:text-slate-200 hover:underline',
};

const sizes = {
  sm: 'px-5 py-2 text-[12px] rounded-xl',
  md: 'px-7 py-2.5 text-[13px] rounded-xl',
  lg: 'px-8 py-3 text-[13px] rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export default Button;
