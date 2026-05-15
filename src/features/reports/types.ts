import type { Device, DeviceType, Baja, TrasladoRegistro } from '../../lib/types';

export type ReportSubSection = {
  label: string;
  newDevices: { device: Device; type: DeviceType }[];
  transferDevices: { device: Device; type: DeviceType }[];
  transferRedistribuido: { device: Device; type: DeviceType }[];
  salidas: TrasladoRegistro[];
  entradas: TrasladoRegistro[];
};

export type ReportSection = {
  label: string;
  sublabel?: string;
  newDevices: { device: Device; type: DeviceType }[];
  transferDevices: { device: Device; type: DeviceType }[];
  transferRedistribuido: { device: Device; type: DeviceType }[];
  salidas: TrasladoRegistro[];
  entradas: TrasladoRegistro[];
  bajas: Baja[];
  subSections?: ReportSubSection[];
};
