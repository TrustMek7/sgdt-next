'use client';

import { useEffect, useRef, useState } from 'react';

const POLL_MS = 10 * 60 * 1000; // 10 minutos
const RELOADED_KEY = 'sgdt_reloaded';

export function useVersionCheck(): { outdated: boolean; canAutoReload: boolean; markReloaded: () => void } {
  const [outdated, setOutdated] = useState(false);
  const initialId = useRef<string | null>(null);
  // Capturado al montar — no cambia en re-renders posteriores
  const canAutoReload = useRef(
    typeof window !== 'undefined' ? !sessionStorage.getItem(RELOADED_KEY) : true
  ).current;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has('_r')) {
      url.searchParams.delete('_r');
      window.history.replaceState({}, '', url.toString());
      sessionStorage.removeItem(RELOADED_KEY);
    }

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
