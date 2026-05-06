import { createDevice, deleteDevice, getDevicesList, updateDevice, unassignDevice, reassignDevice, swapDevices } from '../lib/api';
import { DeviceCreatePayload, DeviceUpdatePayload } from '../lib/types';

export const deviceService = {
  list: () => getDevicesList(),
  create: (data: DeviceCreatePayload) => createDevice(data),
  update: (id: string, data: DeviceUpdatePayload) => updateDevice(id, data),
  unassign: (id: string) => unassignDevice(id),
  reassign: (id: string, destinationOfficeId: string) => reassignDevice(id, destinationOfficeId),
  swap: (idA: string, idB: string) => swapDevices(idA, idB),
  remove: (id: string) => deleteDevice(id),
};
