'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';

import I18nProvider from '@/lib/i18n/I18nProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
        {children}
      </GoogleOAuthProvider>
    </I18nProvider>
  );
}
