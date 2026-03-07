'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] uppercase tracking-widest text-neutral-500 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full py-2.5 bg-transparent border-0 border-b text-[14px] placeholder-neutral-300 focus:outline-none focus:border-black transition-colors duration-300 ${
          error ? 'border-black' : 'border-neutral-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-[11px] text-neutral-500">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
export default Input;
