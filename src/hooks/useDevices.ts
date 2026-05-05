'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { deviceService } from '../services/deviceService';
import { deviceTypeService } from '../services/deviceTypeService';
import { officeService } from '../services/officeService';
import { Device, DeviceCreatePayload, DeviceType, Office, DeviceUpdatePayload, Area, Dependencia } from '../lib/types';
import { getAreas } from '../lib/api';
import { getDependencias } from '../lib/api';

export function useDevices(initialPage = 1, limit = 50) {
  const [devices, setDevices]         = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [offices, setOffices]         = useState<Office[]>([]);
  const [areas, setAreas]             = useState<Area[]>([]);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [page, setPage]               = useState(initialPage);
  const [totalCount, setTotalCount]   = useState(0);
  const [loading, setLoading]         = useState(true);

  const loadData = async (currentPage = page) => {
    try {
      setLoading(true);
      const [types, officesData, devicePage, areasData, depsData] = await Promise.all([
        deviceTypeService.list(),
        officeService.list(),
        deviceService.list(currentPage, limit),
        getAreas(),
        getDependencias(),
      ]);
      setDeviceTypes(types || []);
      setOffices(officesData || []);
      setDevices(devicePage.data || []);
      setTotalCount(devicePage.totalCount || 0);
      setAreas(areasData || []);
      setDependencias(depsData || []);
    } catch {
      toast.error('Error al cargar dispositivos');
      setDevices([]); setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(page); }, [page]);

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

  const unassignDevice = async (id: string) => {
    await deviceService.unassign(id);
    await loadData(page);
  };

  const reassignDevice = async (id: string, destinationOfficeId: string) => {
    await deviceService.reassign(id, destinationOfficeId);
    await loadData(page);
  };

  const swapDevices = async (idA: string, idB: string) => {
    await deviceService.swap(idA, idB);
    await loadData(page);
  };

  const deleteDevice = async (id: string) => {
    await deviceService.remove(id);
    await loadData(page);
  };

  return {
    devices, deviceTypes, offices, areas, dependencias,
    page, setPage, totalCount, totalPages, loading,
    reload: loadData,
    createDevice, updateDevice, unassignDevice, reassignDevice, swapDevices, deleteDevice,
  };
}
