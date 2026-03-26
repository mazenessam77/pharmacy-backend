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
        <label className="block text-[11px] uppercase tracking-widest text-neutral-500 dark:text-zinc-400 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          className={`peer w-full py-2.5 bg-transparent text-[14px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-300 dark:placeholder-slate-600 focus:outline-none ${className}`}
          {...props}
        />
        {/* static base line */}
        <div className={`absolute bottom-0 left-0 right-0 h-px ${error ? 'bg-red-200' : 'bg-neutral-200 dark:bg-zinc-800'}`} />
        {/* animated focus / error line */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-[1.5px] transition-transform duration-300 origin-left ${
            error
              ? 'bg-red-500 scale-x-100'
              : 'bg-sky-500 scale-x-0 peer-focus:scale-x-100'
          }`}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-[11px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  )
);

Input.displayName = 'Input';
export default Input;
