'use client';

import { Cross } from 'lucide-react';

import { useLocale } from '@/lib/i18n/I18nProvider';
import { LOCALES, LOCALE_META } from '@/lib/i18n/settings';

/**
 * First-visit language selection screen. Rendered only when the visitor has no
 * saved preference; once they choose, the choice persists (localStorage +
 * cookie) and this never shows again — returning users go straight to their
 * language. Intentionally bilingual so it reads naturally regardless of locale.
 */
export default function LanguageGate() {
  const { ready, hasSavedPreference, setLocale } = useLocale();

  // Avoid a flash for returning users: render nothing until resolved, and never
  // for anyone who already has a saved preference.
  if (!ready || hasSavedPreference) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose your language — اختر لغتك"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6"
    >
      <div className="w-full max-w-md bg-white border border-neutral-200 p-8 sm:p-10 animate-fade-in-up">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center mb-5">
            <Cross className="w-6 h-6 text-white fill-white" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-neutral-900">PharmaLink</h1>
          <p className="mt-2 text-[13px] text-neutral-500">
            <span lang="en" dir="ltr">
              Choose your language
            </span>
            <span aria-hidden="true" className="mx-2 text-neutral-300">
              ·
            </span>
            <span lang="ar" dir="rtl">
              اختر لغتك
            </span>
          </p>

          <div className="mt-8 grid w-full grid-cols-1 gap-3">
            {LOCALES.map((code) => {
              const meta = LOCALE_META[code];
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  lang={code}
                  dir={meta.dir}
                  className="group flex items-center justify-center gap-3 border border-neutral-200 px-5 py-4 text-[15px] font-semibold text-neutral-800 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                  <span aria-hidden="true" className="text-xl">
                    {meta.flag}
                  </span>
                  <span>{meta.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
