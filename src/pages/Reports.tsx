'use client';

import React, { useState } from 'react';
import { FileText, Download, Table } from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image as PDFImage, type ViewProps } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { useReports } from '../hooks/useReports';
import { reportService } from '../services/reportService';
import { ReportBatchFilter, ReportBatchItem, ReportGroupBy, DeviceType, Device, Baja, TrasladoRegistro } from '../lib/types';

type DownloadLinkProps = {
  document: React.ReactElement;
  fileName: string;
  children?: React.ReactNode;
};
const DownloadLink = PDFDownloadLink as React.ComponentType<DownloadLinkProps>;

// ─── PDF styles ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page:          { padding: 28, fontSize: 9, fontFamily: 'Helvetica' },
  header:        { borderBottom: '1pt solid #000', paddingBottom: 8, marginBottom: 14, textAlign: 'center' },
  title:         { fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
  subtitle:      { fontSize: 10, marginBottom: 2 },
  date:          { color: '#666', fontSize: 8 },

  sectionTitle:    { fontSize: 10, fontWeight: 'bold', backgroundColor: '#E8EDF2', padding: '4 6', marginTop: 10, marginBottom: 4 },
  subsectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#555', padding: '2 6', marginTop: 6, marginBottom: 3 },
  areaTitle:       { fontSize: 12, fontWeight: 'bold', backgroundColor: '#D0D8E4', padding: '5 8', marginTop: 14, marginBottom: 4 },
  sublabel:        { fontSize: 8, color: '#666', marginTop: -3, marginBottom: 6, padding: '0 8' },
  summaryBox:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  summaryItem:   { flex: 1, border: '1pt solid #ccc', padding: '4 6', borderRadius: 3 },
  summaryLabel:  { fontSize: 7, color: '#666', marginBottom: 1 },
  summaryValue:  { fontSize: 11, fontWeight: 'bold' },

  table:         { border: '1pt solid #ccc', marginBottom: 6 },
  headerRow:     { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottom: '1pt solid #ccc' },
  row:           { flexDirection: 'row', borderBottom: '0.5pt solid #eee' },
  cell:          { paddingHorizontal: 5, paddingVertical: 3, borderRight: '0.5pt solid #eee' },
  cellText:      { fontSize: 8, lineHeight: 1.3 },
  headerText:    { fontSize: 8, fontWeight: 'bold' },

  colCode:       { width: '14%' },
  colPlan:       { width: '10%' },
  colDesc:       { width: '22%' },
  colChar:       { width: '22%' },
  colBrand:      { width: '18%' },
  colImg:        { width: '14%', borderRight: 0, alignItems: 'center', justifyContent: 'center' },

  colTrasCode:   { width: '15%' },
  colTrasOffice: { width: '35%' },
  colTrasAccion: { width: '20%' },
  colTrasDate:   { width: '30%', borderRight: 0 },

  colBajaSub:    { width: '15%' },
  colBajaCode:   { width: '12%' },
  colBajaDesc:   { width: '28%' },
  colBajaOfi:    { width: '15%' },
  colBajaOrig:   { width: '15%' },
  colBajaMotiv:  { width: '15%', borderRight: 0 },

  noData:        { padding: '6 8', color: '#999', fontSize: 8 },
  signatures:    { marginTop: 40, flexDirection: 'row', justifyContent: 'space-around' },
  signLine:      { borderBottom: '1pt solid #000', width: 140, marginBottom: 4 },
  signText:      { textAlign: 'center', fontSize: 8 },
  officeSubTitle: { fontSize: 9, fontWeight: 'bold', backgroundColor: '#EEF2F7', padding: '3 6', marginTop: 10, marginBottom: 2, borderLeft: '3pt solid #4B7AB1' },
  obsBox:        { marginTop: 20, borderTop: '0.5pt solid #ccc', paddingTop: 8 },
  obsLines:      { marginTop: 6, height: 50, border: '0.5pt solid #ccc' },
});

// ─── PDF helpers ──────────────────────────────────────────────────────────────

function TableHeader({ cols }: { cols: { label: string; style?: ViewProps['style'] }[] }) {
  return (
    <View style={S.headerRow} minPresenceAhead={60}>
      {cols.map((c, i) => (
        <View
          key={i}
          style={c.style ? ({ ...(S.cell as object), ...(c.style as object) } as ViewProps['style']) : (S.cell as ViewProps['style'])}
        >
          <Text style={S.headerText}>{c.label}</Text>
        </View>
      ))}
    </View>
  );
}

function DeviceImageCell({ url, baseUrl }: { url?: string; baseUrl: string }) {
  if (!url) return <View style={[S.cell, S.colImg]}><Text style={S.cellText}>-</Text></View>;
  const src = url.startsWith('http') ? url : `${baseUrl}${url}`;
  return (
    <View style={[S.cell, S.colImg]}>
      <PDFImage src={src} style={{ width: 32, height: 32, objectFit: 'contain' }} />
    </View>
  );
}

// ─── Section builder ──────────────────────────────────────────────────────────

type ReportSubSection = {
  label: string;
  newDevices: { device: Device; type: DeviceType }[];
  transferDevices: { device: Device; type: DeviceType }[];
  salidas: TrasladoRegistro[];
  entradas: TrasladoRegistro[];
};

type ReportSection = {
  label: string;
  sublabel?: string;
  newDevices: { device: Device; type: DeviceType }[];
  transferDevices: { device: Device; type: DeviceType }[];
  salidas: TrasladoRegistro[];
  entradas: TrasladoRegistro[];
  bajas: Baja[];
  subSections?: ReportSubSection[];
};

function buildReportSections(report: ReportBatchItem, groupBy: ReportGroupBy): ReportSection[] {
  const getType = (d: Device) => report.deviceTypes.find((t) => t.id === d.typeId);
  const traslados = report.trasladoRegistro ?? [];

  const makeSection = (
    label: string,
    sublabel: string | undefined,
    officeIds: string[],
    areaIds: string[],
  ): ReportSection | null => {
    const officeSet = new Set(officeIds);
    const areaSet = new Set(areaIds);
    const officeDevices = report.devices.filter(
      (d) => d.asignacion === 'asignado' && d.destinationOfficeId && officeSet.has(d.destinationOfficeId),
    );
    const newDevices = officeDevices
      .filter((d) => d.status === 'New')
      .map((d) => ({ device: d, type: getType(d) }))
      .filter((x): x is { device: Device; type: DeviceType } => Boolean(x.type));
    const transferDevices = officeDevices
      .filter((d) => d.status === 'Transfer')
      .map((d) => ({ device: d, type: getType(d) }))
      .filter((x): x is { device: Device; type: DeviceType } => Boolean(x.type));
    const salidas = traslados.filter((t) => t.origenOficinaId != null && officeSet.has(t.origenOficinaId));
    const entradas = traslados.filter((t) => t.destinoOficinaId != null && officeSet.has(t.destinoOficinaId));
    const bajas = report.bajas.filter((b) => areaSet.has(b.areaId));
    if (!newDevices.length && !transferDevices.length && !salidas.length && !entradas.length && !bajas.length) return null;
    return { label, sublabel, newDevices, transferDevices, salidas, entradas, bajas };
  };

  switch (groupBy) {
    case 'dependencia': {
      const depMap = new Map<string, { name: string; areaIds: string[] }>();
      for (const dep of report.dependencias) depMap.set(dep.id, { name: dep.name, areaIds: [] });
      for (const area of report.areas) {
        if (area.dependenciaId && depMap.has(area.dependenciaId)) {
          depMap.get(area.dependenciaId)!.areaIds.push(area.id);
        }
      }
      const result: ReportSection[] = [];
      for (const dep of depMap.values()) {
        const officeIds = report.offices.filter((o) => dep.areaIds.includes(o.areaId)).map((o) => o.id);
        const s = makeSection(dep.name, undefined, officeIds, dep.areaIds);
        if (s) result.push(s);
      }
      return result;
    }

    case 'subgerencia': {
      return report.areas
        .map((area) => {
          const officeIds = report.offices.filter((o) => o.areaId === area.id).map((o) => o.id);
          return makeSection(area.name, undefined, officeIds, [area.id]);
        })
        .filter(Boolean) as ReportSection[];
    }

    case 'piso': {
      const floors = [...new Set(report.offices.map((o) => o.floor))].sort((a, b) => a - b);
      const result: ReportSection[] = [];
      for (const floor of floors) {
        for (const office of report.offices.filter((o) => o.floor === floor)) {
          const area = report.areas.find((a) => a.id === office.areaId);
          const sublabel = area ? `(${area.name}) — Piso ${floor}` : `Piso ${floor}`;
          const s = makeSection(office.name, sublabel, [office.id], office.areaId ? [office.areaId] : []);
          if (s) result.push(s);
        }
      }
      return result;
    }

    case 'area': {
      // Group by subgerencia; each office is a sub-section; bajas shown once per subgerencia
      const byArea = new Map<string, { areaId: string; offices: typeof report.offices }>();
      for (const office of report.offices) {
        const key = office.areaId || '__none__';
        if (!byArea.has(key)) byArea.set(key, { areaId: office.areaId, offices: [] });
        byArea.get(key)!.offices.push(office);
      }
      const result: ReportSection[] = [];
      for (const { areaId, offices } of byArea.values()) {
        const parentArea = report.areas.find((a) => a.id === areaId);
        const bajasForArea = report.bajas.filter((b) => b.areaId === areaId);

        const subSections: ReportSubSection[] = offices.flatMap((office) => {
          const officeSet = new Set([office.id]);
          const officeDevices = report.devices.filter(
            (d) => d.asignacion === 'asignado' && d.destinationOfficeId && officeSet.has(d.destinationOfficeId),
          );
          const newDevices = officeDevices
            .filter((d) => d.status === 'New')
            .map((d) => ({ device: d, type: getType(d) }))
            .filter((x): x is { device: Device; type: DeviceType } => Boolean(x.type));
          const transferDevices = officeDevices
            .filter((d) => d.status === 'Transfer')
            .map((d) => ({ device: d, type: getType(d) }))
            .filter((x): x is { device: Device; type: DeviceType } => Boolean(x.type));
          const salidas = traslados.filter((t) => t.origenOficinaId === office.id);
          const entradas = traslados.filter((t) => t.destinoOficinaId === office.id);
          if (!newDevices.length && !transferDevices.length && !salidas.length && !entradas.length) return [];
          return [{ label: `${office.name} — Piso ${office.floor}`, newDevices, transferDevices, salidas, entradas }];
        });

        if (!subSections.length && !bajasForArea.length) continue;
        result.push({
          label: parentArea?.name ?? 'Sin subgerencia',
          sublabel: undefined,
          newDevices: [], transferDevices: [], salidas: [], entradas: [],
          bajas: bajasForArea,
          subSections,
        });
      }
      return result;
    }

    default:
      return [];
  }
}

// ─── PDF shared device/traslado renderer ─────────────────────────────────────

function SectionDevicesPDF({ newDevices, transferDevices, salidas, entradas, baseUrl }: {
  newDevices: { device: Device; type: DeviceType }[];
  transferDevices: { device: Device; type: DeviceType }[];
  salidas: TrasladoRegistro[];
  entradas: TrasladoRegistro[];
  baseUrl: string;
}) {
  return (
    <>
      <Text style={S.sectionTitle}>DISPOSITIVOS NUEVOS ({newDevices.length})</Text>
      {newDevices.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
        <View style={S.table}>
          <TableHeader cols={[
            { label: 'INVENTARIO', style: S.colCode }, { label: 'PLAN', style: S.colPlan },
            { label: 'DESCRIPCIÓN', style: S.colDesc }, { label: 'CARACTERÍSTICAS', style: S.colChar },
            { label: 'MARCA / MODELO', style: S.colBrand }, { label: 'IMAGEN', style: S.colImg },
          ]} />
          {newDevices.map(({ device, type }, i) => (
            <View key={i} style={S.row} wrap={false}>
              <View style={[S.cell, S.colCode]}><Text style={S.cellText}>{device.inventoryCode || 'S/C'}</Text></View>
              <View style={[S.cell, S.colPlan]}><Text style={S.cellText}>{type.planCode}</Text></View>
              <View style={[S.cell, S.colDesc]}><Text style={S.cellText}>{type.description}</Text></View>
              <View style={[S.cell, S.colChar]}><Text style={S.cellText}>{type.characteristics || '-'}</Text></View>
              <View style={[S.cell, S.colBrand]}><Text style={S.cellText}>{type.brandModel || '-'}</Text></View>
              <DeviceImageCell url={type.imageUrl} baseUrl={baseUrl} />
            </View>
          ))}
        </View>
      )}

      <Text style={S.sectionTitle}>DISPOSITIVOS DE TRASLADO ({transferDevices.length})</Text>
      {transferDevices.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
        <View style={S.table}>
          <TableHeader cols={[
            { label: 'INVENTARIO', style: S.colCode }, { label: 'PLAN', style: S.colPlan },
            { label: 'DESCRIPCIÓN', style: { width: '38%' } }, { label: 'ORIGEN', style: { width: '38%' } },
          ]} />
          {transferDevices.map(({ device, type }, i) => (
            <View key={i} style={S.row} wrap={false}>
              <View style={[S.cell, S.colCode]}><Text style={S.cellText}>{device.inventoryCode || 'S/C'}</Text></View>
              <View style={[S.cell, S.colPlan]}><Text style={S.cellText}>{type.planCode}</Text></View>
              <View style={[S.cell, { width: '38%' }]}><Text style={S.cellText}>{type.description}</Text></View>
              <View style={[S.cell, { width: '38%' }]}><Text style={S.cellText}>{device.originOfficeDescription || '-'}</Text></View>
            </View>
          ))}
        </View>
      )}

      {(salidas.length > 0 || entradas.length > 0) && (
        <View>
          <Text style={S.sectionTitle}>HISTORIAL DE TRASLADOS</Text>
          <Text style={S.subsectionTitle}>Salidas ({salidas.length})</Text>
          {salidas.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
            <View style={S.table}>
              <TableHeader cols={[
                { label: 'CÓDIGO', style: S.colTrasCode }, { label: 'DESTINO', style: S.colTrasOffice },
                { label: 'ACCIÓN', style: S.colTrasAccion }, { label: 'FECHA', style: S.colTrasDate },
              ]} />
              {salidas.map((t, i) => (
                <View key={i} style={S.row} wrap={false}>
                  <View style={[S.cell, S.colTrasCode]}><Text style={S.cellText}>{t.codigoInventario || 'S/C'}</Text></View>
                  <View style={[S.cell, S.colTrasOffice]}><Text style={S.cellText}>{t.destinoOficinaNombre || '-'}</Text></View>
                  <View style={[S.cell, S.colTrasAccion]}><Text style={S.cellText}>{t.accion}</Text></View>
                  <View style={[S.cell, S.colTrasDate]}><Text style={S.cellText}>{new Date(t.createdAt).toLocaleString('es-ES')}</Text></View>
                </View>
              ))}
            </View>
          )}
          <Text style={S.subsectionTitle}>Entradas ({entradas.length})</Text>
          {entradas.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
            <View style={S.table}>
              <TableHeader cols={[
                { label: 'CÓDIGO', style: S.colTrasCode }, { label: 'ORIGEN', style: S.colTrasOffice },
                { label: 'ACCIÓN', style: S.colTrasAccion }, { label: 'FECHA', style: S.colTrasDate },
              ]} />
              {entradas.map((t, i) => (
                <View key={i} style={S.row} wrap={false}>
                  <View style={[S.cell, S.colTrasCode]}><Text style={S.cellText}>{t.codigoInventario || 'S/C'}</Text></View>
                  <View style={[S.cell, S.colTrasOffice]}><Text style={S.cellText}>{t.origenOficinaNombre || '-'}</Text></View>
                  <View style={[S.cell, S.colTrasAccion]}><Text style={S.cellText}>{t.accion}</Text></View>
                  <View style={[S.cell, S.colTrasDate]}><Text style={S.cellText}>{new Date(t.createdAt).toLocaleString('es-ES')}</Text></View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </>
  );
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

function ReportPDF({ reports, baseUrl, groupBy }: { reports: ReportBatchItem[]; baseUrl: string; groupBy: ReportGroupBy }) {
  return (
    <Document>
      {reports.map((report, ri) => {
        const sections = buildReportSections(report, groupBy);
        return (
          <Page key={ri} size="A4" style={S.page} orientation="landscape">
            <View style={S.header}>
              <Text style={S.title}>Reporte de Traslado de Dispositivos</Text>
              <Text style={S.subtitle}>{report.title}</Text>
              <Text style={S.date}>Generado el {new Date().toLocaleDateString('es-ES')}</Text>
            </View>

            <View style={S.summaryBox}>
              <View style={S.summaryItem}><Text style={S.summaryLabel}>Dispositivos nuevos</Text><Text style={S.summaryValue}>{report.totals.newDevices}</Text></View>
              <View style={S.summaryItem}><Text style={S.summaryLabel}>Traslados</Text><Text style={S.summaryValue}>{report.totals.transferDevices}</Text></View>
              <View style={S.summaryItem}><Text style={S.summaryLabel}>Bajas</Text><Text style={S.summaryValue}>{report.bajas.length}</Text></View>
              <View style={S.summaryItem}><Text style={S.summaryLabel}>Total dispositivos</Text><Text style={S.summaryValue}>{report.totals.devices}</Text></View>
            </View>

            {sections.map((section, si) => (
              <View key={si}>
                <Text style={S.areaTitle}>{section.label}</Text>
                {section.sublabel && <Text style={S.sublabel}>{section.sublabel}</Text>}

                {section.subSections ? (
                  /* Nested: sub-sections per office, bajas once at section level */
                  <>
                    {section.subSections.map((sub, ssi) => (
                      <View key={ssi}>
                        <Text style={S.officeSubTitle}>{sub.label}</Text>
                        <SectionDevicesPDF
                          newDevices={sub.newDevices} transferDevices={sub.transferDevices}
                          salidas={sub.salidas} entradas={sub.entradas} baseUrl={baseUrl}
                        />
                      </View>
                    ))}
                  </>
                ) : (
                  /* Flat: devices/traslados directly in section */
                  <SectionDevicesPDF
                    newDevices={section.newDevices} transferDevices={section.transferDevices}
                    salidas={section.salidas} entradas={section.entradas} baseUrl={baseUrl}
                  />
                )}

                {/* Bajas always at section level */}
                <Text style={S.sectionTitle}>BAJAS ({section.bajas.length})</Text>
                {section.bajas.length === 0 ? <Text style={S.noData}>Sin registros</Text> : (
                  <View style={S.table}>
                    <TableHeader cols={[
                      { label: 'SUBGERENCIA', style: S.colBajaSub  },
                      { label: 'INVENTARIO',  style: S.colBajaCode },
                      { label: 'DESCRIPCIÓN', style: S.colBajaDesc },
                      { label: 'OFICINA',     style: S.colBajaOfi  },
                      { label: 'ORIGEN',      style: S.colBajaOrig },
                      { label: 'MOTIVO',      style: S.colBajaMotiv },
                    ]} />
                    {section.bajas.map((baja, i) => (
                      <View key={i} style={S.row} wrap={false}>
                        <View style={[S.cell, S.colBajaSub]}><Text style={S.cellText}>{baja.areaName || section.label}</Text></View>
                        <View style={[S.cell, S.colBajaCode]}><Text style={S.cellText}>{baja.inventoryCode || 'S/C'}</Text></View>
                        <View style={[S.cell, S.colBajaDesc]}><Text style={S.cellText}>{baja.description}</Text></View>
                        <View style={[S.cell, S.colBajaOfi]}><Text style={S.cellText}>{baja.officeName || '-'}</Text></View>
                        <View style={[S.cell, S.colBajaOrig]}><Text style={S.cellText}>{baja.origin || '-'}</Text></View>
                        <View style={[S.cell, S.colBajaMotiv]}><Text style={S.cellText}>{baja.reason || '-'}</Text></View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            <View style={S.obsBox} wrap={false}>
              <Text>Observaciones:</Text>
              <View style={S.obsLines} />
            </View>
            <View style={S.signatures} wrap={false}>
              <View><View style={S.signLine} /><Text style={S.signText}>Entregado por</Text></View>
              <View><View style={S.signLine} /><Text style={S.signText}>Recibido por</Text></View>
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────

const GROUP_BY_LABELS: Record<ReportGroupBy, string> = {
  dependencia: 'Por Dependencia',
  subgerencia: 'Por Subgerencia',
  piso:        'Por Piso',
  area:        'Por Área',
};

export function Reports() {
  const { dependencias, areas, offices } = useReports();

  const [filterDepId, setFilterDepId]       = useState('');
  const [filterAreaId, setFilterAreaId]     = useState('');
  const [filterOfficeId, setFilterOfficeId] = useState('');
  const [filterFloor, setFilterFloor]       = useState('');
  const [statusFilter, setStatusFilter]     = useState<'Todos' | 'New' | 'Transfer'>('Todos');
  const [groupBy, setGroupBy]               = useState<ReportGroupBy>('subgerencia');

  const [reportConfigs, setReportConfigs] = useState<ReportBatchFilter[]>([]);
  const [batchReports, setBatchReports]   = useState<ReportBatchItem[]>([]);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [showPreview, setShowPreview]     = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const filteredAreas = filterDepId ? areas.filter((a) => a.dependenciaId === filterDepId) : areas;

  const filteredOfficesForSelect = offices.filter((o) => {
    if (filterAreaId && o.areaId !== filterAreaId) return false;
    if (filterDepId && !filteredAreas.some((a) => a.id === o.areaId)) return false;
    return true;
  });

  const floorsSource = filterOfficeId ? offices.filter((o) => o.id === filterOfficeId) : filteredOfficesForSelect;
  const allFloors = [...new Set(floorsSource.map((o) => o.floor))].sort((a, b) => a - b);

  const currentFilter: ReportBatchFilter = {
    dependenciaId: filterDepId    || undefined,
    areaId:        filterAreaId   || undefined,
    officeId:      filterOfficeId || undefined,
    floor:         filterFloor ? Number(filterFloor) : undefined,
    status:        statusFilter,
    groupBy,
  };

  const describeFilter = (f: ReportBatchFilter) => {
    const parts: string[] = [];
    if (f.dependenciaId) parts.push(dependencias.find((d) => d.id === f.dependenciaId)?.name || `Dep ${f.dependenciaId}`);
    if (f.areaId)        parts.push(areas.find((a) => a.id === f.areaId)?.name || `Sub ${f.areaId}`);
    if (f.officeId)      parts.push(offices.find((o) => o.id === f.officeId)?.name || `Área ${f.officeId}`);
    if (f.floor)         parts.push(`Piso ${f.floor}`);
    if (f.status && f.status !== 'Todos') parts.push(f.status === 'New' ? 'Nuevos' : 'Traslados');
    return parts.length > 0 ? parts.join(' / ') : 'Reporte general';
  };

  const addReportConfig = () => {
    if (!filterDepId && !filterAreaId && !filterOfficeId && !filterFloor && statusFilter === 'Todos') return;
    setReportConfigs((prev) => [...prev, { ...currentFilter, title: describeFilter(currentFilter) }]);
    setShowPreview(false);
  };

  const removeReportConfig = (i: number) =>
    setReportConfigs((prev) => prev.filter((_, idx) => idx !== i));

  const generatePreview = async () => {
    try {
      setIsGenerating(true);
      const filters = reportConfigs.length > 0
        ? reportConfigs
        : [{ ...currentFilter, title: describeFilter(currentFilter) }];
      const response = await reportService.batch(filters);
      setBatchReports(response.reports || []);
      setShowPreview(true);
    } catch (err) {
      console.error('Error generando reportes', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedOfficeName = offices.find((o) => o.id === filterOfficeId)?.name;
  const selectedAreaName   = areas.find((a) => a.id === filterAreaId)?.name;
  const selectedDepName    = dependencias.find((d) => d.id === filterDepId)?.name;
  const fileName = `Reporte_${reportConfigs.length > 1 ? 'Multiple' : (selectedOfficeName || selectedAreaName || selectedDepName)?.replace(/\s+/g, '_') || 'General'}.pdf`;

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    for (const report of batchReports) {
      const sheetName = (report.title || 'Reporte').slice(0, 31).replace(/[\\/:?*[\]]/g, '_');
      const sections = buildReportSections(report, groupBy);
      const rows: (string | number)[][] = [];

      const pushDevices = (
        newDevices: ReportSection['newDevices'],
        transferDevices: ReportSection['transferDevices'],
        salidas: TrasladoRegistro[],
        entradas: TrasladoRegistro[],
      ) => {
        rows.push(['NUEVOS']);
        rows.push(['Código', 'Plan', 'Descripción', 'Características', 'Marca/Modelo']);
        for (const { device, type } of newDevices) rows.push([device.inventoryCode || '', type.planCode, type.description, type.characteristics || '', type.brandModel || '']);
        if (!newDevices.length) rows.push(['Sin registros']);
        rows.push([]);

        rows.push(['TRASLADOS']);
        rows.push(['Código', 'Plan', 'Descripción', 'Origen']);
        for (const { device, type } of transferDevices) rows.push([device.inventoryCode || '', type.planCode, type.description, device.originOfficeDescription || '']);
        if (!transferDevices.length) rows.push(['Sin registros']);
        rows.push([]);

        if (salidas.length > 0 || entradas.length > 0) {
          rows.push(['HISTORIAL DE TRASLADOS']);
          rows.push(['SALIDAS']); rows.push(['Código', 'Destino', 'Acción', 'Fecha']);
          for (const t of salidas) rows.push([t.codigoInventario || 'S/C', t.destinoOficinaNombre || '-', t.accion, new Date(t.createdAt).toLocaleString('es-ES')]);
          if (!salidas.length) rows.push(['Sin registros']);
          rows.push([]);
          rows.push(['ENTRADAS']); rows.push(['Código', 'Origen', 'Acción', 'Fecha']);
          for (const t of entradas) rows.push([t.codigoInventario || 'S/C', t.origenOficinaNombre || '-', t.accion, new Date(t.createdAt).toLocaleString('es-ES')]);
          if (!entradas.length) rows.push(['Sin registros']);
          rows.push([]);
        }
      };

      for (const section of sections) {
        rows.push([`${section.label}${section.sublabel ? ` — ${section.sublabel}` : ''}`]);
        rows.push([]);

        if (section.subSections) {
          for (const sub of section.subSections) {
            rows.push([`  ${sub.label}`]);
            pushDevices(sub.newDevices, sub.transferDevices, sub.salidas, sub.entradas);
          }
        } else {
          pushDevices(section.newDevices, section.transferDevices, section.salidas, section.entradas);
        }

        rows.push(['BAJAS']);
        rows.push(['Subgerencia', 'Inventario', 'Descripción', 'Oficina', 'Origen', 'Motivo']);
        for (const b of section.bajas) rows.push([b.areaName || section.label, b.inventoryCode || 'S/C', b.description, b.officeName || '-', b.origin || '-', b.reason || '-']);
        if (!section.bajas.length) rows.push(['Sin registros']);
        rows.push([]); rows.push([]);
      }

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
    }
    XLSX.writeFile(wb, fileName.replace('.pdf', '.xlsx'));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>

      {/* ── Filters ── */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Configuración del Reporte</h2>

        {/* GroupBy toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de agrupación</label>
          <div className="flex bg-gray-100 p-1 rounded-md w-fit">
            {(Object.keys(GROUP_BY_LABELS) as ReportGroupBy[]).map((g) => (
              <button key={g} onClick={() => setGroupBy(g)}
                className={`px-4 text-sm py-1.5 rounded-sm transition-colors ${groupBy === g ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                {GROUP_BY_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {/* Dependencia */}
          <div className="w-44">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dependencia</label>
            <select className="input-field" value={filterDepId}
              onChange={(e) => { setFilterDepId(e.target.value); setFilterAreaId(''); setFilterOfficeId(''); setFilterFloor(''); }}>
              <option value="">Todas</option>
              {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Subgerencia */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subgerencia</label>
            <select className="input-field" value={filterAreaId}
              onChange={(e) => { setFilterAreaId(e.target.value); setFilterOfficeId(''); setFilterFloor(''); }}>
              <option value="">Todas las subgerencias</option>
              {filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Área */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
            <select className="input-field" value={filterOfficeId}
              onChange={(e) => { setFilterOfficeId(e.target.value); setFilterFloor(''); }}>
              <option value="">Todas las áreas</option>
              {filteredOfficesForSelect.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          {/* Piso */}
          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
            <select className="input-field" value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
              <option value="">Todos</option>
              {allFloors.map((f) => <option key={f} value={f}>Piso {f}</option>)}
            </select>
          </div>

          {/* Estado */}
          <div className="w-52">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <div className="flex bg-gray-100 p-1 rounded-md">
              {(['Todos', 'New', 'Transfer'] as const).map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`flex-1 text-sm py-1.5 rounded-sm transition-colors ${statusFilter === s ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                  {s === 'Todos' ? 'Todos' : s === 'New' ? 'Nuevo' : 'Traslado'}
                </button>
              ))}
            </div>
          </div>

          <button onClick={addReportConfig} className="btn-secondary flex items-center gap-2 h-[38px]">
            <FileText className="w-4 h-4" /> Agregar
          </button>
          <button onClick={generatePreview} disabled={isGenerating} className="btn-primary flex items-center gap-2 h-[38px]">
            <Download className="w-4 h-4" /> {isGenerating ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>

        {/* Queue */}
        <div className="mt-2 space-y-2">
          <p className="text-sm font-medium text-gray-700">Cola de reportes</p>
          <div className="flex flex-wrap gap-2">
            {reportConfigs.length === 0
              ? <span className="text-sm text-gray-500">Sin reportes en cola — se usará el filtro actual.</span>
              : reportConfigs.map((c, i) => (
                  <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-700">
                    {describeFilter(c)}
                    <button onClick={() => removeReportConfig(i)} className="text-red-500 font-bold leading-none">×</button>
                  </span>
                ))
            }
          </div>
          <p className="text-xs text-gray-400">Cada reporte de la cola genera una página separada en el PDF.</p>
        </div>
      </div>

      {/* ── Preview ── */}
      {showPreview && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Vista previa</h2>
              <p className="text-sm text-gray-500">{batchReports.length} página(s) en el PDF</p>
            </div>
            {batchReports.length > 0 && (
              <div className="flex items-center gap-2">
                <DownloadLink document={<ReportPDF reports={batchReports} baseUrl={baseUrl} groupBy={groupBy} />} fileName={fileName}>
                  <button className="btn-primary flex items-center gap-2">
                    <Download className="w-4 h-4" /> Exportar PDF
                  </button>
                </DownloadLink>
                <button onClick={exportToExcel} className="btn-secondary flex items-center gap-2">
                  <Table className="w-4 h-4" /> Exportar Excel
                </button>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 space-y-4">
            {batchReports.map((report, i) => {
              const sections = buildReportSections(report, groupBy);
              return (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {report.totals.newDevices} nuevos · {report.totals.transferDevices} traslados · {report.bajas.length} bajas
                    </p>
                  </div>
                  {sections.map((section, si) => (
                    <div key={si} className="border-b border-gray-100 last:border-0">
                      <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                        <h4 className="font-semibold text-blue-900 text-sm">{section.label}</h4>
                        {section.sublabel && <p className="text-xs text-blue-600 mt-0.5">{section.sublabel}</p>}
                      </div>
                      <div className="px-6 py-4 space-y-4">
                        {section.subSections ? (
                          /* Nested: one block per office, bajas once at the end */
                          <>
                            {section.subSections.map((sub, ssi) => (
                              <div key={ssi} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
                                  <p className="text-xs font-semibold text-indigo-800">{sub.label}</p>
                                </div>
                                <div className="px-4 py-3 space-y-3">
                                  <PreviewTable
                                    title={`Nuevos (${sub.newDevices.length})`}
                                    cols={['Inventario', 'Plan', 'Descripción', 'Características', 'Marca/Modelo']}
                                    rows={sub.newDevices.map(({ device, type }) => [
                                      device.inventoryCode || 'S/C', type.planCode, type.description,
                                      type.characteristics || '-', type.brandModel || '-',
                                    ])}
                                  />
                                  <PreviewTable
                                    title={`Traslados (${sub.transferDevices.length})`}
                                    cols={['Inventario', 'Plan', 'Descripción', 'Origen']}
                                    rows={sub.transferDevices.map(({ device, type }) => [
                                      device.inventoryCode || 'S/C', type.planCode, type.description,
                                      device.originOfficeDescription || '-',
                                    ])}
                                  />
                                  {(sub.salidas.length > 0 || sub.entradas.length > 0) && (
                                    <>
                                      <PreviewTable
                                        title={`Salidas (${sub.salidas.length})`}
                                        cols={['Código', 'Destino', 'Acción', 'Fecha']}
                                        rows={sub.salidas.map((t) => [
                                          t.codigoInventario || 'S/C', t.destinoOficinaNombre || '-',
                                          t.accion, new Date(t.createdAt).toLocaleString('es-ES'),
                                        ])}
                                      />
                                      <PreviewTable
                                        title={`Entradas (${sub.entradas.length})`}
                                        cols={['Código', 'Origen', 'Acción', 'Fecha']}
                                        rows={sub.entradas.map((t) => [
                                          t.codigoInventario || 'S/C', t.origenOficinaNombre || '-',
                                          t.accion, new Date(t.createdAt).toLocaleString('es-ES'),
                                        ])}
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                            <PreviewTable
                              title={`Bajas de la subgerencia (${section.bajas.length})`}
                              cols={['Subgerencia', 'Inventario', 'Descripción', 'Oficina', 'Origen', 'Motivo']}
                              rows={section.bajas.map((b) => [
                                b.areaName || section.label, b.inventoryCode || 'S/C', b.description,
                                b.officeName || '-', b.origin || '-', b.reason || '-',
                              ])}
                            />
                          </>
                        ) : (
                          /* Flat: standard section */
                          <>
                            <PreviewTable
                              title={`Nuevos (${section.newDevices.length})`}
                              cols={['Inventario', 'Plan', 'Descripción', 'Características', 'Marca/Modelo', 'Imagen']}
                              rows={section.newDevices.map(({ device, type }) => [
                                device.inventoryCode || 'S/C', type.planCode, type.description,
                                type.characteristics || '-', type.brandModel || '-', type.imageUrl ? '[img]' : '-',
                              ])}
                            />
                            <PreviewTable
                              title={`Traslados (${section.transferDevices.length})`}
                              cols={['Inventario', 'Plan', 'Descripción', 'Origen']}
                              rows={section.transferDevices.map(({ device, type }) => [
                                device.inventoryCode || 'S/C', type.planCode, type.description,
                                device.originOfficeDescription || '-',
                              ])}
                            />
                            {(section.salidas.length > 0 || section.entradas.length > 0) && (
                              <>
                                <PreviewTable
                                  title={`Salidas (${section.salidas.length})`}
                                  cols={['Código', 'Destino', 'Acción', 'Fecha']}
                                  rows={section.salidas.map((t) => [
                                    t.codigoInventario || 'S/C', t.destinoOficinaNombre || '-',
                                    t.accion, new Date(t.createdAt).toLocaleString('es-ES'),
                                  ])}
                                />
                                <PreviewTable
                                  title={`Entradas (${section.entradas.length})`}
                                  cols={['Código', 'Origen', 'Acción', 'Fecha']}
                                  rows={section.entradas.map((t) => [
                                    t.codigoInventario || 'S/C', t.origenOficinaNombre || '-',
                                    t.accion, new Date(t.createdAt).toLocaleString('es-ES'),
                                  ])}
                                />
                              </>
                            )}
                            <PreviewTable
                              title={`Bajas (${section.bajas.length})`}
                              cols={['Subgerencia', 'Inventario', 'Descripción', 'Oficina', 'Origen', 'Motivo']}
                              rows={section.bajas.map((b) => [
                                b.areaName || section.label, b.inventoryCode || 'S/C', b.description,
                                b.officeName || '-', b.origin || '-', b.reason || '-',
                              ])}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!showPreview && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 text-center text-gray-400">
          Configura los filtros y pulsa <strong>Generar PDF</strong> para ver la vista previa.
        </div>
      )}
    </div>
  );
}

export default Reports;

// ─── Preview table ────────────────────────────────────────────────────────────

function PreviewTable({ title, cols, rows }: { title: string; cols: string[]; rows: string[][] }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>{cols.map((c) => <th key={c} className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={cols.length} className="px-3 py-3 text-center text-gray-400 border border-gray-200">Sin registros</td></tr>
              : rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    {row.map((cell, j) => <td key={j} className="px-3 py-2 border border-gray-200 text-gray-700">{cell}</td>)}
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
