import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/shared/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'PharmaLink',
  description: 'Connect with nearby pharmacies, request medicines, and get them delivered.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
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
