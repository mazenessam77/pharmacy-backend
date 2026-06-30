'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nextProvider } from 'react-i18next';

import { getI18n } from './config';
import {
  DEFAULT_LOCALE,
  getDirection,
  isLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
} from './settings';

const i18n = getI18n();

type LocaleContextValue = {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  /** True once the saved/detected language has been resolved on the client. */
  ready: boolean;
  /** True if the user has an explicitly saved preference (returning visitor). */
  hasSavedPreference: boolean;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/** Single hook for everything language-related (current locale, dir, switch). */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within <I18nProvider>');
  return ctx;
}

function readSavedPreference(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const ls = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(ls)) return ls;
    const m = document.cookie.match(/(?:^|;\s*)pharmalink\.lang=([^;]+)/);
    if (m && isLocale(m[1])) return m[1];
  } catch {
    /* storage may be blocked (private mode) — fall through */
  }
  return null;
}

function applyHtmlAttrs(locale: Locale) {
  if (typeof document === 'undefined') return;
  const dir = getDirection(locale);
  const el = document.documentElement;
  if (el.lang !== locale) el.lang = locale;
  if (el.dir !== dir) el.dir = dir;
}

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    isLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE,
  );
  const [ready, setReady] = useState(false);
  const [hasSavedPreference, setHasSavedPreference] = useState(false);

  // Keep <html lang/dir> in sync whenever the locale changes.
  useEffect(() => {
    applyHtmlAttrs(locale);
  }, [locale]);

  // Resolve the detected/saved language on the client and subscribe to changes.
  useEffect(() => {
    const onChange = (lng: string) => {
      if (isLocale(lng)) setLocaleState(lng);
    };
    i18n.on('languageChanged', onChange);

    if (isLocale(i18n.language) && i18n.language !== locale) {
      setLocaleState(i18n.language);
    }
    setHasSavedPreference(readSavedPreference() !== null);
    setReady(true);

    return () => {
      i18n.off('languageChanged', onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback((next: Locale) => {
    if (next === i18n.language) {
      setHasSavedPreference(true);
      return;
    }
    void i18n.changeLanguage(next); // detector caches to localStorage + cookie
    try {
      document.cookie = `${LOCALE_STORAGE_KEY}=${next};path=/;max-age=31536000;samesite=lax`;
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore storage failures */
    }
    setHasSavedPreference(true);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(i18n.language === 'ar' ? 'en' : 'ar');
  }, [setLocale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir: getDirection(locale),
      ready,
      hasSavedPreference,
      setLocale,
      toggleLocale,
    }),
    [locale, ready, hasSavedPreference, setLocale, toggleLocale],
  );

  return (
    <I18nextProvider i18n={i18n}>
      <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
    </I18nextProvider>
  );
}
