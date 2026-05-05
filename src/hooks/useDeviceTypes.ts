 'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { deviceTypeService } from '../services/deviceTypeService';
import { DeviceType } from '../lib/types';

export function useDeviceTypes() {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeviceTypes = async () => {
    try {
      setLoading(true);
      const data = await deviceTypeService.list();
      setDeviceTypes(data || []);
    } catch (error) {
      console.error('Error loading device types', error);
      toast.error('Error al cargar tipos de dispositivos');
      setDeviceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeviceTypes();
  }, []);

  const createDeviceType = async (data: Partial<DeviceType>) => {
    await deviceTypeService.create(data);
    await loadDeviceTypes();
  };

  const updateDeviceType = async (id: string, data: Partial<DeviceType>) => {
    await deviceTypeService.update(id, data);
    await loadDeviceTypes();
  };

  const deleteDeviceType = async (id: string) => {
    await deviceTypeService.remove(id);
    await loadDeviceTypes();
  };

  return { deviceTypes, loading, reload: loadDeviceTypes, createDeviceType, updateDeviceType, deleteDeviceType };
}
