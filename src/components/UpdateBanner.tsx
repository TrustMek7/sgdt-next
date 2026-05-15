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
  const { outdated, canAutoReload, markReloaded } = useVersionCheck();
  const [seconds, setSeconds] = useState(COUNTDOWN);

  // Auto-reload con countdown solo si no lo intentamos antes
  useEffect(() => {
    if (!outdated || !canAutoReload) return;
    setSeconds(COUNTDOWN);

    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          markReloaded();
          forceReload();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [outdated, canAutoReload]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!outdated) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-4 rounded-lg bg-indigo-600 px-4 py-3 text-white shadow-lg">
      <div className="text-sm">
        <p className="font-medium">Nueva versión disponible</p>
        {canAutoReload
          ? <p className="text-indigo-200 text-xs">Actualizando en {seconds}s…</p>
          : <p className="text-indigo-200 text-xs">Haz clic para actualizar</p>
        }
      </div>
      <button
        onClick={() => { markReloaded(); forceReload(); }}
        className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
      >
        Actualizar ahora
      </button>
    </div>
  );
}
