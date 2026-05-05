'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { bajaService } from '../services/bajaService';
import { Baja, BajaCreatePayload, BajaUpdatePayload } from '../lib/types';

export function useBajas() {
  const [bajas, setBajas] = useState<Baja[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBajas = async () => {
    try {
      setLoading(true);
      const data = await bajaService.list();
      setBajas(data || []);
    } catch (error) {
      console.error('Error loading bajas', error);
      toast.error('Error al cargar bajas');
      setBajas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBajas();
  }, []);

  const createBaja = async (data: BajaCreatePayload) => {
    await bajaService.create(data);
    await loadBajas();
  };

  const createBajas = async (items: BajaCreatePayload[]) => {
    await bajaService.createBatch(items);
    await loadBajas();
  };

  const updateBaja = async (id: string, data: BajaUpdatePayload) => {
    await bajaService.update(id, data);
    await loadBajas();
  };

  const deleteBaja = async (id: string) => {
    await bajaService.remove(id);
    await loadBajas();
  };

  return { bajas, loading, reload: loadBajas, createBaja, createBajas, updateBaja, deleteBaja };
}