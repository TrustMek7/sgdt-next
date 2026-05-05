'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dependencia } from '../lib/types';
import { getDependencias, createDependencia, updateDependencia, deleteDependencia } from '../lib/api';

export function useDependencias() {
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setDependencias(await getDependencias());
    } catch {
      toast.error('Error al cargar dependencias');
      setDependencias([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (data: { name: string; description?: string }) => {
    const created = await createDependencia(data);
    setDependencias((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  };

  const update = async (id: string, data: { name?: string; description?: string }) => {
    const updated = await updateDependencia(id, data);
    setDependencias((prev) => prev.map((d) => (d.id === id ? updated : d)));
    return updated;
  };

  const remove = async (id: string) => {
    await deleteDependencia(id);
    setDependencias((prev) => prev.filter((d) => d.id !== id));
  };

  return { dependencias, loading, reload: load, create, update, remove };
}
