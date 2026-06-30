/**
 * Type-safe translation keys. Augments react-i18next with our resource shape so
 * `t('common:buttons.save')` autocompletes and a typo'd key is a compile error.
 * `en` is the canonical key set.
 */
import 'i18next';
import type { AppResources } from './resources';
import type { DEFAULT_NAMESPACE } from './settings';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof DEFAULT_NAMESPACE;
    resources: AppResources;
    returnNull: false;
  }
}
