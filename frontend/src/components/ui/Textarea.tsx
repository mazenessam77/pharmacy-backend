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
        <label className="block text-[11px] uppercase tracking-widest text-neutral-500 mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={`w-full py-2.5 bg-transparent border border-neutral-300 px-3 text-[14px] placeholder-neutral-300 focus:outline-none focus:border-black transition-colors duration-300 resize-none ${
          error ? 'border-black' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-[11px] text-neutral-500">{error}</p>}
    </div>
  )
);

Textarea.displayName = 'Textarea';
export default Textarea;
