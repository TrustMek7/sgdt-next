'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { deviceService } from '../services/deviceService';
import { deviceTypeService } from '../services/deviceTypeService';
import { officeService } from '../services/officeService';
import { Device, DeviceCreatePayload, DeviceType, Office, DeviceUpdatePayload } from '../lib/types';

export function useDevices(initialPage = 1, limit = 10) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [page, setPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const loadData = async (currentPage = page) => {
    try {
      setLoading(true);
      setCatalogLoading(true);
      const [types, officesData, devicePage] = await Promise.all([
        deviceTypeService.list(),
        officeService.list(),
        deviceService.list(currentPage, limit),
      ]);
      setDeviceTypes(types || []);
      setOffices(officesData || []);
      setDevices(devicePage.data || []);
      setTotalCount(devicePage.totalCount || 0);
    } catch (error) {
      console.error('Error loading device page', error);
      toast.error('Error al cargar dispositivos');
      setDeviceTypes([]);
      setOffices([]);
      setDevices([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadData(page);
  }, [page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / limit)), [totalCount, limit]);

  const createDevice = async (data: DeviceCreatePayload) => {
    const response = await deviceService.create(data);
    await loadData(page);
    return response;
  };

  const updateDevice = async (id: string, data: DeviceUpdatePayload) => {
    await deviceService.update(id, data);
    await loadData(page);
  };

  const deleteDevice = async (id: string) => {
    await deviceService.remove(id);
    await loadData(page);
  };

  return {
    devices,
    deviceTypes,
    offices,
    page,
    setPage,
    totalCount,
    totalPages,
    loading,
    catalogLoading,
    reload: loadData,
    createDevice,
    updateDevice,
    deleteDevice,
  };
}
