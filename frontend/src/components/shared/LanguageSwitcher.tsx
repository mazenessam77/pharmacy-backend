'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';

import { useLocale } from '@/lib/i18n/I18nProvider';
import { LOCALES, LOCALE_META, type Locale } from '@/lib/i18n/settings';

type Props = {
  /** `compact` shows only the flag/globe (mobile / tight nav); `full` adds the label. */
  variant?: 'full' | 'compact';
  className?: string;
};

/**
 * Language switcher used in every navbar. Switching never changes the route or
 * reloads the page (client-side i18n) — the current page and form state stay
 * intact. Fully keyboard- and screen-reader-accessible.
 */
export default function LanguageSwitcher({ variant = 'full', className = '' }: Props) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LOCALE_META[locale];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Language: ${current.englishLabel}. Change language`}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
      >
        <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
        {variant === 'full' && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true">{current.flag}</span>
            <span>{current.label}</span>
          </span>
        )}
      </button>

      {open && (
        <ul
          role="menu"
          aria-label="Select language"
          className="absolute end-0 mt-1 min-w-[160px] bg-white border border-neutral-200 shadow-sm z-50 py-1"
        >
          {LOCALES.map((code) => {
            const meta = LOCALE_META[code];
            const active = code === locale;
            return (
              <li key={code} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => choose(code)}
                  dir={meta.dir}
                  lang={code}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-[13px] transition-colors ${
                    active
                      ? 'text-neutral-900 font-semibold bg-neutral-50'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">{meta.flag}</span>
                    <span>{meta.label}</span>
                  </span>
                  {active && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
