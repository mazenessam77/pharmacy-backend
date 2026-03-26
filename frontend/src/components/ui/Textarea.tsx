'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] uppercase tracking-widest text-neutral-500 dark:text-zinc-400 mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`w-full py-2.5 bg-transparent dark:bg-zinc-900/50 border border-neutral-300 dark:border-zinc-700 px-3 text-[14px] text-neutral-900 dark:text-zinc-100 placeholder-neutral-300 dark:placeholder-slate-600 focus:outline-none focus:border-sky-500 dark:focus:border-sky-500 transition-colors duration-300 resize-none rounded-lg ${
          error ? 'border-red-400' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-[11px] text-neutral-500 dark:text-zinc-400">{error}</p>}
    </div>
  )
);

Textarea.displayName = 'Textarea';
export default Textarea;
