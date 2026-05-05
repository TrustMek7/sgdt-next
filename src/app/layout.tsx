import type { Metadata } from 'next';
import React from 'react';
import { AppProviders } from '@/components/AppProviders';
import '../index.css';

export const metadata: Metadata = {
  title: 'SGDT',
  description: 'Sistema de Gestión de Traslado de Dispositivos',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}