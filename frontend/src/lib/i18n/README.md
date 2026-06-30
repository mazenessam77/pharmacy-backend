# Internationalization (i18n) — English 🇺🇸 / Arabic 🇸🇦

Client-side i18n built on **i18next + react-i18next**. Language is switched
**in place** — persisted to `localStorage` + cookie, **no URL change, no reload,
route and form state preserved**. Arabic automatically switches the document to
**RTL**.

## Why client-side (not locale-prefixed routing)

The product requirement is to switch language without changing the route or
reloading. Locale-prefixed routing (`/en/...`, `/ar/...`) would rewrite every
URL and remount the tree. A client provider keeps the current page, scroll, and
form input intact — which is the requested UX.

## Architecture

```
src/lib/i18n/
  settings.ts        Single source of truth: locales, namespaces, dir, metadata
  config.ts          i18next instance (LanguageDetector: localStorage→cookie→navigator)
  resources.ts       Static-imported translations (bundled → no loading flash)
  I18nProvider.tsx    Provider + useLocale() hook; syncs <html lang/dir>; persists
  i18next.d.ts        Type augmentation → t() keys are autocompleted + type-checked
  locales/<lng>/<ns>.json   Translations, one file per feature namespace
```

- **`<html lang/dir>`** is set before first paint by an inline script in
  `app/layout.tsx` (no LTR↔RTL flash for returning users), then kept in sync by
  `I18nProvider`.
- **First-visit selection screen**: `components/shared/LanguageGate.tsx` (only
  shows when there is no saved preference).
- **Switcher** (every navbar): `components/shared/LanguageSwitcher.tsx`.

## Usage

```tsx
'use client';
import { useTranslation } from 'react-i18next';

export function Example() {
  const { t } = useTranslation('orders');        // pick the namespace
  return <button>{t('checkout.placeOrder')}</button>; // type-checked key
}
```

Multiple namespaces / shared atoms:

```tsx
const { t } = useTranslation(['orders', 'common']);
t('checkout.title');            // from default ns (orders)
t('common:buttons.cancel');     // explicit ns
```

Current locale / direction / programmatic switch:

```tsx
import { useLocale } from '@/lib/i18n/I18nProvider';
const { locale, dir, setLocale, toggleLocale } = useLocale();
```

## RTL rules (keep layouts balanced in both directions)

1. Prefer **logical Tailwind utilities** so spacing flips automatically:
   `ms-*`/`me-*` (not `ml`/`mr`), `ps-*`/`pe-*`, `start-*`/`end-*`,
   `text-start`/`text-end`, `border-s`/`border-e`, `rounded-s`/`rounded-e`.
2. Flexbox/grid flow follows `dir` automatically — usually nothing to do.
3. Mirror **directional icons only** (arrows, chevrons, “play”): add
   `rtl:rotate-180` or `rtl:-scale-x-100`. Do **not** mirror logos, avatars,
   media, or check/X marks.
4. Wrap Latin runs that must stay LTR (emails, codes, phone numbers) in
   `.force-ltr`.

## Adding things

- **A string**: add the key to `locales/en/<ns>.json` **and** `locales/ar/<ns>.json`.
  `en` is the canonical shape — a key missing from `en` is a type error at the
  call site; a key missing from `ar` falls back to English.
- **A namespace**: create `locales/en/<ns>.json` + `locales/ar/<ns>.json`,
  import both in `resources.ts`, add to `NAMESPACES` in `settings.ts`.
- **A language**: add the code to `LOCALES` + `LOCALE_META` + `LOCALE_DIRECTION`
  in `settings.ts` and a `locales/<code>/` folder. Everything else is automatic.

## Rollout status

**Done** — foundation + public surface: landing nav, hero, footer; language
selection screen; switcher; RTL + Arabic font; `lang`/`dir`; persistence;
type-safe keys. Namespaces ready: `common, nav, footer, landing, auth, errors`.

**Remaining** (mechanical — same pattern, per-feature namespace already reserved
in `settings.ts`): finish landing sections (features/about/how-it-works/cta/
showcase) · auth pages · patient dashboard/profile/medicines/orders/saved/
side-effects · pharmacy pages · admin pages · shared Navbar/Sidebar/UI · toasts
& validation messages. Convert each by replacing literals with `t()` keys in the
matching namespace JSON.
