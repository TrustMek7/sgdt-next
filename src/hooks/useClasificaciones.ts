'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Clasificacion } from '../lib/types';
import { getClasificaciones, createClasificacion, updateClasificacion, deleteClasificacion } from '../lib/api';

export function useClasificaciones() {
  const [clasificaciones, setClasificaciones] = useState<Clasificacion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      setClasificaciones(await getClasificaciones());
    } catch {
      toast.error('Error al cargar clasificaciones');
      setClasificaciones([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (data: { name: string; description?: string }) => {
    const created = await createClasificacion(data);
    setClasificaciones((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  };

  const update = async (id: string, data: { name?: string; description?: string }) => {
    const updated = await updateClasificacion(id, data);
    setClasificaciones((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const remove = async (id: string) => {
    await deleteClasificacion(id);
    setClasificaciones((prev) => prev.filter((c) => c.id !== id));
  };

  return { clasificaciones, loading, reload: load, create, update, remove };
}
