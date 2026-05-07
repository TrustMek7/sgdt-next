'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">Algo salió mal</h2>
      <p className="text-gray-500 max-w-sm">{error.message || 'Ocurrió un error inesperado. Intenta recargar la página.'}</p>
      <button onClick={reset} className="btn-primary">Reintentar</button>
    </div>
  );
}
