'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'indigo' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

// Monochrome / editorial: solid black or outlined, square, uppercase.
const variants = {
  primary: 'bg-black text-white hover:bg-neutral-800 active:scale-[0.99]',
  indigo: 'bg-black text-white hover:bg-neutral-800 active:scale-[0.99]',
  danger: 'bg-black text-white hover:bg-neutral-800 active:scale-[0.99]',
  success: 'bg-black text-white hover:bg-neutral-800 active:scale-[0.99]',
  outline: 'border border-black text-black bg-white hover:bg-black hover:text-white active:scale-[0.99]',
  ghost: 'text-black hover:underline underline-offset-4',
};

const sizes = {
  sm: 'px-5 py-2 text-[11px] tracking-[0.12em]',
  md: 'px-7 py-2.5 text-[11px] tracking-[0.15em]',
  lg: 'px-8 py-3.5 text-[12px] tracking-[0.18em]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-medium uppercase transition-all duration-200 select-none disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
export default Button;
