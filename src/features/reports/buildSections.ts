import type { ReportBatchItem, ReportGroupBy, Device, DeviceType, Clasificacion } from '../../lib/types';
import type { ReportSection } from './types';

export function isElectronicsClasif(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes('electrónico') || n.includes('electronico');
}

export function aggregateByType(
  items: { device: Device; type: DeviceType }[],
): { type: DeviceType; count: number }[] {
  const map = new Map<string, { type: DeviceType; count: number }>();
  for (const { type } of items) {
    if (!map.has(type.id)) map.set(type.id, { type, count: 0 });
    map.get(type.id)!.count++;
  }
  return [...map.values()];
}

export function groupByClasif(
  items: { device: Device; type: DeviceType }[],
  clasificaciones: Clasificacion[],
): { name: string; items: { device: Device; type: DeviceType }[] }[] {
  const groups = new Map<string, { name: string; items: { device: Device; type: DeviceType }[] }>();
  for (const item of items) {
    const cid = item.type.clasificacionId ?? '__sin__';
    if (!groups.has(cid)) {
      const name = clasificaciones.find((c) => c.id === cid)?.name ?? 'Sin clasificación';
      groups.set(cid, { name, items: [] });
    }
    groups.get(cid)!.items.push(item);
  }
  return [...groups.values()];
}

export function buildReportSections(report: ReportBatchItem, groupBy: ReportGroupBy): ReportSection[] {
  const getType = (d: Device) => report.deviceTypes.find((t) => t.id === d.typeId);
  const traslados = report.trasladoRegistro ?? [];
  const scopedOffices = report.filter?.officeId
    ? report.offices.filter((o) => o.id === report.filter!.officeId)
    : report.offices;

  const makeSection = (
    label: string,
    sublabel: string | undefined,
    officeIds: string[],
    areaIds: string[],
  ): ReportSection | null => {
    const officeSet = new Set(officeIds);
    const areaSet   = new Set(areaIds);
    const officeDevices = report.devices.filter(
      (d) => d.asignacion === 'asignado' && d.destinationOfficeId && officeSet.has(d.destinationOfficeId),
    );
    const newDevices = officeDevices
      .filter((d) => d.status === 'New')
      .map((d) => ({ device: d, type: getType(d) }))
      .filter((x): x is { device: Device; type: DeviceType } => Boolean(x.type));
    const allTransfer = officeDevices
      .filter((d) => d.status === 'Transfer')
      .map((d) => ({ device: d, type: getType(d) }))
      .filter((x): x is { device: Device; type: DeviceType } => Boolean(x.type));
    const transferDevices      = allTransfer.filter((x) => x.device.tipoTraslado !== 'redistribuido');
    const transferRedistribuido = allTransfer.filter((x) => x.device.tipoTraslado === 'redistribuido');
    const salidas = traslados.filter((t) => t.origenOficinaId != null && officeSet.has(t.origenOficinaId));
    const entradas = traslados.filter((t) => t.destinoOficinaId != null && officeSet.has(t.destinoOficinaId));
    const bajas    = report.bajas.filter((b) => areaSet.has(b.areaId));
    if (!newDevices.length && !allTransfer.length && !salidas.length && !entradas.length && !bajas.length) return null;
    return { label, sublabel, newDevices, transferDevices, transferRedistribuido, salidas, entradas, bajas };
  };

  switch (groupBy) {
    case 'dependencia': {
      const depMap = new Map<string, { name: string; areaIds: string[] }>();
      for (const dep of report.dependencias) depMap.set(dep.id, { name: dep.name, areaIds: [] });
      for (const area of report.areas) {
        if (area.dependenciaId && depMap.has(area.dependenciaId))
          depMap.get(area.dependenciaId)!.areaIds.push(area.id);
      }
      const result: ReportSection[] = [];
      for (const dep of depMap.values()) {
        const officeIds = scopedOffices.filter((o) => dep.areaIds.includes(o.areaId)).map((o) => o.id);
        const s = makeSection(dep.name, undefined, officeIds, dep.areaIds);
        if (s) result.push(s);
      }
      return result;
    }

    case 'subgerencia': {
      return report.areas
        .map((area) => {
          const officeIds = scopedOffices.filter((o) => o.areaId === area.id).map((o) => o.id);
          return makeSection(area.name, undefined, officeIds, [area.id]);
        })
        .filter(Boolean) as ReportSection[];
    }

    case 'piso': {
      const floors = [...new Set(scopedOffices.map((o) => o.floor))].sort((a, b) => a - b);
      const result: ReportSection[] = [];
      for (const floor of floors) {
        for (const office of scopedOffices.filter((o) => o.floor === floor)) {
          const area     = report.areas.find((a) => a.id === office.areaId);
          const sublabel = area ? `(${area.name}) — Piso ${floor}` : `Piso ${floor}`;
          const s = makeSection(office.name, sublabel, [office.id], office.areaId ? [office.areaId] : []);
          if (s) result.push(s);
        }
      }
      return result;
    }

    case 'area': {
      return scopedOffices
        .map((office) => {
          const area     = report.areas.find((a) => a.id === office.areaId);
          const sublabel = area ? `(${area.name}) — Piso ${office.floor}` : `Piso ${office.floor}`;
          return makeSection(office.name, sublabel, [office.id], []);
        })
        .filter(Boolean) as ReportSection[];
    }

    default:
      return [];
  }
}
