 'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { officeService } from '../services/officeService';
import { Area, Office } from '../lib/types';
import { areaService } from '../services/areaService';

export function useOffices() {
  const [offices, setOffices] = useState<Office[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [areasData, officesData] = await Promise.all([areaService.list(), officeService.list()]);
      setAreas(areasData || []);
      setOffices(officesData || []);
    } catch (error) {
      console.error('Error loading offices', error);
      toast.error('Error al cargar oficinas');
      setAreas([]);
      setOffices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createOffice = async (data: Partial<Office>) => {
    await officeService.create(data);
    await loadData();
  };

  const updateOffice = async (id: string, data: Partial<Office>) => {
    await officeService.update(id, data);
    await loadData();
  };

  const deleteOffice = async (id: string) => {
    await officeService.remove(id);
    await loadData();
  };

  return { offices, areas, loading, reload: loadData, createOffice, updateOffice, deleteOffice };
}
