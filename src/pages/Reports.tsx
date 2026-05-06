'use client';

import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image as PDFImage } from '@react-pdf/renderer';
import { useReports } from '../hooks/useReports';
import { reportService } from '../services/reportService';
import { ReportBatchFilter, ReportBatchItem, DeviceType, Device, Baja } from '../lib/types';

type DownloadLinkProps = {
  document: React.ReactElement;
  fileName: string;
  children?: React.ReactNode;
};
const DownloadLink = PDFDownloadLink as React.ComponentType<DownloadLinkProps>;

// ─── PDF styles ──────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page:          { padding: 28, fontSize: 9, fontFamily: 'Helvetica' },
  header:        { borderBottom: '1pt solid #000', paddingBottom: 8, marginBottom: 14, textAlign: 'center' },
  title:         { fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
  subtitle:      { fontSize: 10, marginBottom: 2 },
  date:          { color: '#666', fontSize: 8 },

  sectionTitle:  { fontSize: 10, fontWeight: 'bold', backgroundColor: '#E8EDF2', padding: '4 6', marginTop: 10, marginBottom: 4 },
  areaTitle:     { fontSize: 12, fontWeight: 'bold', backgroundColor: '#D0D8E4', padding: '5 8', marginTop: 14, marginBottom: 6 },
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
  colOrigin:     { width: '22%' },

  // Bajas – 6 columns
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
  obsBox:        { marginTop: 20, borderTop: '0.5pt solid #ccc', paddingTop: 8 },
  obsLines:      { marginTop: 6, height: 50, border: '0.5pt solid #ccc' },
});

// ─── PDF helpers ─────────────────────────────────────────────────────────────

function TableHeader({ cols }: { cols: { label: string; style?: any }[] }) {
  return (
    <View style={S.headerRow} minPresenceAhead={60}>
      {cols.map((c, i) => (
        <View key={i} style={[S.cell, c.style]}>
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

// ─── Per-area data builders ───────────────────────────────────────────────────

type AreaSection = {
  areaId: string;
  areaName: string;
  newDevices: { device: Device; type: DeviceType }[];
  transferDevices: { device: Device; type: DeviceType }[];
  bajas: Baja[];
};

function buildAreaSections(report: ReportBatchItem): AreaSection[] {
  return report.areas.map((area) => {
    const areaOfficeIds = new Set(
      report.offices.filter((o) => o.areaId === area.id).map((o) => o.id),
    );
    const areaDevices = report.devices.filter(
      (d) => d.asignacion === 'asignado' && areaOfficeIds.has(d.destinationOfficeId),
    );
    const getType = (d: Device) => report.deviceTypes.find((t) => t.id === d.typeId)!;

    return {
      areaId: area.id,
      areaName: area.name,
      newDevices: areaDevices
        .filter((d) => d.status === 'New')
        .map((d) => ({ device: d, type: getType(d) }))
        .filter((x) => x.type),
      transferDevices: areaDevices
        .filter((d) => d.status === 'Transfer')
        .map((d) => ({ device: d, type: getType(d) }))
        .filter((x) => x.type),
      bajas: report.bajas.filter((b) => b.areaId === area.id),
    };
  }).filter((s) => s.newDevices.length > 0 || s.transferDevices.length > 0 || s.bajas.length > 0);
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

function ReportPDF({ reports, baseUrl }: { reports: ReportBatchItem[]; baseUrl: string }) {
  return (
    <Document>
      {reports.map((report, ri) => {
        const sections = buildAreaSections(report);
        return (
          <Page key={ri} size="A4" style={S.page} orientation="landscape">
            {/* Header */}
            <View style={S.header}>
              <Text style={S.title}>Reporte de Traslado de Dispositivos</Text>
              <Text style={S.subtitle}>{report.title}</Text>
              <Text style={S.date}>Generado el {new Date().toLocaleDateString('es-ES')}</Text>
            </View>

            {/* Global summary */}
            <View style={S.summaryBox}>
              <View style={S.summaryItem}>
                <Text style={S.summaryLabel}>Dispositivos nuevos</Text>
                <Text style={S.summaryValue}>{report.totals.newDevices}</Text>
              </View>
              <View style={S.summaryItem}>
                <Text style={S.summaryLabel}>Traslados</Text>
                <Text style={S.summaryValue}>{report.totals.transferDevices}</Text>
              </View>
              <View style={S.summaryItem}>
                <Text style={S.summaryLabel}>Bajas</Text>
                <Text style={S.summaryValue}>{report.bajas.length}</Text>
              </View>
              <View style={S.summaryItem}>
                <Text style={S.summaryLabel}>Total dispositivos</Text>
                <Text style={S.summaryValue}>{report.totals.devices}</Text>
              </View>
            </View>

            {/* Sections per subgerencia */}
            {sections.map((section) => (
              <View key={section.areaId}>
                <Text style={S.areaTitle}>{section.areaName}</Text>

                {/* Table 1: Nuevos */}
                <Text style={S.sectionTitle}>DISPOSITIVOS NUEVOS ({section.newDevices.length})</Text>
                {section.newDevices.length === 0 ? (
                  <Text style={S.noData}>Sin registros</Text>
                ) : (
                  <View style={S.table}>
                    <TableHeader cols={[
                      { label: 'INVENTARIO',      style: S.colCode },
                      { label: 'PLAN',            style: S.colPlan },
                      { label: 'DESCRIPCIÓN',     style: S.colDesc },
                      { label: 'CARACTERÍSTICAS', style: S.colChar },
                      { label: 'MARCA / MODELO',  style: S.colBrand },
                      { label: 'IMAGEN',          style: S.colImg },
                    ]} />
                    {section.newDevices.map(({ device, type }, i) => (
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

                {/* Table 2: Traslados */}
                <Text style={S.sectionTitle}>DISPOSITIVOS DE TRASLADO ({section.transferDevices.length})</Text>
                {section.transferDevices.length === 0 ? (
                  <Text style={S.noData}>Sin registros</Text>
                ) : (
                  <View style={S.table}>
                    <TableHeader cols={[
                      { label: 'INVENTARIO',     style: S.colCode },
                      { label: 'PLAN',           style: S.colPlan },
                      { label: 'DESCRIPCIÓN',    style: S.colDesc },
                      { label: 'ORIGEN',         style: S.colOrigin },
                      { label: 'MARCA / MODELO', style: S.colBrand },
                      { label: 'IMAGEN',         style: S.colImg },
                    ]} />
                    {section.transferDevices.map(({ device, type }, i) => (
                      <View key={i} style={S.row} wrap={false}>
                        <View style={[S.cell, S.colCode]}><Text style={S.cellText}>{device.inventoryCode || 'S/C'}</Text></View>
                        <View style={[S.cell, S.colPlan]}><Text style={S.cellText}>{type.planCode}</Text></View>
                        <View style={[S.cell, S.colDesc]}><Text style={S.cellText}>{type.description}</Text></View>
                        <View style={[S.cell, S.colOrigin]}><Text style={S.cellText}>{device.originOfficeDescription || '-'}</Text></View>
                        <View style={[S.cell, S.colBrand]}><Text style={S.cellText}>{type.brandModel || '-'}</Text></View>
                        <DeviceImageCell url={type.imageUrl} baseUrl={baseUrl} />
                      </View>
                    ))}
                  </View>
                )}

                {/* Table 3: Bajas — 6 columns */}
                <Text style={S.sectionTitle}>BAJAS ({section.bajas.length})</Text>
                {section.bajas.length === 0 ? (
                  <Text style={S.noData}>Sin registros</Text>
                ) : (
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
                        <View style={[S.cell, S.colBajaSub]}><Text style={S.cellText}>{baja.areaName || section.areaName}</Text></View>
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

            {/* Observations + signatures */}
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

export function Reports() {
  const { dependencias, areas, offices } = useReports();

  // Cascading filter state
  const [filterDepId, setFilterDepId]     = useState('');
  const [filterAreaId, setFilterAreaId]   = useState('');
  const [filterFloor, setFilterFloor]     = useState('');
  const [statusFilter, setStatusFilter]   = useState<'Todos' | 'New' | 'Transfer'>('Todos');

  const [reportConfigs, setReportConfigs] = useState<ReportBatchFilter[]>([]);
  const [batchReports, setBatchReports]   = useState<ReportBatchItem[]>([]);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [showPreview, setShowPreview]     = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  // Cascading: subgerencias filtered by dependencia
  const filteredAreas = filterDepId
    ? areas.filter((a) => a.dependenciaId === filterDepId)
    : areas;

  // Floors available given selected area/dependencia
  const filteredOffices = offices.filter((o) => {
    if (filterAreaId && o.areaId !== filterAreaId) return false;
    if (filterDepId && !filteredAreas.some((a) => a.id === o.areaId)) return false;
    return true;
  });
  const allFloors = Array.from(new Set(filteredOffices.map((o) => o.floor))).sort((a, b) => a - b);

  const currentFilter: ReportBatchFilter = {
    dependenciaId: filterDepId || undefined,
    areaId:        filterAreaId || undefined,
    floor:         filterFloor ? Number(filterFloor) : undefined,
    status:        statusFilter,
  };

  const describeFilter = (f: ReportBatchFilter) => {
    const parts: string[] = [];
    if (f.dependenciaId) parts.push(dependencias.find((d) => d.id === f.dependenciaId)?.name || `Dep ${f.dependenciaId}`);
    if (f.areaId)        parts.push(areas.find((a) => a.id === f.areaId)?.name || `Sub ${f.areaId}`);
    if (f.floor)         parts.push(`Piso ${f.floor}`);
    if (f.status && f.status !== 'Todos') parts.push(f.status === 'New' ? 'Nuevos' : 'Traslados');
    return parts.length > 0 ? parts.join(' / ') : 'Reporte general';
  };

  const addReportConfig = () => {
    if (!filterDepId && !filterAreaId && !filterFloor && statusFilter === 'Todos') return;
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

  const selectedAreaName = areas.find((a) => a.id === filterAreaId)?.name;
  const selectedDepName  = dependencias.find((d) => d.id === filterDepId)?.name;
  const fileName = `Reporte_${reportConfigs.length > 1 ? 'Multiple' : (selectedAreaName || selectedDepName)?.replace(/\s+/g, '_') || 'General'}.pdf`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>

      {/* ── Filters ── */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Configuración del Reporte</h2>
        <div className="flex flex-wrap gap-4 items-end">
          {/* Dependencia */}
          <div className="w-44">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dependencia</label>
            <select className="input-field" value={filterDepId}
              onChange={(e) => { setFilterDepId(e.target.value); setFilterAreaId(''); setFilterFloor(''); }}>
              <option value="">Todas</option>
              {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* Subgerencia */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subgerencia</label>
            <select className="input-field" value={filterAreaId}
              onChange={(e) => { setFilterAreaId(e.target.value); setFilterFloor(''); }}>
              <option value="">Todas las subgerencias</option>
              {filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
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
              <DownloadLink document={<ReportPDF reports={batchReports} baseUrl={baseUrl} />} fileName={fileName}>
                <button className="btn-primary flex items-center gap-2">
                  <Download className="w-4 h-4" /> Exportar PDF
                </button>
              </DownloadLink>
            )}
          </div>

          <div className="p-6 bg-gray-50 space-y-4">
            {batchReports.map((report, i) => {
              const sections = buildAreaSections(report);
              return (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {report.totals.newDevices} nuevos · {report.totals.transferDevices} traslados · {report.bajas.length} bajas
                    </p>
                  </div>
                  {sections.map((section) => (
                    <div key={section.areaId} className="p-6 border-b border-gray-100 last:border-0 space-y-4">
                      <h4 className="font-semibold text-gray-800">{section.areaName}</h4>

                      <PreviewTable
                        title={`Nuevos (${section.newDevices.length})`}
                        cols={['Inventario', 'Plan', 'Descripción', 'Características', 'Marca/Modelo', 'Imagen']}
                        rows={section.newDevices.map(({ device, type }) => [
                          device.inventoryCode || 'S/C',
                          type.planCode,
                          type.description,
                          type.characteristics || '-',
                          type.brandModel || '-',
                          type.imageUrl ? '🖼' : '-',
                        ])}
                      />

                      <PreviewTable
                        title={`Traslados (${section.transferDevices.length})`}
                        cols={['Inventario', 'Plan', 'Descripción', 'Origen', 'Marca/Modelo', 'Imagen']}
                        rows={section.transferDevices.map(({ device, type }) => [
                          device.inventoryCode || 'S/C',
                          type.planCode,
                          type.description,
                          device.originOfficeDescription || '-',
                          type.brandModel || '-',
                          type.imageUrl ? '🖼' : '-',
                        ])}
                      />

                      <PreviewTable
                        title={`Bajas (${section.bajas.length})`}
                        cols={['Subgerencia', 'Inventario', 'Descripción', 'Oficina', 'Origen', 'Motivo']}
                        rows={section.bajas.map((b) => [
                          b.areaName || section.areaName,
                          b.inventoryCode || 'S/C',
                          b.description,
                          b.officeName || '-',
                          b.origin || '-',
                          b.reason || '-',
                        ])}
                      />
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

// ─── Preview table component ─────────────────────────────────────────────────

function PreviewTable({ title, cols, rows }: { title: string; cols: string[]; rows: string[][] }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {cols.map((c) => (
                <th key={c} className="px-3 py-2 border border-gray-200 font-semibold text-gray-600">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={cols.length} className="px-3 py-3 text-center text-gray-400 border border-gray-200">Sin registros</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 border border-gray-200 text-gray-700">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
