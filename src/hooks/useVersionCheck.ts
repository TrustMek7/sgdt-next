'use client';

import { useEffect, useRef, useState } from 'react';

const POLL_MS = 2 * 60 * 1000;

export function useVersionCheck() {
  const [outdated, setOutdated] = useState(false);
  const initialId = useRef<string | null>(null);

  useEffect(() => {
    // Limpiar el param de cache-busting si venimos de un reload forzado
    const url = new URL(window.location.href);
    if (url.searchParams.has('_r')) {
      url.searchParams.delete('_r');
      window.history.replaceState({}, '', url.toString());
    }

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

  return outdated;
}
