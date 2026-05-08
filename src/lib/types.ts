export type Status = 'New' | 'Transfer';
export type Asignacion = 'asignado' | 'pendiente';

export interface Dependencia {
  id: string;
  name: string;
  description?: string;
  subgerenciaCount: number;
}

export interface Clasificacion {
  id: string;
  name: string;
  description?: string;
  typeCount: number;
}

export interface Area {
  id: string;
  name: string;
  officeCount: number;
  dependenciaId?: string;
}

export interface Office {
  id: string;
  name: string;
  floor: number;
  areaId: string;
  deviceCount: number;
}

export interface DeviceType {
  id: string;
  planCode: string;
  description: string;
  characteristics: string;
  brandModel: string;
  imageUrl?: string;
  isTransfer?: boolean;
  clasificacionId?: string;
}

export interface Device {
  id: string;
  inventoryCode: string;
  planCode: string;
  typeId: string;
  status: Status;
  floor: number;
  destinationOfficeId: string;
  originOfficeId?: string;
  originOfficeDescription?: string;
  asignacion: Asignacion;
}

export interface DeviceCreatePayload {
  status: Status;
  inventoryCode?: string;
  inventoryCodes?: string[];
  typeId: string;
  destinationOfficeId: string;
  originOfficeId?: string;
  originOfficeDescription?: string;
  quantity?: number;
}

export interface DeviceCreateResponse {
  message: string;
  created: number;
  devices: Device[];
}

export interface DeviceUpdatePayload {
  inventoryCode?: string;
  typeId?: string;
  destinationOfficeId?: string | null;
  originOfficeId?: string;
  originOfficeDescription?: string;
  asignacion?: Asignacion;
}

export type HistorialAccion = 'creacion' | 'reasignacion' | 'intercambio' | 'baja' | 'desasignacion';

export interface TrasladoRegistro {
  id: string;
  dispositivoId: string;
  codigoInventario?: string;
  origenOficinaId?: string;
  origenOficinaNombre: string;
  destinoOficinaId?: string;
  destinoOficinaNombre?: string;
  accion: 'reasignacion' | 'intercambio' | 'edicion';
  createdAt: string;
}

export interface DeviceHistorialEntry {
  id: string;
  dispositivoId: string;
  accion: HistorialAccion;
  detalle?: string;
  createdAt: string;
}

export interface PaginatedDevicesResponse {
  data: Device[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface ReportSummary {
  dependencias: Dependencia[];
  areas: Area[];
  offices: Office[];
  deviceTypes: DeviceType[];
  devices: Device[];
  clasificaciones: Clasificacion[];
  totals: {
    areas: number;
    offices: number;
    deviceTypes: number;
    devices: number;
    newDevices: number;
    transferDevices: number;
    asignados: number;
    pendientes: number;
    bajas: number;
  };
}

export interface Baja {
  id: string;
  inventoryCode: string;
  areaId: string;
  areaName: string;
  officeName: string;
  description: string;
  origin: string;
  reason: string;
}

export interface DeviceRetirePayload {
  motivo: string;
}

export interface BajaCreatePayload {
  areaId: string;
  codigoInventario?: string;
  descripcion: string;
  oficinaNombre?: string;
  origen?: string;
  motivo?: string;
}

export interface BajaUpdatePayload {
  areaId?: string;
  codigoInventario?: string;
  descripcion?: string;
  oficinaNombre?: string;
  origen?: string;
  motivo?: string;
}

export interface AreaReportDeviceRow {
  id: string;
  inventoryCode: string;
  planCode: string;
  description: string;
  origin: string;
}

export interface AreaReportBajaRow {
  id: string;
  inventoryCode: string;
  description: string;
  officeName: string;
  origin: string;
  reason: string;
}

export interface AreaReportItem {
  area: { id: string; name: string };
  newDevices: AreaReportDeviceRow[];
  transferDevices: AreaReportDeviceRow[];
  bajas: AreaReportBajaRow[];
  totals: { newDevices: number; transferDevices: number; bajas: number };
}

export interface AreaReportResponse {
  reports: AreaReportItem[];
}

export type ReportGroupBy = 'area' | 'subgerencia' | 'dependencia' | 'piso';

export interface ReportBatchFilter {
  floor?: number;
  officeId?: string;
  areaId?: string;
  dependenciaId?: string;
  clasificacionId?: string;
  status?: 'Todos' | 'New' | 'Transfer';
  groupBy?: ReportGroupBy;
  title?: string;
}

export interface ReportBatchItem extends ReportSummary {
  filter?: ReportBatchFilter;
  title: string;
  bajas: Baja[];
}

export interface ReportBatchResponse {
  reports: ReportBatchItem[];
}
