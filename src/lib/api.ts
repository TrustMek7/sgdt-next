import { supabase } from './supabase';
import {
  Area,
  Office,
  DeviceType,
  Device,
  Dependencia,
  Clasificacion,
  DeviceCreatePayload,
  DeviceCreateResponse,
  DeviceUpdatePayload,
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
  DeviceHistorialEntry,
  HistorialAccion,
  TrasladoRegistro,
} from './types';

// ─── Row types (DB shape) ─────────────────────────────────────────────────────

type DependenciaRow = {
  id: number; nombre: string; descripcion: string | null;
  createdAt: string; updatedAt: string;
};
type ClasificacionRow = {
  id: number; nombre: string; descripcion: string | null;
  createdAt: string; updatedAt: string;
};
type AreaRow = {
  id: number; nombre: string; planoUrl: string | null;
  dependenciaId: number | null; createdAt: string; updatedAt: string;
};
type OfficeRow = {
  id: number; nombre: string; piso: number; areaId: number;
  createdAt: string; updatedAt: string;
};
type DeviceTypeRow = {
  codigo: string; descripcion: string; caracteristicas: string | null;
  marcaModelo: string | null; imagenUrl: string | null; esTraslado: boolean;
  clasificacionId: number | null; createdAt: string; updatedAt: string;
};
type DeviceRow = {
  id: number; codigoInventario: string | null; tipoCodigo: string;
  estado: 'nuevo' | 'traslado'; destinoId: number | null;
  asignacion: 'asignado' | 'pendiente';
  origenId: number | null; origenDescripcion: string | null;
  tipoTraslado: string | null; destinoRedistribucion: string | null;
  createdAt: string; updatedAt: string;
};
type BajaRow = {
  id: number; codigoInventario: string | null; areaId: number;
  oficinaNombre: string | null; descripcion: string;
  origen: string | null; motivo: string | null;
  createdAt: string; updatedAt: string;
};

// ─── Mappers ──────────────────────────────────────────────────────────────────

const toId = (value: string | number) => String(value);

const mapDependencia = (row: DependenciaRow, subgerenciaCount = 0): Dependencia => ({
  id: toId(row.id),
  name: row.nombre,
  description: row.descripcion ?? undefined,
  subgerenciaCount,
});

const mapClasificacion = (row: ClasificacionRow, typeCount = 0): Clasificacion => ({
  id: toId(row.id),
  name: row.nombre,
  description: row.descripcion ?? undefined,
  typeCount,
});

const mapArea = (row: AreaRow, officeCount = 0): Area => ({
  id: toId(row.id),
  name: row.nombre,
  officeCount,
  dependenciaId: row.dependenciaId ? toId(row.dependenciaId) : undefined,
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
  clasificacionId: row.clasificacionId ? toId(row.clasificacionId) : undefined,
});

const mapDevice = (row: DeviceRow, officesById: Map<string, Office>): Device => ({
  id: toId(row.id),
  inventoryCode: row.codigoInventario ?? '',
  planCode: row.tipoCodigo,
  typeId: row.tipoCodigo,
  status: row.estado === 'traslado' ? 'Transfer' : 'New',
  floor: row.destinoId ? (officesById.get(toId(row.destinoId))?.floor ?? 0) : 0,
  destinationOfficeId: row.destinoId ? toId(row.destinoId) : '',
  originOfficeId: row.origenId ? toId(row.origenId) : undefined,
  originOfficeDescription: row.origenDescripcion ?? undefined,
  asignacion: row.asignacion ?? 'asignado',
  tipoTraslado: (row.tipoTraslado as 'permanente' | 'redistribuido' | null) ?? null,
  destinoRedistribucion: row.destinoRedistribucion ?? undefined,
});

// ─── Core data loader (single round-trip, 7 parallel queries) ────────────────

const loadBaseData = async () => {
  const [
    areasResult, officesResult, deviceTypesResult, devicesResult,
    bajasResult, dependenciasResult, clasificacionesResult, trasladosResult,
  ] = await Promise.all([
    supabase!.from('area').select('*').order('nombre', { ascending: true }),
    supabase!.from('oficina').select('*').order('nombre', { ascending: true }),
    supabase!.from('tipo_dispositivo').select('*').order('codigo', { ascending: true }),
    supabase!.from('dispositivo').select('*').order('id', { ascending: true }),
    supabase!.from('baja').select('*').order('id', { ascending: true }),
    supabase!.from('dependencia').select('*').order('nombre', { ascending: true }),
    supabase!.from('clasificacion').select('*').order('nombre', { ascending: true }),
    supabase!.from('registro_traslados').select('*').order('createdAt', { ascending: false }),
  ]);

  if (areasResult.error) throw areasResult.error;
  if (officesResult.error) throw officesResult.error;
  if (deviceTypesResult.error) throw deviceTypesResult.error;
  if (devicesResult.error) throw devicesResult.error;
  if (bajasResult.error) throw bajasResult.error;
  // New tables may not exist yet (migration pending) — degrade gracefully
  const rawDependencias = dependenciasResult.error ? [] : (dependenciasResult.data ?? []) as DependenciaRow[];
  const rawClasificaciones = clasificacionesResult.error ? [] : (clasificacionesResult.data ?? []) as ClasificacionRow[];
  const rawTrasladoRegistros = trasladosResult.error ? [] : (trasladosResult.data ?? []) as {
    id: number; dispositivoId: number; codigoInventario: string | null;
    origenOficinaId: number | null; origenOficinaNombre: string;
    destinoOficinaId: number | null; destinoOficinaNombre: string | null;
    accion: string; createdAt: string;
  }[];
  const trasladoRegistros: TrasladoRegistro[] = rawTrasladoRegistros.map((r) => ({
    id: String(r.id),
    dispositivoId: String(r.dispositivoId),
    codigoInventario: r.codigoInventario ?? undefined,
    origenOficinaId: r.origenOficinaId != null ? String(r.origenOficinaId) : undefined,
    origenOficinaNombre: r.origenOficinaNombre,
    destinoOficinaId: r.destinoOficinaId != null ? String(r.destinoOficinaId) : undefined,
    destinoOficinaNombre: r.destinoOficinaNombre ?? undefined,
    accion: r.accion as TrasladoRegistro['accion'],
    createdAt: r.createdAt,
  }));

  const rawAreas        = (areasResult.data ?? []) as AreaRow[];
  const rawOffices      = (officesResult.data ?? []) as OfficeRow[];
  const rawDeviceTypes  = (deviceTypesResult.data ?? []) as DeviceTypeRow[];
  const rawDevices      = (devicesResult.data ?? []) as DeviceRow[];
  const rawBajas        = (bajasResult.data ?? []) as BajaRow[];

  const offices         = rawOffices.map((o) => mapOffice(o));
  const officesById     = new Map(offices.map((o) => [o.id, o] as const));
  const deviceTypes     = rawDeviceTypes.map(mapDeviceType);
  const devices         = rawDevices.map((d) => mapDevice(d, officesById));

  const bajas: Baja[] = rawBajas.map((b) => ({
    id: toId(b.id),
    inventoryCode: b.codigoInventario ?? '',
    areaId: toId(b.areaId),
    areaName: rawAreas.find((a) => toId(a.id) === toId(b.areaId))?.nombre ?? '',
    officeName: b.oficinaNombre ?? '',
    description: b.descripcion,
    origin: b.origen ?? '',
    reason: b.motivo ?? '',
  }));

  // Counts
  const officeCountByArea = offices.reduce<Record<string, number>>((acc, o) => {
    acc[o.areaId] = (acc[o.areaId] ?? 0) + 1; return acc;
  }, {});
  const deviceCountByOffice = devices
    .filter((d) => d.asignacion === 'asignado' && d.destinationOfficeId)
    .reduce<Record<string, number>>((acc, d) => {
      acc[d.destinationOfficeId] = (acc[d.destinationOfficeId] ?? 0) + 1; return acc;
    }, {});
  const subgerenciaCountByDep = rawAreas.reduce<Record<string, number>>((acc, a) => {
    if (a.dependenciaId) { const k = toId(a.dependenciaId); acc[k] = (acc[k] ?? 0) + 1; }
    return acc;
  }, {});
  const typeCountByClasificacion = rawDeviceTypes.reduce<Record<string, number>>((acc, t) => {
    if (t.clasificacionId) { const k = toId(t.clasificacionId); acc[k] = (acc[k] ?? 0) + 1; }
    return acc;
  }, {});

  const areas           = rawAreas.map((a) => mapArea(a, officeCountByArea[toId(a.id)] ?? 0));
  const officesWithCounts = offices.map((o) => ({ ...o, deviceCount: deviceCountByOffice[o.id] ?? 0 }));
  const dependencias    = rawDependencias.map((d) => mapDependencia(d, subgerenciaCountByDep[toId(d.id)] ?? 0));
  const clasificaciones = rawClasificaciones.map((c) => mapClasificacion(c, typeCountByClasificacion[toId(c.id)] ?? 0));

  const summary: ReportSummary = {
    dependencias,
    areas,
    offices: officesWithCounts,
    deviceTypes,
    devices,
    clasificaciones,
    totals: {
      areas: areas.length,
      offices: officesWithCounts.length,
      deviceTypes: deviceTypes.length,
      devices: devices.length,
      newDevices: devices.filter((d) => d.status === 'New' && d.asignacion === 'asignado').length,
      transferDevices: devices.filter((d) => d.status === 'Transfer' && d.asignacion === 'asignado').length,
      asignados: devices.filter((d) => d.asignacion === 'asignado').length,
      pendientes: devices.filter((d) => d.asignacion === 'pendiente').length,
      bajas: rawBajas.length,
    },
  };

  return { rawAreas, offices: officesWithCounts, deviceTypes, devices, bajas, dependencias, clasificaciones, trasladoRegistros, summary };
};

// ─── Report filter (builds a ReportBatchItem from filters) ───────────────────

const filterSummary = (
  data: Awaited<ReturnType<typeof loadBaseData>>,
  filter: ReportBatchFilter,
): ReportBatchItem => {
  // Resolve which offices pass the filter
  const filteredOffices = data.offices.filter((office) => {
    const matchesFloor = filter.floor != null ? office.floor === filter.floor : true;

    // Area filter (subgerencia level)
    if (filter.areaId && office.areaId !== filter.areaId) return false;

    // Dependencia filter → resolve all subgerencia ids under it
    if (filter.dependenciaId) {
      const subIds = new Set(data.summary.areas.filter((a) => a.dependenciaId === filter.dependenciaId).map((a) => a.id));
      if (!subIds.has(office.areaId)) return false;
    }

    return matchesFloor;
  });

  const filteredOfficeIds = new Set(filteredOffices.map((o) => o.id));
  const filteredAreaIds   = new Set(filteredOffices.map((o) => o.areaId));
  const filteredAreas     = data.summary.areas.filter((a) => filteredAreaIds.has(a.id));

  const filteredDevices = data.devices.filter((device) => {
    if (device.asignacion !== 'asignado' || !device.destinationOfficeId) return false;
    if (!filteredOfficeIds.has(device.destinationOfficeId)) return false;
    if (filter.status && filter.status !== 'Todos' && device.status !== filter.status) return false;
    if (filter.clasificacionId) {
      const tipo = data.deviceTypes.find((t) => t.id === device.typeId);
      if (tipo?.clasificacionId !== filter.clasificacionId) return false;
    }
    return true;
  });

  const deviceCountByOffice = filteredDevices.reduce<Record<string, number>>((acc, d) => {
    acc[d.destinationOfficeId] = (acc[d.destinationOfficeId] ?? 0) + 1; return acc;
  }, {});

  const filteredBajas = data.bajas.filter((baja) =>
    filter.areaId ? baja.areaId === filter.areaId : filteredAreaIds.has(baja.areaId),
  );

  const filteredTrasladoRegistro = data.trasladoRegistros.filter(
    (t) => (t.origenOficinaId != null && filteredOfficeIds.has(t.origenOficinaId)) ||
           (t.destinoOficinaId != null && filteredOfficeIds.has(t.destinoOficinaId)),
  );

  // Resolved dependencias referenced by filtered areas
  const filteredDepIds = new Set(filteredAreas.map((a) => a.dependenciaId).filter(Boolean) as string[]);
  const filteredDependencias = data.dependencias.filter((d) => filteredDepIds.has(d.id));

  return {
    title: filter.title ?? 'Reporte general',
    filter,
    dependencias: filteredDependencias,
    areas: filteredAreas.map((a) => ({
      ...a,
      officeCount: filteredOffices.filter((o) => o.areaId === a.id).length,
    })),
    offices: filteredOffices.map((o) => ({ ...o, deviceCount: deviceCountByOffice[o.id] ?? 0 })),
    deviceTypes: data.deviceTypes,
    devices: filteredDevices,
    bajas: filteredBajas,
    trasladoRegistro: filteredTrasladoRegistro,
    clasificaciones: data.clasificaciones,
    totals: {
      areas: filteredAreas.length,
      offices: filteredOffices.length,
      deviceTypes: data.deviceTypes.length,
      devices: filteredDevices.length,
      newDevices: filteredDevices.filter((d) => d.status === 'New').length,
      transferDevices: filteredDevices.filter((d) => d.status === 'Transfer').length,
      asignados: filteredDevices.filter((d) => d.asignacion === 'asignado').length,
      pendientes: filteredDevices.filter((d) => d.asignacion === 'pendiente').length,
      bajas: filteredBajas.length,
    },
  };
};

const buildAreaReports = (data: Awaited<ReturnType<typeof loadBaseData>>, areaId?: string): AreaReportResponse => {
  const filteredAreas = areaId ? data.summary.areas.filter((a) => a.id === areaId) : data.summary.areas;

  const reports: AreaReportItem[] = filteredAreas.map((area) => {
    const areaOfficeIds = data.offices.filter((o) => o.areaId === area.id).map((o) => o.id);
    const areaDevices   = data.devices.filter((d) => d.asignacion === 'asignado' && areaOfficeIds.includes(d.destinationOfficeId));
    const areaBajas     = data.bajas.filter((b) => b.areaId === area.id);

    const mapDeviceRow = (device: typeof areaDevices[0]): AreaReportDeviceRow => {
      const type = data.deviceTypes.find((t) => t.id === device.typeId);
      const originOfficeName = device.originOfficeId ? data.offices.find((o) => o.id === device.originOfficeId)?.name : '';
      return {
        id: device.id,
        inventoryCode: device.inventoryCode,
        planCode: type?.planCode ?? device.typeId,
        description: type?.description ?? '',
        origin: device.originOfficeDescription ?? originOfficeName ?? '',
      };
    };

    const newDevices:      AreaReportDeviceRow[] = areaDevices.filter((d) => d.status === 'New').map(mapDeviceRow);
    const transferDevices: AreaReportDeviceRow[] = areaDevices.filter((d) => d.status === 'Transfer').map(mapDeviceRow);
    const bajas: AreaReportBajaRow[] = areaBajas.map((b) => ({
      id: b.id, inventoryCode: b.inventoryCode, description: b.description,
      officeName: b.officeName, origin: b.origin, reason: b.reason,
    }));

    return {
      area: { id: area.id, name: area.name },
      newDevices, transferDevices, bajas,
      totals: { newDevices: newDevices.length, transferDevices: transferDevices.length, bajas: bajas.length },
    };
  });

  return { reports };
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string) => {
  const result = await supabase!.auth.signInWithPassword({ email, password });
  if (result.error) throw result.error;
  return result.data;
};

export const getProfile = async () => {
  const { data } = await supabase!.auth.getUser();
  return data;
};

// ─── Dependencias ─────────────────────────────────────────────────────────────

export const getDependencias = async (): Promise<Dependencia[]> => {
  const [depResult, areasResult] = await Promise.all([
    supabase!.from('dependencia').select('*').order('nombre', { ascending: true }),
    supabase!.from('area').select('dependenciaId'),
  ]);
  if (depResult.error) return [];
  const countByDep = ((areasResult.data ?? []) as { dependenciaId: number | null }[])
    .reduce<Record<string, number>>((acc, r) => {
      if (r.dependenciaId) { const k = toId(r.dependenciaId); acc[k] = (acc[k] ?? 0) + 1; }
      return acc;
    }, {});
  return ((depResult.data ?? []) as DependenciaRow[]).map((r) => mapDependencia(r, countByDep[toId(r.id)] ?? 0));
};

export const createDependencia = async (data: { name: string; description?: string }): Promise<Dependencia> => {
  const { data: res, error } = await supabase!.from('dependencia')
    .insert([{ nombre: data.name, descripcion: data.description ?? null }]).select().single();
  if (error) throw error;
  return mapDependencia(res as DependenciaRow);
};

export const updateDependencia = async (id: string, data: { name?: string; description?: string }): Promise<Dependencia> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.nombre = data.name;
  if (data.description !== undefined) payload.descripcion = data.description;
  const { data: res, error } = await supabase!.from('dependencia').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return mapDependencia(res as DependenciaRow);
};

export const deleteDependencia = async (id: string) => {
  const { error } = await supabase!.from('dependencia').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
};

// ─── Clasificaciones ──────────────────────────────────────────────────────────

export const getClasificaciones = async (): Promise<Clasificacion[]> => {
  const [clResult, typesResult] = await Promise.all([
    supabase!.from('clasificacion').select('*').order('nombre', { ascending: true }),
    supabase!.from('tipo_dispositivo').select('clasificacionId'),
  ]);
  if (clResult.error) return [];
  const countByCl = ((typesResult.data ?? []) as { clasificacionId: number | null }[])
    .reduce<Record<string, number>>((acc, r) => {
      if (r.clasificacionId) { const k = toId(r.clasificacionId); acc[k] = (acc[k] ?? 0) + 1; }
      return acc;
    }, {});
  return ((clResult.data ?? []) as ClasificacionRow[]).map((r) => mapClasificacion(r, countByCl[toId(r.id)] ?? 0));
};

export const createClasificacion = async (data: { name: string; description?: string }): Promise<Clasificacion> => {
  const { data: res, error } = await supabase!.from('clasificacion')
    .insert([{ nombre: data.name, descripcion: data.description ?? null }]).select().single();
  if (error) throw error;
  return mapClasificacion(res as ClasificacionRow);
};

export const updateClasificacion = async (id: string, data: { name?: string; description?: string }): Promise<Clasificacion> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.nombre = data.name;
  if (data.description !== undefined) payload.descripcion = data.description;
  const { data: res, error } = await supabase!.from('clasificacion').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return mapClasificacion(res as ClasificacionRow);
};

export const deleteClasificacion = async (id: string) => {
  const { error } = await supabase!.from('clasificacion').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
};

// ─── Áreas (Subgerencias) ─────────────────────────────────────────────────────

export const getAreas = async (): Promise<Area[]> => {
  const [areasResult, officesResult] = await Promise.all([
    supabase!.from('area').select('*').order('nombre', { ascending: true }),
    supabase!.from('oficina').select('areaId'),
  ]);
  if (areasResult.error) throw areasResult.error;
  if (officesResult.error) throw officesResult.error;
  const officeCountByArea = ((officesResult.data ?? []) as Pick<OfficeRow, 'areaId'>[])
    .reduce<Record<string, number>>((acc, r) => {
      const k = toId(r.areaId); acc[k] = (acc[k] ?? 0) + 1; return acc;
    }, {});
  return ((areasResult.data ?? []) as AreaRow[]).map((r) => mapArea(r, officeCountByArea[toId(r.id)] ?? 0));
};

export const createArea = async (data: { name: string; dependenciaId?: string }): Promise<Area> => {
  const { data: res, error } = await supabase!.from('area')
    .insert([{ nombre: data.name, dependenciaId: data.dependenciaId ? Number(data.dependenciaId) : null, planoUrl: null }])
    .select().single();
  if (error) throw error;
  return mapArea(res as AreaRow);
};

export const updateArea = async (id: string, data: { name?: string; dependenciaId?: string | null }): Promise<Area> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.nombre = data.name;
  if (data.dependenciaId !== undefined) payload.dependenciaId = data.dependenciaId ? Number(data.dependenciaId) : null;
  const { data: res, error } = await supabase!.from('area').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return mapArea(res as AreaRow);
};

export const deleteArea = async (id: string) => {
  const { error } = await supabase!.from('area').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
};

// ─── Oficinas (Áreas físicas) ─────────────────────────────────────────────────

export const getOffices = async (): Promise<Office[]> => {
  const [officesResult, devicesResult] = await Promise.all([
    supabase!.from('oficina').select('*').order('nombre', { ascending: true }),
    supabase!.from('dispositivo').select('destinoId').eq('asignacion', 'asignado'),
  ]);
  if (officesResult.error) throw officesResult.error;
  const deviceCountByOffice = ((devicesResult.data ?? []) as Pick<DeviceRow, 'destinoId'>[])
    .reduce<Record<string, number>>((acc, r) => {
      if (r.destinoId) { const k = toId(r.destinoId); acc[k] = (acc[k] ?? 0) + 1; }
      return acc;
    }, {});
  return ((officesResult.data ?? []) as OfficeRow[]).map((r) => mapOffice(r, deviceCountByOffice[toId(r.id)] ?? 0));
};

export const createOffice = async (data: Partial<Office>): Promise<Office> => {
  const { data: res, error } = await supabase!.from('oficina')
    .insert([{ nombre: data.name ?? '', piso: data.floor ?? 1, areaId: Number(data.areaId) }])
    .select().single();
  if (error) throw error;
  return mapOffice(res as OfficeRow);
};

export const updateOffice = async (id: string, data: Partial<Office>): Promise<Office> => {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.nombre = data.name;
  if (data.floor !== undefined) payload.piso = data.floor;
  if (data.areaId !== undefined) payload.areaId = Number(data.areaId);
  const { data: res, error } = await supabase!.from('oficina').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return mapOffice(res as OfficeRow);
};

export const deleteOffice = async (id: string, deviceMode: 'unassign' | 'delete' = 'unassign') => {
  if (deviceMode === 'delete') {
    const { error: devErr } = await supabase!.from('dispositivo').delete().eq('destinoId', id);
    if (devErr) throw devErr;
  } else {
    const { error: devErr } = await supabase!.from('dispositivo')
      .update({ asignacion: 'pendiente', destinoId: null })
      .eq('destinoId', id);
    if (devErr) throw devErr;
  }
  const { error } = await supabase!.from('oficina').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
};

// ─── Tipos de dispositivo ─────────────────────────────────────────────────────

export const getDeviceTypes = async (): Promise<DeviceType[]> => {
  const { data, error } = await supabase!.from('tipo_dispositivo').select('*').order('codigo', { ascending: true });
  if (error) throw error;
  return ((data as DeviceTypeRow[]) ?? []).map(mapDeviceType);
};

export const createDeviceType = async (data: Partial<DeviceType>): Promise<DeviceType> => {
  const payload = {
    codigo: data.planCode ?? data.id ?? '',
    descripcion: data.description ?? '',
    caracteristicas: data.characteristics ?? null,
    marcaModelo: data.brandModel ?? null,
    imagenUrl: data.imageUrl ?? null,
    esTraslado: data.isTransfer ?? false,
    clasificacionId: data.clasificacionId ? Number(data.clasificacionId) : null,
  };
  const { data: res, error } = await supabase!.from('tipo_dispositivo').insert([payload]).select().single();
  if (error) throw error;
  return mapDeviceType(res as DeviceTypeRow);
};

export const updateDeviceType = async (id: string, data: Partial<DeviceType>): Promise<DeviceType> => {
  const payload: Record<string, unknown> = {};
  if (data.planCode !== undefined || data.id !== undefined) payload.codigo = data.planCode ?? data.id;
  if (data.description !== undefined) payload.descripcion = data.description;
  if (data.characteristics !== undefined) payload.caracteristicas = data.characteristics;
  if (data.brandModel !== undefined) payload.marcaModelo = data.brandModel;
  if (data.imageUrl !== undefined) payload.imagenUrl = data.imageUrl;
  if (data.isTransfer !== undefined) payload.esTraslado = data.isTransfer;
  if (data.clasificacionId !== undefined) payload.clasificacionId = data.clasificacionId ? Number(data.clasificacionId) : null;
  const { data: res, error } = await supabase!.from('tipo_dispositivo').update(payload).eq('codigo', id).select().single();
  if (error) throw error;
  return mapDeviceType(res as DeviceTypeRow);
};

export const deleteDeviceType = async (id: string) => {
  const { error } = await supabase!.from('tipo_dispositivo').delete().eq('codigo', id);
  if (error) throw error;
  return { success: true };
};

// ─── Dispositivos ─────────────────────────────────────────────────────────────

export const getDevicesList = async (): Promise<Device[]> => {
  const baseData = await loadBaseData();
  return baseData.devices;
};

export const getDevicesPage = async (page = 1, limit = 10): Promise<{ data: Device[]; total: number; page: number; limit: number }> => {
  const from = (Math.max(page, 1) - 1) * Math.max(limit, 1);
  const to = from + Math.max(limit, 1) - 1;
  const { data: rows, error, count } = await supabase!.from('dispositivo').select('*', { count: 'exact' }).range(from, to);
  if (error) throw error;
  const baseData = await loadBaseData();
  const officesById = new Map(baseData.offices.map((o) => [o.id, o] as const));
  const devices = ((rows ?? []) as DeviceRow[]).map((r) => mapDevice(r, officesById));
  return { data: devices, total: count ?? devices.length, page, limit };
};

export const getDeviceById = async (id: string): Promise<Device | null> => {
  const { data: row, error } = await supabase!.from('dispositivo').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!row) return null;
  const baseData = await loadBaseData();
  return mapDevice(row as DeviceRow, new Map(baseData.offices.map((o) => [o.id, o] as const)));
};

// ─── Historial ────────────────────────────────────────────────────────────────

const insertHistorial = async (dispositivoId: number, accion: HistorialAccion, detalle?: string) => {
  await supabase!.from('dispositivo_historial').insert([{ dispositivoId, accion, detalle: detalle ?? null }]);
};

const insertTrasladoRegistro = async (
  dispositivoId: number,
  codigoInventario: string | null,
  origen: { id: number | null; nombre: string },
  destino: { id: number | null; nombre: string },
  accion: 'reasignacion' | 'intercambio' | 'edicion',
) => {
  await supabase!.from('registro_traslados').insert([{
    dispositivoId,
    codigoInventario,
    origenOficinaId: origen.id,
    origenOficinaNombre: origen.nombre,
    destinoOficinaId: destino.id,
    destinoOficinaNombre: destino.nombre,
    accion,
  }]);
};

export const getDeviceHistory = async (id: string): Promise<DeviceHistorialEntry[]> => {
  const { data, error } = await supabase!
    .from('dispositivo_historial')
    .select('*')
    .eq('dispositivoId', Number(id))
    .order('createdAt', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as { id: number; dispositivoId: number; accion: string; detalle: string | null; createdAt: string }[]).map((r) => ({
    id: String(r.id),
    dispositivoId: String(r.dispositivoId),
    accion: r.accion as HistorialAccion,
    detalle: r.detalle ?? undefined,
    createdAt: r.createdAt,
  }));
};

export const getOfficeTrasladoRegistro = async (officeId: string): Promise<TrasladoRegistro[]> => {
  const id = Number(officeId);
  const { data, error } = await supabase!
    .from('registro_traslados')
    .select('*')
    .or(`origenOficinaId.eq.${id},destinoOficinaId.eq.${id}`)
    .order('createdAt', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as {
    id: number; dispositivoId: number; codigoInventario: string | null;
    origenOficinaId: number | null; origenOficinaNombre: string;
    destinoOficinaId: number | null; destinoOficinaNombre: string | null;
    accion: string; createdAt: string;
  }[]).map((r) => ({
    id: String(r.id),
    dispositivoId: String(r.dispositivoId),
    codigoInventario: r.codigoInventario ?? undefined,
    origenOficinaId: r.origenOficinaId != null ? String(r.origenOficinaId) : undefined,
    origenOficinaNombre: r.origenOficinaNombre,
    destinoOficinaId: r.destinoOficinaId != null ? String(r.destinoOficinaId) : undefined,
    destinoOficinaNombre: r.destinoOficinaNombre ?? undefined,
    accion: r.accion as TrasladoRegistro['accion'],
    createdAt: r.createdAt,
  }));
};

export const createDevice = async (data: DeviceCreatePayload): Promise<DeviceCreateResponse> => {
  const inventoryCodes = data.inventoryCodes?.length ? data.inventoryCodes : data.inventoryCode ? [data.inventoryCode] : [];
  const quantity = data.quantity ?? inventoryCodes.length ?? 1;
  const codes = inventoryCodes.length > 0
    ? inventoryCodes
    : Array.from({ length: quantity }, () => data.inventoryCode ?? null).filter((v): v is string => Boolean(v));
  const estado: 'nuevo' | 'traslado' = data.status === 'Transfer' ? 'traslado' : 'nuevo';

  const payload = codes.map((code) => ({
    codigoInventario: code,
    tipoCodigo: data.typeId,
    estado,
    destinoId: Number(data.destinationOfficeId),
    asignacion: 'asignado',
    origenId: data.originOfficeId ? Number(data.originOfficeId) : null,
    origenDescripcion: data.originOfficeDescription ?? null,
    tipoTraslado: data.tipoTraslado ?? null,
    destinoRedistribucion: data.destinoRedistribucion || null,
  }));

  const { data: res, error } = await supabase!.from('dispositivo').insert(payload).select('*');
  if (error) throw error;

  const baseData = await loadBaseData();
  const officesById = new Map(baseData.offices.map((o) => [o.id, o] as const));
  const insertedDevices = ((res ?? []) as DeviceRow[]).map((r) => mapDevice(r, officesById));

  const destOffice = baseData.offices.find((o) => o.id === data.destinationOfficeId);
  await Promise.all(
    insertedDevices.map((d) => insertHistorial(Number(d.id), 'creacion', `Asignado a ${destOffice?.name ?? data.destinationOfficeId}`))
  );

  return { message: 'created', created: insertedDevices.length, devices: insertedDevices };
};

export const updateDevice = async (id: string, data: DeviceUpdatePayload): Promise<Device> => {
  const payload: Record<string, unknown> = {};
  if (data.inventoryCode !== undefined) payload.codigoInventario = data.inventoryCode;
  if (data.typeId !== undefined) payload.tipoCodigo = data.typeId;
  if (data.destinationOfficeId !== undefined) payload.destinoId = data.destinationOfficeId ? Number(data.destinationOfficeId) : null;
  if (data.originOfficeId !== undefined) payload.origenId = Number(data.originOfficeId);
  if (data.originOfficeDescription !== undefined) payload.origenDescripcion = data.originOfficeDescription;
  if (data.asignacion !== undefined) payload.asignacion = data.asignacion;
  if (data.originOfficeId !== undefined || data.originOfficeDescription !== undefined) payload.estado = 'traslado';
  if (data.tipoTraslado !== undefined) payload.tipoTraslado = data.tipoTraslado ?? null;
  if (data.destinoRedistribucion !== undefined) payload.destinoRedistribucion = data.destinoRedistribucion || null;

  // Capturar oficina previa si va a cambiar el destino
  let prevDestino: { id: number | null; nombre: string } | null = null;
  if (data.destinationOfficeId !== undefined) {
    const { data: prev } = await supabase!.from('dispositivo')
      .select('destinoId, codigoInventario').eq('id', id).single();
    if (prev) {
      const prevRow = prev as { destinoId: number | null; codigoInventario: string | null };
      if (prevRow.destinoId && String(prevRow.destinoId) !== String(data.destinationOfficeId)) {
        const baseData = await loadBaseData();
        const prevOffice = baseData.offices.find((o) => o.id === String(prevRow.destinoId));
        prevDestino = { id: prevRow.destinoId, nombre: prevOffice?.name ?? String(prevRow.destinoId) };
      }
    }
  }

  const { data: res, error } = await supabase!.from('dispositivo').update(payload).eq('id', id).select('*').single();
  if (error) throw error;

  const baseData = await loadBaseData();
  const device = mapDevice(res as DeviceRow, new Map(baseData.offices.map((o) => [o.id, o] as const)));

  if (prevDestino && data.destinationOfficeId) {
    const newOffice = baseData.offices.find((o) => o.id === data.destinationOfficeId);
    const row = res as DeviceRow;
    await insertTrasladoRegistro(
      Number(id),
      row.codigoInventario ?? null,
      prevDestino,
      { id: Number(data.destinationOfficeId), nombre: newOffice?.name ?? data.destinationOfficeId },
      'edicion',
    );
  }

  return device;
};

export const unassignDevice = async (id: string): Promise<Device> => {
  const { data: prev } = await supabase!.from('dispositivo')
    .select('destinoId').eq('id', id).single();
  const prevRow = prev as { destinoId: number | null } | null;

  if (prevRow?.destinoId) {
    const baseData = await loadBaseData();
    const prevOffice = baseData.offices.find((o) => o.id === String(prevRow.destinoId));
    await insertHistorial(
      Number(id),
      'desasignacion',
      JSON.stringify({ oficinaId: prevRow.destinoId, oficinaNombre: prevOffice?.name ?? String(prevRow.destinoId) }),
    );
  }

  const { data: res, error } = await supabase!.from('dispositivo')
    .update({ asignacion: 'pendiente', destinoId: null })
    .eq('id', id).select('*').single();
  if (error) throw error;
  const baseData = await loadBaseData();
  return mapDevice(res as DeviceRow, new Map(baseData.offices.map((o) => [o.id, o] as const)));
};

export const reassignDevice = async (id: string, destinationOfficeId: string): Promise<Device> => {
  const { data: res, error } = await supabase!.from('dispositivo')
    .update({ asignacion: 'asignado', destinoId: Number(destinationOfficeId) })
    .eq('id', id).select('*').single();
  if (error) throw error;

  const baseData = await loadBaseData();
  const office = baseData.offices.find((o) => o.id === destinationOfficeId);
  await insertHistorial(Number(id), 'reasignacion', `Reasignado a ${office?.name ?? destinationOfficeId}`);

  // Recuperar la oficina de origen desde la última entrada 'desasignacion' del historial
  const { data: histRows } = await supabase!
    .from('dispositivo_historial')
    .select('accion, detalle')
    .eq('dispositivoId', Number(id))
    .order('createdAt', { ascending: false })
    .limit(2); // la 'reasignacion' que acabamos de insertar + la 'desasignacion' previa

  const histList = (histRows ?? []) as { accion: string; detalle: string | null }[];
  const desEntry = histList.find((h) => h.accion === 'desasignacion');
  if (desEntry?.detalle) {
    try {
      const parsed = JSON.parse(desEntry.detalle) as { oficinaId: number; oficinaNombre: string };
      const row = res as DeviceRow;
      await insertTrasladoRegistro(
        Number(id),
        row.codigoInventario ?? null,
        { id: parsed.oficinaId, nombre: parsed.oficinaNombre },
        { id: Number(destinationOfficeId), nombre: office?.name ?? destinationOfficeId },
        'reasignacion',
      );
    } catch { /* JSON parse falló, omitir */ }
  }

  return mapDevice(res as DeviceRow, new Map(baseData.offices.map((o) => [o.id, o] as const)));
};

export const swapDevices = async (idA: string, idB: string): Promise<void> => {
  const { data, error } = await supabase!.from('dispositivo')
    .select('id, destinoId, codigoInventario').in('id', [Number(idA), Number(idB)]);
  if (error) throw error;
  if (!data || data.length !== 2) throw new Error('No se encontraron ambos dispositivos');

  const [a, b] = data as { id: number; destinoId: number | null; codigoInventario: string | null }[];
  await Promise.all([
    supabase!.from('dispositivo').update({ destinoId: b.destinoId, asignacion: b.destinoId ? 'asignado' : 'pendiente' }).eq('id', a.id),
    supabase!.from('dispositivo').update({ destinoId: a.destinoId, asignacion: a.destinoId ? 'asignado' : 'pendiente' }).eq('id', b.id),
  ]);

  const baseData = await loadBaseData();
  const officeA = a.destinoId ? baseData.offices.find((o) => o.id === String(a.destinoId)) : null;
  const officeB = b.destinoId ? baseData.offices.find((o) => o.id === String(b.destinoId)) : null;
  await Promise.all([
    insertHistorial(a.id, 'intercambio', `Intercambiado con dispositivo ${b.id} → ${officeB?.name ?? '—'}`),
    insertHistorial(b.id, 'intercambio', `Intercambiado con dispositivo ${a.id} → ${officeA?.name ?? '—'}`),
    ...(a.destinoId && b.destinoId ? [
      insertTrasladoRegistro(a.id, a.codigoInventario ?? null,
        { id: a.destinoId, nombre: officeA?.name ?? String(a.destinoId) },
        { id: b.destinoId, nombre: officeB?.name ?? String(b.destinoId) },
        'intercambio'),
      insertTrasladoRegistro(b.id, b.codigoInventario ?? null,
        { id: b.destinoId, nombre: officeB?.name ?? String(b.destinoId) },
        { id: a.destinoId, nombre: officeA?.name ?? String(a.destinoId) },
        'intercambio'),
    ] : []),
  ]);
};

export const deleteDevice = async (id: string) => {
  const { error } = await supabase!.from('dispositivo').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
};

export const retireDevice = async (id: string, motivo: string): Promise<void> => {
  const { data: deviceRow, error: devErr } = await supabase!
    .from('dispositivo')
    .select('codigoInventario, tipoCodigo, destinoId, origenDescripcion')
    .eq('id', id)
    .single();
  if (devErr) throw devErr;

  const dev = deviceRow as Pick<DeviceRow, 'codigoInventario' | 'tipoCodigo' | 'destinoId' | 'origenDescripcion'>;

  const [typeResult, officeResult] = await Promise.all([
    supabase!.from('tipo_dispositivo').select('descripcion').eq('codigo', dev.tipoCodigo).single(),
    dev.destinoId
      ? supabase!.from('oficina').select('nombre, areaId').eq('id', dev.destinoId).single()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (typeResult.error) throw typeResult.error;
  if (officeResult.error) throw officeResult.error;

  const tipo = typeResult.data as { descripcion: string };
  const office = officeResult.data as { nombre: string; areaId: number } | null;

  if (!office) throw new Error('El dispositivo debe estar asignado a una oficina para dar de baja');

  await supabase!.from('baja').insert([{
    codigoInventario: dev.codigoInventario ?? null,
    areaId: office.areaId,
    descripcion: tipo.descripcion,
    oficinaNombre: office.nombre,
    origen: dev.origenDescripcion ?? null,
    motivo,
  }]);

  await insertHistorial(Number(id), 'baja', `Dado de baja: ${motivo}`);

  const { error: delErr } = await supabase!.from('dispositivo').delete().eq('id', id);
  if (delErr) throw delErr;
};

// ─── Bajas ────────────────────────────────────────────────────────────────────

export const getBajas = async (): Promise<Baja[]> => {
  const { data, error } = await supabase!.from('baja').select('*').order('id', { ascending: true });
  if (error) throw error;
  const rows = (data as BajaRow[]) ?? [];
  const areas = await getAreas();
  return rows.map((r) => ({
    id: toId(r.id),
    inventoryCode: r.codigoInventario ?? '',
    areaId: toId(r.areaId),
    areaName: areas.find((a) => a.id === toId(r.areaId))?.name ?? '',
    officeName: r.oficinaNombre ?? '',
    description: r.descripcion,
    origin: r.origen ?? '',
    reason: r.motivo ?? '',
  }));
};

export const createBaja = async (data: BajaCreatePayload): Promise<Baja> => {
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
  const r = res as BajaRow;
  return { id: toId(r.id), inventoryCode: r.codigoInventario ?? '', areaId: toId(r.areaId), areaName: '', officeName: r.oficinaNombre ?? '', description: r.descripcion, origin: r.origen ?? '', reason: r.motivo ?? '' };
};

export const updateBaja = async (id: string, data: BajaUpdatePayload): Promise<Baja> => {
  const payload: Record<string, unknown> = {};
  if (data.codigoInventario !== undefined) payload.codigoInventario = data.codigoInventario;
  if (data.areaId !== undefined) payload.areaId = Number(data.areaId);
  if (data.oficinaNombre !== undefined) payload.oficinaNombre = data.oficinaNombre;
  if (data.descripcion !== undefined) payload.descripcion = data.descripcion;
  if (data.origen !== undefined) payload.origen = data.origen;
  if (data.motivo !== undefined) payload.motivo = data.motivo;
  const { data: res, error } = await supabase!.from('baja').update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  const r = res as BajaRow;
  return { id: toId(r.id), inventoryCode: r.codigoInventario ?? '', areaId: toId(r.areaId), areaName: '', officeName: r.oficinaNombre ?? '', description: r.descripcion, origin: r.origen ?? '', reason: r.motivo ?? '' };
};

export const createBajas = async (items: BajaCreatePayload[]): Promise<void> => {
  const payloads = items.map((d) => ({
    codigoInventario: d.codigoInventario ?? null,
    areaId: Number(d.areaId),
    descripcion: d.descripcion,
    oficinaNombre: d.oficinaNombre ?? null,
    origen: d.origen ?? null,
    motivo: d.motivo ?? null,
  }));
  const { error } = await supabase!.from('baja').insert(payloads);
  if (error) throw error;
};

export const deleteBaja = async (id: string) => {
  const { error } = await supabase!.from('baja').delete().eq('id', id);
  if (error) throw error;
  return { success: true };
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const getReportSummary = async (): Promise<ReportSummary> => {
  const data = await loadBaseData();
  return data.summary;
};

export const getReportBatch = async (reports: ReportBatchFilter[]): Promise<ReportBatchResponse> => {
  const data = await loadBaseData();
  const sourceFilters = reports.length > 0 ? reports : [{ title: 'Reporte general' } as ReportBatchFilter];
  return { reports: sourceFilters.map((f) => filterSummary(data, f)) };
};

export const getAreaReports = async (areaId?: string): Promise<AreaReportResponse> => {
  const data = await loadBaseData();
  return buildAreaReports(data, areaId);
};
