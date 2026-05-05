'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return <LoadingState />;
  }

  return <Layout>{children}</Layout>;
}