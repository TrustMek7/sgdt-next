'use client';

import React, { useState } from 'react';
import { FileText, Download, Table } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import * as XLSX from 'xlsx';
import { useReports } from '../../hooks/useReports';
import { reportService } from '../../services/reportService';
import type { ReportBatchFilter, ReportBatchItem, ReportGroupBy, TrasladoRegistro } from '../../lib/types';
import { buildReportSections, groupByClasif } from './buildSections';
import { ReportPDF } from './PdfComponents';
import { PreviewTable, SectionPreview } from './PreviewComponents';

type DownloadLinkProps = { document: React.ReactElement; fileName: string; children?: React.ReactNode };
const DownloadLink = PDFDownloadLink as React.ComponentType<DownloadLinkProps>;

const GROUP_BY_LABELS: Record<ReportGroupBy, string> = {
  dependencia: 'Por Dependencia',
  subgerencia: 'Por Subgerencia',
  piso:        'Por Piso',
  area:        'Por Área',
};

export function Reports() {
  const { dependencias, areas, offices } = useReports();

  const [filterDepId,    setFilterDepId]    = useState('');
  const [filterAreaId,   setFilterAreaId]   = useState('');
  const [filterOfficeId, setFilterOfficeId] = useState('');
  const [filterFloor,    setFilterFloor]    = useState('');
  const [statusFilter,   setStatusFilter]   = useState<'Todos' | 'New' | 'Transfer'>('Todos');
  const [groupBy,        setGroupBy]        = useState<ReportGroupBy>('subgerencia');

  const [reportConfigs, setReportConfigs] = useState<ReportBatchFilter[]>([]);
  const [batchReports,  setBatchReports]  = useState<ReportBatchItem[]>([]);
  const [isGenerating,  setIsGenerating]  = useState(false);
  const [showPreview,   setShowPreview]   = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const filteredAreas = filterDepId ? areas.filter((a) => a.dependenciaId === filterDepId) : areas;
  const filteredOfficesForSelect = offices.filter((o) => {
    if (filterAreaId && o.areaId !== filterAreaId) return false;
    if (filterDepId && !filteredAreas.some((a) => a.id === o.areaId)) return false;
    return true;
  });
  const floorsSource = filterOfficeId ? offices.filter((o) => o.id === filterOfficeId) : filteredOfficesForSelect;
  const allFloors    = [...new Set(floorsSource.map((o) => o.floor))].sort((a, b) => a - b);

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
      const sections  = buildReportSections(report, groupBy);
      const rows: (string | number)[][] = [];

      type DeviceItem = { device: Parameters<typeof groupByClasif>[0][number]['device']; type: Parameters<typeof groupByClasif>[0][number]['type'] };
      const pushDevices = (
        newDevices: DeviceItem[],
        transferDevices: DeviceItem[],
        transferRedistribuido: DeviceItem[],
        salidas: TrasladoRegistro[],
        entradas: TrasladoRegistro[],
      ) => {
        const newGroups           = groupByClasif(newDevices, report.clasificaciones);
        const transferGroups      = groupByClasif(transferDevices, report.clasificaciones);
        const redistribuidoGroups = groupByClasif(transferRedistribuido, report.clasificaciones);

        rows.push(['NUEVOS']);
        for (const { name, items } of newGroups) {
          if (newGroups.length > 1) rows.push([`  ${name.toUpperCase()} (${items.length})`]);
          rows.push(['Código', 'Plan', 'Descripción', 'Características', 'Marca/Modelo']);
          for (const { device, type } of items)
            rows.push([device.inventoryCode || '', type.planCode, type.description, type.characteristics || '', type.brandModel || '']);
        }
        if (!newDevices.length) rows.push(['Sin registros']);
        rows.push([]);

        rows.push(['TRASLADOS']);
        for (const { name, items } of transferGroups) {
          if (transferGroups.length > 1) rows.push([`  ${name.toUpperCase()} (${items.length})`]);
          rows.push(['Código', 'Plan', 'Descripción', 'Origen']);
          for (const { device, type } of items)
            rows.push([device.inventoryCode || '', type.planCode, type.description, device.originOfficeDescription || '']);
        }
        if (!transferDevices.length) rows.push(['Sin registros']);
        rows.push([]);

        rows.push([`TRASLADOS — REDISTRIBUIDOS (${transferRedistribuido.length})`]);
        for (const { name, items } of redistribuidoGroups) {
          if (redistribuidoGroups.length > 1) rows.push([`  ${name.toUpperCase()} (${items.length})`]);
          rows.push(['Código', 'Plan', 'Descripción', 'Origen', 'Destino redistribución']);
          for (const { device, type } of items)
            rows.push([device.inventoryCode || '', type.planCode, type.description, device.originOfficeDescription || '', device.destinoRedistribucion || '']);
        }
        if (!transferRedistribuido.length) rows.push(['Sin registros']);
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
            pushDevices(sub.newDevices, sub.transferDevices, sub.transferRedistribuido, sub.salidas, sub.entradas);
          }
        } else {
          pushDevices(section.newDevices, section.transferDevices, section.transferRedistribuido, section.salidas, section.entradas);
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
          <div className="w-44">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dependencia</label>
            <select className="input-field" value={filterDepId}
              onChange={(e) => { setFilterDepId(e.target.value); setFilterAreaId(''); setFilterOfficeId(''); setFilterFloor(''); }}>
              <option value="">Todas</option>
              {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Subgerencia</label>
            <select className="input-field" value={filterAreaId}
              onChange={(e) => { setFilterAreaId(e.target.value); setFilterOfficeId(''); setFilterFloor(''); }}>
              <option value="">Todas las subgerencias</option>
              {filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
            <select className="input-field" value={filterOfficeId}
              onChange={(e) => { setFilterOfficeId(e.target.value); setFilterFloor(''); }}>
              <option value="">Todas las áreas</option>
              {filteredOfficesForSelect.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>

          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 mb-1">Piso</label>
            <select className="input-field" value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
              <option value="">Todos</option>
              {allFloors.map((f) => <option key={f} value={f}>Piso {f}</option>)}
            </select>
          </div>

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
                          <>
                            {section.subSections.map((sub, ssi) => (
                              <div key={ssi} className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100">
                                  <p className="text-xs font-semibold text-indigo-800">{sub.label}</p>
                                </div>
                                <div className="px-4 py-3">
                                  <SectionPreview
                                    newDevices={sub.newDevices} transferDevices={sub.transferDevices}
                                    transferRedistribuido={sub.transferRedistribuido}
                                    salidas={sub.salidas} entradas={sub.entradas}
                                    clasificaciones={report.clasificaciones}
                                  />
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
                          <>
                            <SectionPreview
                              newDevices={section.newDevices} transferDevices={section.transferDevices}
                              transferRedistribuido={section.transferRedistribuido}
                              salidas={section.salidas} entradas={section.entradas}
                              clasificaciones={report.clasificaciones}
                            />
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
