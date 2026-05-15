import React from 'react';
import type { Device, DeviceType, Clasificacion, TrasladoRegistro } from '../../lib/types';
import { groupByClasif, isElectronicsClasif, aggregateByType } from './buildSections';

// ─── Basic table ──────────────────────────────────────────────────────────────

export function PreviewTable({ title, cols, rows }: { title: string; cols: string[]; rows: string[][] }) {
  return (
    <div>
      {title && <p className="text-sm font-medium text-gray-700 mb-2">{title}</p>}
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

// ─── Devices + historial section — groups by classification ───────────────────

export function SectionPreview({ newDevices, transferDevices, transferRedistribuido, salidas: _salidas, entradas: _entradas, clasificaciones }: {
  newDevices: { device: Device; type: DeviceType }[];
  transferDevices: { device: Device; type: DeviceType }[];
  transferRedistribuido: { device: Device; type: DeviceType }[];
  salidas: TrasladoRegistro[];
  entradas: TrasladoRegistro[];
  clasificaciones: Clasificacion[];
}) {
  const newGroups           = groupByClasif(newDevices, clasificaciones);
  const transferGroups      = groupByClasif(transferDevices, clasificaciones);
  const redistribuidoGroups = groupByClasif(transferRedistribuido, clasificaciones);

  return (
    <div className="space-y-4">
      {/* Nuevos */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-2">Nuevos ({newDevices.length})</p>
        {newDevices.length === 0
          ? <p className="text-xs text-gray-400 py-1">Sin registros</p>
          : newGroups.map(({ name, items }) => (
              <div key={name} className="mb-3">
                {newGroups.length > 1 && (
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">{name} ({items.length})</p>
                )}
                {!isElectronicsClasif(name) ? (
                  <PreviewTable
                    title=""
                    cols={['Código', 'Descripción', 'Cantidad']}
                    rows={aggregateByType(items).map(({ type, count }) => [
                      type.planCode, type.description, String(count),
                    ])}
                  />
                ) : (
                  <PreviewTable
                    title=""
                    cols={['Inventario', 'Plan', 'Descripción', 'Características', 'Marca/Modelo', 'Imagen']}
                    rows={items.map(({ device, type }) => [
                      device.inventoryCode || 'S/C', type.planCode, type.description,
                      type.characteristics || '-', type.brandModel || '-', type.imageUrl ? '[img]' : '-',
                    ])}
                  />
                )}
              </div>
            ))
        }
      </div>

      {/* Traslados */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-2">Traslados ({transferDevices.length})</p>
        {transferDevices.length === 0
          ? <p className="text-xs text-gray-400 py-1">Sin registros</p>
          : transferGroups.map(({ name, items }) => (
              <div key={name} className="mb-3">
                {transferGroups.length > 1 && (
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">{name} ({items.length})</p>
                )}
                {!isElectronicsClasif(name) ? (
                  <PreviewTable
                    title=""
                    cols={['Código', 'Descripción', 'Cantidad']}
                    rows={aggregateByType(items).map(({ type, count }) => [
                      type.planCode, type.description, String(count),
                    ])}
                  />
                ) : (
                  <PreviewTable
                    title=""
                    cols={['Inventario', 'Plan', 'Descripción', 'Origen']}
                    rows={items.map(({ device, type }) => [
                      device.inventoryCode || 'S/C', type.planCode, type.description,
                      device.originOfficeDescription || '-',
                    ])}
                  />
                )}
              </div>
            ))
        }
      </div>

      {/* Redistribuidos */}
      <div>
        <p className="text-sm font-semibold text-gray-800 mb-2">Traslados redistribuidos ({transferRedistribuido.length})</p>
        {transferRedistribuido.length === 0
          ? <p className="text-xs text-gray-400 py-1">Sin registros</p>
          : redistribuidoGroups.map(({ name, items }) => (
              <div key={name} className="mb-3">
                {redistribuidoGroups.length > 1 && (
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">{name} ({items.length})</p>
                )}
                {!isElectronicsClasif(name) ? (
                  <PreviewTable
                    title=""
                    cols={['Código', 'Descripción', 'Destino']}
                    rows={items.map(({ device, type }) => [
                      type.planCode, type.description, device.destinoRedistribucion || '-',
                    ])}
                  />
                ) : (
                  <PreviewTable
                    title=""
                    cols={['Inventario', 'Plan', 'Descripción', 'Origen', 'Destino']}
                    rows={items.map(({ device, type }) => [
                      device.inventoryCode || 'S/C', type.planCode, type.description,
                      device.originOfficeDescription || '-', device.destinoRedistribucion || '-',
                    ])}
                  />
                )}
              </div>
            ))
        }
      </div>

      {/* Historial — TODO: definir filtro de rango de fechas antes de mostrar
      {(salidas.length > 0 || entradas.length > 0) && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-800">Historial de traslados</p>
          <PreviewTable
            title={`Salidas (${salidas.length})`}
            cols={['Código', 'Destino', 'Acción', 'Fecha']}
            rows={salidas.map((t) => [
              t.codigoInventario || 'S/C', t.destinoOficinaNombre || '-',
              t.accion, new Date(t.createdAt).toLocaleString('es-ES'),
            ])}
          />
          <PreviewTable
            title={`Entradas (${entradas.length})`}
            cols={['Código', 'Origen', 'Acción', 'Fecha']}
            rows={entradas.map((t) => [
              t.codigoInventario || 'S/C', t.origenOficinaNombre || '-',
              t.accion, new Date(t.createdAt).toLocaleString('es-ES'),
            ])}
          />
        </div>
      )}
      */}
    </div>
  );
}
