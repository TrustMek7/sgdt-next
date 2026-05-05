'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors />
      {children}
    </AuthProvider>
  );
}