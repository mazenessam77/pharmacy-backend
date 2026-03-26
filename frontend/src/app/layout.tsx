import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/shared/Providers';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PharmaLink',
  description: 'Connect with nearby pharmacies, request medicines, and get them delivered.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');if(t!=='light')document.documentElement.classList.add('dark');})();` }} />
      </head>
      <body className="dark:bg-black">
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#0f172a',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 500,
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.06)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
