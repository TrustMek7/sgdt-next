'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { deviceService } from '../services/deviceService';
import { deviceTypeService } from '../services/deviceTypeService';
import { officeService } from '../services/officeService';
import { Device, DeviceCreatePayload, DeviceType, Office, DeviceUpdatePayload, Area, Dependencia } from '../lib/types';
import { getAreas, getDependencias } from '../lib/api';

export function useDevices() {
  const [devices, setDevices]           = useState<Device[]>([]);
  const [deviceTypes, setDeviceTypes]   = useState<DeviceType[]>([]);
  const [offices, setOffices]           = useState<Office[]>([]);
  const [areas, setAreas]               = useState<Area[]>([]);
  const [dependencias, setDependencias] = useState<Dependencia[]>([]);
  const [loading, setLoading]           = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [types, officesData, devicesData, areasData, depsData] = await Promise.all([
        deviceTypeService.list(),
        officeService.list(),
        deviceService.list(),
        getAreas(),
        getDependencias(),
      ]);
      setDeviceTypes(types || []);
      setOffices(officesData || []);
      setDevices(devicesData || []);
      setAreas(areasData || []);
      setDependencias(depsData || []);
    } catch {
      toast.error('Error al cargar dispositivos');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const createDevice = async (data: DeviceCreatePayload) => {
    const response = await deviceService.create(data);
    await loadData();
    return response;
  };

  const updateDevice = async (id: string, data: DeviceUpdatePayload) => {
    await deviceService.update(id, data);
    await loadData();
  };

  const unassignDevice = async (id: string) => {
    await deviceService.unassign(id);
    await loadData();
  };

  const reassignDevice = async (id: string, destinationOfficeId: string) => {
    await deviceService.reassign(id, destinationOfficeId);
    await loadData();
  };

  const swapDevices = async (idA: string, idB: string) => {
    await deviceService.swap(idA, idB);
    await loadData();
  };

  const deleteDevice = async (id: string) => {
    await deviceService.remove(id);
    await loadData();
  };

  const retireDevice = async (id: string, motivo: string) => {
    await deviceService.retire(id, motivo);
    await loadData();
  };

  return {
    devices, deviceTypes, offices, areas, dependencias,
    loading,
    reload: loadData,
    createDevice, updateDevice, unassignDevice, reassignDevice, swapDevices, deleteDevice, retireDevice,
  };
}
