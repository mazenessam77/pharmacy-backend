'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] uppercase tracking-widest text-neutral-500 mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={`w-full py-2.5 bg-transparent border-0 border-b text-[14px] focus:outline-none focus:border-black transition-colors duration-300 appearance-none cursor-pointer ${
          error ? 'border-black' : 'border-neutral-300'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-[11px] text-neutral-500">{error}</p>}
    </div>
  )
);

Select.displayName = 'Select';
export default Select;
