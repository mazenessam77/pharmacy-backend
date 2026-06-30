import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/shared/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'PharmaLink',
  description: 'Connect with nearby pharmacies, request medicines, and get them delivered.',
};

// Runs before first paint to set <html lang/dir> from the saved preference
// (localStorage → cookie → browser language). Prevents any LTR↔RTL flash for
// returning users; the React provider keeps it in sync afterwards.
const setInitialLang = `(function(){try{var k='pharmalink.lang';var s=null;try{s=localStorage.getItem(k);}catch(e){}if(s!=='en'&&s!=='ar'){var m=document.cookie.match(/(?:^|; )pharmalink\\.lang=([^;]+)/);if(m){s=m[1];}}if(s!=='en'&&s!=='ar'){s=(navigator.language||'').toLowerCase().indexOf('ar')===0?'ar':'en';}var el=document.documentElement;el.lang=s;el.dir=(s==='ar'?'rtl':'ltr');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="bg-white text-black">
        <script dangerouslySetInnerHTML={{ __html: setInitialLang }} />
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#000',
                color: '#fff',
                borderRadius: '0',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                boxShadow: 'none',
                border: '1px solid #000',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
