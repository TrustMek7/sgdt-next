'use client';

import { useEffect, useRef, useState } from 'react';

const POLL_MS = 2 * 60 * 1000;
const RELOADED_KEY = 'sgdt_reloaded';

export function useVersionCheck(): { outdated: boolean; canAutoReload: boolean; markReloaded: () => void } {
  const [outdated, setOutdated] = useState(false);
  const initialId = useRef<string | null>(null);

  // Limpiar param cache-buster y determinar si ya intentamos un reload
  const canAutoReload = typeof window !== 'undefined'
    ? !sessionStorage.getItem(RELOADED_KEY)
    : true;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('_r')) {
      url.searchParams.delete('_r');
      window.history.replaceState({}, '', url.toString());
      // El reload funcionó (llegamos con _r) → limpiar el guard
      sessionStorage.removeItem(RELOADED_KEY);
    }

    // Solo chequear en producción; en dev el hot-reload ya se encarga
    if (process.env.NODE_ENV !== 'production') return;

    initialId.current = process.env.BUILD_ID ?? null;
    if (!initialId.current) return;

    const check = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { buildId } = (await res.json()) as { buildId: string };
        if (buildId !== initialId.current) setOutdated(true);
      } catch {
        // red caída, ignorar
      }
    };

    const id = setInterval(check, POLL_MS);
    return () => clearInterval(id);
  }, []);

  const markReloaded = () => sessionStorage.setItem(RELOADED_KEY, '1');

  return { outdated, canAutoReload, markReloaded };
}
