'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0e0e20',
            color: '#eef2ff',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '10px',
            fontSize: '13.5px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0e0e20' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#0e0e20' },
          },
        }}
      />
    </SessionProvider>
  );
}
