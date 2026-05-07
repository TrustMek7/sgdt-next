'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAreas } from '../hooks/useAreas';
import { reportService } from '../services/reportService';
import { AreaReportItem } from '../lib/types';

export function AreaReports() {
  const { areas } = useAreas();
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [reports, setReports] = useState<AreaReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async (areaId?: string) => {
    try {
      setLoading(true);
      const data = await reportService.byArea(areaId);
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error loading area reports', error);
      toast.error('Error al cargar reportes por área');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(selectedAreaId || undefined);
  }, [selectedAreaId]);

  const reportCount = useMemo(() => reports.length, [reports]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes por Área</h1>
          <p className="text-sm text-gray-500">Nuevos, traslados y bajas separados por sección de área.</p>
        </div>
        <button
          onClick={() => loadReports(selectedAreaId || undefined)}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Recargar
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="w-full md:w-72">
          <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
          <select
            className="input-field"
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
          >
            <option value="">Todas las áreas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-500">
          {reportCount} área(s) con información disponible
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center text-gray-500">
          Cargando reportes por área...
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center text-gray-500">
          No hay registros para el filtro seleccionado.
        </div>
      ) : (
        <div className="space-y-8">
          {reports.map((report) => (
            <section key={report.area.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">{report.area.name}</h2>
                <p className="text-sm text-gray-500">{report.totals.newDevices} nuevos · {report.totals.transferDevices} traslados · {report.totals.bajas} bajas</p>
              </div>

              <div className="p-6 space-y-8">
                <ReportTable
                  title="Nuevos"
                  rows={report.newDevices}
                  columns={['Código', 'Plan', 'Descripción', 'Origen']}
                  renderRow={(row) => [row.inventoryCode || 'S/C', row.planCode, row.description, row.origin]}
                />

                <ReportTable
                  title="Traslados"
                  rows={report.transferDevices}
                  columns={['Código', 'Plan', 'Descripción', 'Origen']}
                  renderRow={(row) => [row.inventoryCode || 'S/C', row.planCode, row.description, row.origin]}
                />

                <ReportTable
                  title="Bajas"
                  rows={report.bajas}
                  columns={['Código', 'Descripción', 'Oficina', 'Origen', 'Motivo']}
                  renderRow={(row) => [row.inventoryCode || 'S/C', row.description, row.officeName, row.origin, row.reason]}
                />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default AreaReports;

function ReportTable<T extends object>({
  title,
  columns,
  rows,
  renderRow,
}: {
  title: string;
  columns: string[];
  rows: T[];
  renderRow: (row: T) => string[];
}) {
  return (
    <div>
      <h3 className="text-md font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 border border-gray-200 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={index} className="border-b border-gray-200 last:border-0 hover:bg-gray-50/50">
                  {renderRow(row).map((value, valueIndex) => (
                    <td key={valueIndex} className="px-4 py-3 border border-gray-200 text-gray-700 align-top">
                      {value || '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-4 text-center text-gray-500">
                  Sin registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
