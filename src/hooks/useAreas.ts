'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { areaService } from '../services/areaService';
import { Area } from '../lib/types';

export function useAreas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const data = await areaService.list();
      setAreas(data || []);
    } catch (error) {
      console.error('Error loading areas', error);
      toast.error('Error al cargar áreas');
      setAreas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const createArea = async (data: Partial<Area>) => {
    await areaService.create(data);
    await loadAreas();
  };

  const updateArea = async (id: string, data: Partial<Area>) => {
    await areaService.update(id, data);
    await loadAreas();
  };

  const deleteArea = async (id: string) => {
    await areaService.remove(id);
    await loadAreas();
  };

  return { areas, loading, reload: loadAreas, createArea, updateArea, deleteArea };
}
