import { supabase } from './supabase';
import {
  Area,
  Office,
  DeviceType,
  Device,
  DeviceCreatePayload,
  DeviceCreateResponse,
  DeviceUpdatePayload,
  PaginatedDevicesResponse,
  ReportBatchFilter,
  ReportBatchResponse,
  ReportBatchItem,
  ReportSummary,
  Baja,
  BajaCreatePayload,
  BajaUpdatePayload,
  AreaReportResponse,
  AreaReportItem,
  AreaReportDeviceRow,
  AreaReportBajaRow,
} from './types';

type AreaRow = { id: number; nombre: string; planoUrl: string | null; createdAt: string; updatedAt: string };
type OfficeRow = { id: number; nombre: string; piso: number; areaId: number; createdAt: string; updatedAt: string };
type DeviceTypeRow = {
  codigo: string;
  descripcion: string;
  caracteristicas: string | null;
  marcaModelo: string | null;
  imagenUrl: string | null;
  esTraslado: boolean;
  createdAt: string;
  updatedAt: string;
};
type DeviceRow = {
  id: number;
  codigoInventario: string | null;
  tipoCodigo: string;
  estado: 'nuevo' | 'traslado';
  destinoId: number;
  origenId: number | null;
  origenDescripcion: string | null;
  createdAt: string;
  updatedAt: string;
};
type BajaRow = {
  id: number;
  codigoInventario: string | null;
  areaId: number;
  oficinaNombre: string | null;
  descripcion: string;
  origen: string | null;
  motivo: string | null;
  createdAt: string;
  updatedAt: string;
};

const toId = (value: string | number) => String(value);

const mapArea = (row: AreaRow, officeCount = 0): Area => ({
  id: toId(row.id),
  name: row.nombre,
  officeCount,
});

const mapOffice = (row: OfficeRow, deviceCount = 0): Office => ({
  id: toId(row.id),
  name: row.nombre,
  floor: row.piso,
  areaId: toId(row.areaId),
  deviceCount,
});

const mapDeviceType = (row: DeviceTypeRow): DeviceType => ({
  id: row.codigo,
  planCode: row.codigo,
  description: row.descripcion,
  characteristics: row.caracteristicas ?? '',
  brandModel: row.marcaModelo ?? '',
  imageUrl: row.imagenUrl ?? undefined,
  isTransfer: row.esTraslado,
});

const mapDevice = (
  row: DeviceRow,
  officesById: Map<string, Office>,
): Device => ({
  id: toId(row.id),
  inventoryCode: row.codigoInventario ?? '',
  planCode: row.tipoCodigo,
  typeId: row.tipoCodigo,
  status: row.estado === 'traslado' ? 'Transfer' : 'New',
  floor: officesById.get(toId(row.destinoId))?.floor ?? 0,
  destinationOfficeId: toId(row.destinoId),
  originOfficeId: row.origenId ? toId(row.origenId) : undefined,
  originOfficeDescription: row.origenDescripcion ?? undefined,
});

const loadBaseData = async () => {
  const [areasResult, officesResult, deviceTypesResult, devicesResult, bajasResult] = await Promise.all([
    supabase!.from('area').select('*').order('nombre', { ascending: true }),
    supabase!.from('oficina').select('*').order('nombre', { ascending: true }),
    supabase!.from('tipo_dispositivo').select('*').order('codigo', { ascending: true }),
    supabase!.from('dispositivo').select('*').order('id', { ascending: true }),
    supabase!.from('baja').select('*').order('id', { ascending: true }),
  ]);

  if (areasResult.error) throw areasResult.error;
  if (officesResult.error) throw officesResult.error;
  if (deviceTypesResult.error) throw deviceTypesResult.error;
  if (devicesResult.error) throw devicesResult.error;
  if (bajasResult.error) throw bajasResult.error;

  const rawAreas = (areasResult.data ?? []) as AreaRow[];
  const rawOffices = (officesResult.data ?? []) as OfficeRow[];
  const rawDeviceTypes = (deviceTypesResult.data ?? []) as DeviceTypeRow[];
  const rawDevices = (devicesResult.data ?? []) as DeviceRow[];
  const rawBajas = (bajasResult.data ?? []) as BajaRow[];

  const offices = rawOffices.map((office) => mapOffice(office));
  const officesById = new Map(offices.map((office) => [office.id, office] as const));
  const deviceTypes = rawDeviceTypes.map(mapDeviceType);
  const devices = rawDevices.map((device) => mapDevice(device, officesById));
  const bajas = rawBajas.map((baja) => ({
    id: toId(baja.id),
    inventoryCode: baja.codigoInventario ?? '',
    areaId: toId(baja.areaId),
    areaName: rawAreas.find((area) => toId(area.id) === toId(baja.areaId))?.nombre ?? '',
    officeName: baja.oficinaNombre ?? '',
    description: baja.descripcion,
    origin: baja.origen ?? '',
    reason: baja.motivo ?? '',
  } as Baja));

  const officeCountByArea = offices.reduce<Record<string, number>>((acc, office) => {
    acc[office.areaId] = (acc[office.areaId] ?? 0) + 1;
    return acc;
  }, {});

  const deviceCountByOffice = devices.reduce<Record<string, number>>((acc, device) => {
    acc[device.destinationOfficeId] = (acc[device.destinationOfficeId] ?? 0) + 1;
    return acc;
  }, {});

  const areas = rawAreas.map((area) => mapArea(area, officeCountByArea[toId(area.id)] ?? 0));
  const officesWithCounts = offices.map((office) => ({ ...office, deviceCount: deviceCountByOffice[office.id] ?? 0 }));

  const summary: ReportSummary = {
    areas,
    offices: officesWithCounts,
    deviceTypes,
    devices,
    totals: {
      areas: areas.length,
      offices: officesWithCounts.length,
      deviceTypes: deviceTypes.length,
      devices: devices.length,
      newDevices: devices.filter((device) => device.status === 'New').length,
      transferDevices: devices.filter((device) => device.status === 'Transfer').length,
    },
  };

  return { rawAreas, offices: officesWithCounts, deviceTypes, devices, bajas, summary };
};

const filterSummary = (
  data: Awaited<ReturnType<typeof loadBaseData>>,
  filter: ReportBatchFilter,
): ReportBatchItem => {
  const filteredOfficeIds = new Set(
    data.offices
      .filter((office) => {
        const matchesFloor = filter.floor ? office.floor === filter.floor : true;
        const matchesArea = filter.areaId ? office.areaId === filter.areaId : true;
        return matchesFloor && matchesArea;
      })
      .map((office) => office.id),
  );

  const filteredOffices = data.offices.filter((office) => filteredOfficeIds.has(office.id));
  const filteredAreaIds = new Set(filteredOffices.map((office) => office.areaId));
  const filteredAreas = data.summary.areas.filter((area) => filteredAreaIds.has(area.id));

  const filteredDevices = data.devices.filter((device) => {
    const matchesOffice = filteredOfficeIds.has(device.destinationOfficeId);
    const matchesStatus = filter.status && filter.status !== 'Todos' ? device.status === filter.status : true;
    return matchesOffice && matchesStatus;
  });

  const deviceCountByOffice = filteredDevices.reduce<Record<string, number>>((acc, device) => {
    acc[device.destinationOfficeId] = (acc[device.destinationOfficeId] ?? 0) + 1;
    return acc;
  }, {});

  const totals = {
    areas: filteredAreas.length,
    offices: filteredOffices.length,
    deviceTypes: data.deviceTypes.length,
    devices: filteredDevices.length,
    newDevices: filteredDevices.filter((device) => device.status === 'New').length,
    transferDevices: filteredDevices.filter((device) => device.status === 'Transfer').length,
  };

  const areas = filteredAreas.map((area) => ({
    ...area,
    officeCount: filteredOffices.filter((office) => office.areaId === area.id).length,
  }));

  const offices = filteredOffices.map((office) => ({
    ...office,
    deviceCount: deviceCountByOffice[office.id] ?? 0,
  }));

  const filteredBajas = data.bajas.filter((baja) =>
    filter.areaId ? baja.areaId === filter.areaId : filteredAreaIds.has(baja.areaId),
  );

  return {
    title: filter.title ?? 'Reporte general',
    filter,
    areas,
    offices,
    deviceTypes: data.deviceTypes,
    devices: filteredDevices,
    bajas: filteredBajas,
    totals,
  };
};

const buildAreaReports = (data: Awaited<ReturnType<typeof loadBaseData>>, areaId?: string): AreaReportResponse => {
  const filteredAreas = areaId ? data.summary.areas.filter((area) => area.id === areaId) : data.summary.areas;

  const reports: AreaReportItem[] = filteredAreas.map((area) => {
    const areaOfficeIds = data.offices.filter((office) => office.areaId === area.id).map((office) => office.id);
    const areaDevices = data.devices.filter((device) => areaOfficeIds.includes(device.destinationOfficeId));
    const areaBajas = data.bajas.filter((baja) => baja.areaId === area.id);

    const newDevices: AreaReportDeviceRow[] = areaDevices
      .filter((device) => device.status === 'New')
      .map((device) => {
        const type = data.deviceTypes.find((candidate) => candidate.id === device.typeId);
        const originOfficeName = device.originOfficeId ? data.offices.find((office) => office.id === device.originOfficeId)?.name : '';
        return {
          id: device.id,
          inventoryCode: device.inventoryCode,
          planCode: type?.planCode ?? device.typeId,
          description: type?.description ?? '',
          origin: device.originOfficeDescription ?? originOfficeName ?? '',
        };
      });

    const transferDevices: AreaReportDeviceRow[] = areaDevices
      .filter((device) => device.status === 'Transfer')
      .map((device) => {
        const type = data.deviceTypes.find((candidate) => candidate.id === device.typeId);
        const originOfficeName = device.originOfficeId ? data.offices.find((office) => office.id === device.originOfficeId)?.name : '';
        return {
          id: device.id,
          inventoryCode: device.inventoryCode,
          planCode: type?.planCode ?? device.typeId,
          description: type?.description ?? '',
          origin: device.originOfficeDescription ?? originOfficeName ?? '',
        };
      });

    const bajas: AreaReportBajaRow[] = areaBajas.map((baja) => ({
      id: baja.id,
      inventoryCode: baja.inventoryCode,
      description: baja.description,
      officeName: baja.officeName,
      origin: baja.origin,
      reason: baja.reason,
    }));

    return {
      area: { id: area.id, name: area.name },
      newDevices,
      transferDevices,
      bajas,
      totals: {
        newDevices: newDevices.length,
        transferDevices: transferDevices.length,
        bajas: bajas.length,
      },
    };
  });

  return { reports };
};

// Auth
export const login = async (email: string, password: string) => {
  const result = await supabase!.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data;
};

export const getProfile = async () => {
  const { data } = await supabase!.auth.getUser();
  return data;
};

// Areas
export const getAreas = async (): Promise<Area[]> => {
  const [areasResult, officesResult] = await Promise.all([
    supabase!.from('area').select('*').order('nombre', { ascending: true }),
    supabase!.from('oficina').select('areaId'),
  ]);
  if (areasResult.error) throw areasResult.error;
  if (officesResult.error) throw officesResult.error;

  const officeCountByArea = ((officesResult.data ?? []) as Pick<OfficeRow, 'areaId'>[])
    .reduce<Record<string, number>>((acc, row) => {
      const key = toId(row.areaId);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

  return ((areasResult.data ?? []) as AreaRow[]).map((row) =>
    mapArea(row, officeCountByArea[toId(row.id)] ?? 0),
  );
};

export const createArea = async (data: Partial<Area>) => {
  const payload = {
    nombre: data.name ?? '',
    planoUrl: null,
  };
  const { data: res, error } = await supabase!.from('area').insert([payload]).select().single();
  if (error) throw error;
  return mapArea(res as AreaRow);
};

export const updateArea = async (id: string, data: Partial<Area>) => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.nombre = data.name;
  const { data: res, error } = await supabase!.from('area').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return mapArea(res as AreaRow);
};

export const deleteArea = async (id: string) => {
  const { error } = await supabase!.from('area').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
};

// Offices
export const getOffices = async (): Promise<Office[]> => {
  const [officesResult, devicesResult] = await Promise.all([
    supabase!.from('oficina').select('*').order('nombre', { ascending: true }),
    supabase!.from('dispositivo').select('destinoId'),
  ]);
  if (officesResult.error) throw officesResult.error;
  if (devicesResult.error) throw devicesResult.error;

  const deviceCountByOffice = ((devicesResult.data ?? []) as Pick<DeviceRow, 'destinoId'>[])
    .reduce<Record<string, number>>((acc, row) => {
      const key = toId(row.destinoId);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

  return ((officesResult.data ?? []) as OfficeRow[]).map((row) =>
    mapOffice(row, deviceCountByOffice[toId(row.id)] ?? 0),
  );
};

export const createOffice = async (data: Partial<Office>) => {
  const payload = {
    nombre: data.name ?? '',
    piso: data.floor ?? 1,
    areaId: Number(data.areaId),
  };
  const { data: res, error } = await supabase!.from('oficina').insert([payload]).select().single();
  if (error) throw error;
  return mapOffice(res as OfficeRow);
};

export const updateOffice = async (id: string, data: Partial<Office>) => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.nombre = data.name;
  if (data.floor !== undefined) payload.piso = data.floor;
  if (data.areaId !== undefined) payload.areaId = Number(data.areaId);
  const { data: res, error } = await supabase!.from('oficina').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return mapOffice(res as OfficeRow);
};

export const deleteOffice = async (id: string) => {
  const { error } = await supabase!.from('oficina').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
};

// Device Types
export const getDeviceTypes = async (): Promise<DeviceType[]> => {
  const { data, error } = await supabase!.from('tipo_dispositivo').select('*').order('codigo', { ascending: true });
  if (error) throw error;
  return ((data as DeviceTypeRow[]) ?? []).map(mapDeviceType);
};

export const createDeviceType = async (data: Partial<DeviceType>) => {
  const codigo = data.planCode ?? data.id ?? '';
  const payload = {
    codigo,
    descripcion: data.description ?? '',
    caracteristicas: data.characteristics ?? null,
    marcaModelo: data.brandModel ?? null,
    imagenUrl: data.imageUrl ?? null,
    esTraslado: data.isTransfer ?? false,
  };
  const { data: res, error } = await supabase!.from('tipo_dispositivo').insert([payload]).select().single();
  if (error) throw error;
  return mapDeviceType(res as DeviceTypeRow);
};

export const updateDeviceType = async (id: string, data: Partial<DeviceType>) => {
  const payload: Record<string, unknown> = {};
  if (data.planCode !== undefined || data.id !== undefined) payload.codigo = data.planCode ?? data.id;
  if (data.description !== undefined) payload.descripcion = data.description;
  if (data.characteristics !== undefined) payload.caracteristicas = data.characteristics;
  if (data.brandModel !== undefined) payload.marcaModelo = data.brandModel;
  if (data.imageUrl !== undefined) payload.imagenUrl = data.imageUrl;
  if (data.isTransfer !== undefined) payload.esTraslado = data.isTransfer;
  const { data: res, error } = await supabase!.from('tipo_dispositivo').update(payload).eq('codigo', id).select().single();
  if (error) throw error;
  return mapDeviceType(res as DeviceTypeRow);
};

export const deleteDeviceType = async (id: string) => {
  const { error } = await supabase!.from('tipo_dispositivo').delete().eq('codigo', id);
  if (error) throw error;
  return { success: true };
};

// Devices (simple versions)
export const getDevicesList = async (page = 1, limit = 10): Promise<PaginatedDevicesResponse> => {
  const baseData = await loadBaseData();
  const totalCount = baseData.devices.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const start = (page - 1) * limit;
  const data = baseData.devices.slice(start, start + limit);

  return {
    data,
    totalCount,
    page,
    totalPages,
  };
};

export const createDevice = async (data: DeviceCreatePayload): Promise<DeviceCreateResponse> => {
  const inventoryCodes = data.inventoryCodes && data.inventoryCodes.length > 0 ? data.inventoryCodes : data.inventoryCode ? [data.inventoryCode] : [];
  const quantity = data.quantity ?? inventoryCodes.length ?? 1;
  const codes = inventoryCodes.length > 0 ? inventoryCodes : Array.from({ length: quantity }, () => data.inventoryCode ?? null).filter((value): value is string => Boolean(value));
  const estado: 'nuevo' | 'traslado' = data.originOfficeId || data.originOfficeDescription ? 'traslado' : 'nuevo';

  const payload = codes.map((code) => ({
    codigoInventario: code,
    tipoCodigo: data.typeId,
    estado,
    destinoId: Number(data.destinationOfficeId),
    origenId: data.originOfficeId ? Number(data.originOfficeId) : null,
    origenDescripcion: data.originOfficeDescription ?? null,
  }));

  const { data: res, error } = await supabase!.from('dispositivo').insert(payload).select('*');
  if (error) throw error;

  const baseData = await loadBaseData();
  const insertedDevices = ((res ?? []) as DeviceRow[]).map((row) => mapDevice(row, new Map(baseData.offices.map((office) => [office.id, office] as const))));

  return {
    message: 'created',
    created: insertedDevices.length,
    devices: insertedDevices,
  };
};

export const updateDevice = async (id: string, data: DeviceUpdatePayload): Promise<Device> => {
  const payload: Record<string, unknown> = {};
  if (data.inventoryCode !== undefined) payload.codigoInventario = data.inventoryCode;
  if (data.typeId !== undefined) payload.tipoCodigo = data.typeId;
  if (data.destinationOfficeId !== undefined) payload.destinoId = Number(data.destinationOfficeId);
  if (data.originOfficeId !== undefined) payload.origenId = Number(data.originOfficeId);
  if (data.originOfficeDescription !== undefined) payload.origenDescripcion = data.originOfficeDescription;
  if (data.originOfficeId !== undefined || data.originOfficeDescription !== undefined) payload.estado = 'traslado';

  const { data: res, error } = await supabase!.from('dispositivo').update(payload).eq('id', id).select('*').single();
  if (error) throw error;

  const baseData = await loadBaseData();
  return mapDevice(res as DeviceRow, new Map(baseData.offices.map((office) => [office.id, office] as const)));
};

export const deleteDevice = async (id: string) => {
  const { error } = await supabase!.from('dispositivo').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
};

// Bajas
export const getBajas = async (): Promise<Baja[]> => {
  const { data, error } = await supabase!.from('baja').select('*').order('id', { ascending: true });
  if (error) throw error;
  const rows = (data as BajaRow[]) ?? [];
  const areas = await getAreas();
  return rows.map((row) => ({
    id: toId(row.id),
    inventoryCode: row.codigoInventario ?? '',
    areaId: toId(row.areaId),
    areaName: areas.find((area) => area.id === toId(row.areaId))?.name ?? '',
    officeName: row.oficinaNombre ?? '',
    description: row.descripcion,
    origin: row.origen ?? '',
    reason: row.motivo ?? '',
  }));
};

export const createBaja = async (data: BajaCreatePayload) => {
  const payload = {
    codigoInventario: data.codigoInventario ?? null,
    areaId: Number(data.areaId),
    oficinaNombre: data.oficinaNombre ?? null,
    descripcion: data.descripcion,
    origen: data.origen ?? null,
    motivo: data.motivo ?? null,
  };
  const { data: res, error } = await supabase!.from('baja').insert([payload]).select('*').single();
  if (error) throw error;
  return {
    id: toId((res as BajaRow).id),
    inventoryCode: (res as BajaRow).codigoInventario ?? '',
    areaId: toId((res as BajaRow).areaId),
    areaName: '',
    officeName: (res as BajaRow).oficinaNombre ?? '',
    description: (res as BajaRow).descripcion,
    origin: (res as BajaRow).origen ?? '',
    reason: (res as BajaRow).motivo ?? '',
  } as Baja;
};

export const updateBaja = async (id: string, data: BajaUpdatePayload) => {
  const payload: Record<string, unknown> = {};
  if (data.codigoInventario !== undefined) payload.codigoInventario = data.codigoInventario;
  if (data.areaId !== undefined) payload.areaId = Number(data.areaId);
  if (data.oficinaNombre !== undefined) payload.oficinaNombre = data.oficinaNombre;
  if (data.descripcion !== undefined) payload.descripcion = data.descripcion;
  if (data.origen !== undefined) payload.origen = data.origen;
  if (data.motivo !== undefined) payload.motivo = data.motivo;

  const { data: res, error } = await supabase!.from('baja').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return {
    id: toId((res as BajaRow).id),
    inventoryCode: (res as BajaRow).codigoInventario ?? '',
    areaId: toId((res as BajaRow).areaId),
    areaName: '',
    officeName: (res as BajaRow).oficinaNombre ?? '',
    description: (res as BajaRow).descripcion,
    origin: (res as BajaRow).origen ?? '',
    reason: (res as BajaRow).motivo ?? '',
  } as Baja;
};

export const createBajas = async (items: BajaCreatePayload[]): Promise<void> => {
  const payloads = items.map((data) => ({
    codigoInventario: data.codigoInventario ?? null,
    areaId: Number(data.areaId),
    descripcion: data.descripcion,
    oficinaNombre: data.oficinaNombre ?? null,
    origen: data.origen ?? null,
    motivo: data.motivo ?? null,
  }));
  const { error } = await supabase!.from('baja').insert(payloads);
  if (error) throw error;
};

export const deleteBaja = async (id: string) => {
  const { error } = await supabase!.from('baja').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
};

// Reports (basic summaries)
export const getReportSummary = async (): Promise<ReportSummary> => {
  const data = await loadBaseData();
  return data.summary;
};

export const getReportBatch = async (reports: ReportBatchFilter[]): Promise<ReportBatchResponse> => {
  const data = await loadBaseData();
  const sourceFilters = reports.length > 0 ? reports : [{ title: 'Reporte general' } as ReportBatchFilter];
  return {
    reports: sourceFilters.map((filter) => filterSummary(data, filter)),
  };
};

export const getAreaReports = async (areaId?: string): Promise<AreaReportResponse> => {
  const data = await loadBaseData();
  return buildAreaReports(data, areaId);
};
