import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'PharmaLink',
  description: 'Connect with nearby pharmacies, request medicines, and get them delivered.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 300,
            },
          }}
        />
      </body>
    </html>
  );
}
