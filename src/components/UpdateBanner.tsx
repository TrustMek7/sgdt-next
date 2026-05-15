'use client';

import { useEffect, useState } from 'react';
import { useVersionCheck } from '../hooks/useVersionCheck';

const COUNTDOWN = 10;

function forceReload() {
  const url = new URL(window.location.href);
  url.searchParams.set('_r', Date.now().toString());
  window.location.replace(url.toString());
}

export function UpdateBanner() {
  const outdated = useVersionCheck();
  const [seconds, setSeconds] = useState(COUNTDOWN);

  useEffect(() => {
    if (!outdated) return;
    setSeconds(COUNTDOWN);

    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          forceReload();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [outdated]);

  if (!outdated) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-4 rounded-lg bg-indigo-600 px-4 py-3 text-white shadow-lg">
      <div className="text-sm">
        <p className="font-medium">Nueva versión disponible</p>
        <p className="text-indigo-200 text-xs">Actualizando en {seconds}s…</p>
      </div>
      <button
        onClick={forceReload}
        className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
      >
        Actualizar ahora
      </button>
    </div>
  );
}
