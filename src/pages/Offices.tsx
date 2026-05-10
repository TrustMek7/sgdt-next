'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, History, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { FormField } from '../components/FormField';
import { ModalActions } from '../components/ModalActions';
import { Pagination } from '../components/Pagination';
import { getErrorMessage } from '../lib/errorMessages';
import { Office, TrasladoRegistro } from '../lib/types';
import { useOffices } from '../hooks/useOffices';
import { useDependencias } from '../hooks/useDependencias';
import { useLocationFilter } from '../hooks/useLocationFilter';
import { usePagination } from '../hooks/usePagination';
import { officeService } from '../services/officeService';

export function Offices() {
  const { offices, areas, loading, createOffice, updateOffice, deleteOffice } = useOffices();
  const { dependencias } = useDependencias();

  const filterLoc = useLocationFilter({ areas });

  const [filterFloor, setFilterFloor]   = useState('');
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editing, setEditing]           = useState<Office | null>(null);
  const [toDelete, setToDelete]         = useState<Office | null>(null);
  const [form, setForm]                 = useState({ name: '', floor: '', depId: '', areaId: '' });
  const [errors, setErrors]             = useState<Record<string, string>>({});
  const [trasladoOffice, setTrasladoOffice] = useState<Office | null>(null);
  const [trasladoData, setTrasladoData]     = useState<TrasladoRegistro[]>([]);
  const [trasladoLoading, setTrasladoLoading] = useState(false);

  // Cascading modal select (tightly coupled to form object, kept inline)
  const filteredAreasForModal = form.depId
    ? areas.filter((a) => a.dependenciaId === form.depId)
    : areas;

  const allFloors = Array.from(new Set(offices.map((o) => o.floor))).sort((a, b) => a - b);

  const filteredOffices = useMemo(() => offices.filter((o) => {
    if (filterFloor && o.floor.toString() !== filterFloor) return false;
    if (filterLoc.areaId && o.areaId !== filterLoc.areaId) return false;
    if (filterLoc.depId) {
      const area = areas.find((a) => a.id === o.areaId);
      if (area?.dependenciaId !== filterLoc.depId) return false;
    }
    return true;
  }), [offices, areas, filterFloor, filterLoc.areaId, filterLoc.depId]);

  const { paginatedItems: pagedOffices, page, setPage, pageSize, setPageSize, totalPages, totalItems } = usePagination(filteredOffices, 10);

  const reset = () => { setForm({ name: '', floor: '', depId: '', areaId: '' }); setErrors({}); setEditing(null); };

  const openNew = () => { reset(); setIsModalOpen(true); };
  const openEdit = (o: Office) => {
    const area = areas.find((a) => a.id === o.areaId);
    setEditing(o);
    setForm({ name: o.name, floor: o.floor.toString(), depId: area?.dependenciaId ?? '', areaId: o.areaId });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Nombre es requerido';
    if (!form.floor || Number(form.floor) < 1) nextErrors.floor = 'Piso válido (≥1) requerido';
    if (!form.areaId) nextErrors.areaId = 'Subgerencia es requerida';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    try {
      const data = { name: form.name.trim(), floor: Number(form.floor), areaId: form.areaId };
      if (editing) { await updateOffice(editing.id, data); toast.success('Área actualizada'); }
      else          { await createOffice(data); toast.success('Área creada'); }
      setIsModalOpen(false); reset();
    } catch (err) { toast.error(`No se pudo guardar el área: ${getErrorMessage(err)}`); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    if ((toDelete.deviceCount ?? 0) > 0) {
      toast.error('No se puede eliminar: tiene dispositivos asignados');
      setIsDeleteOpen(false); return;
    }
    try {
      await deleteOffice(toDelete.id);
      toast.success('Área eliminada');
      setIsDeleteOpen(false); setToDelete(null);
    } catch (err) { toast.error(`No se pudo eliminar el área: ${getErrorMessage(err)}`); }
  };

  const openTrasladoModal = async (office: Office) => {
    setTrasladoOffice(office);
    setTrasladoLoading(true);
    setTrasladoData([]);
    try {
      const data = await officeService.getTrasladoRegistro(office.id);
      setTrasladoData(Array.isArray(data) ? data : []);
    } catch {
      toast.error('No se pudo cargar el registro de traslados');
    } finally {
      setTrasladoLoading(false);
    }
  };

  const areaName = (id: string) => areas.find((a) => a.id === id)?.name ?? '-';
  const depName  = (areaId: string) => {
    const depId = areas.find((a) => a.id === areaId)?.dependenciaId;
    return dependencias.find((d) => d.id === depId)?.name ?? '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Áreas</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Área
        </button>
      </div>

      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
        <select className="input-field w-full sm:w-48" value={filterLoc.depId} onChange={(e) => filterLoc.setDepId(e.target.value)}>
          <option value="">Todas las dependencias</option>
          {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input-field w-full sm:w-52" value={filterLoc.areaId} onChange={(e) => filterLoc.setAreaId(e.target.value)}>
          <option value="">Todas las subgerencias</option>
          {filterLoc.filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="input-field w-full sm:w-28" value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
          <option value="">Todos los pisos</option>
          {allFloors.map((f) => <option key={f} value={f}>Piso {f}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 sm:px-6 py-3 font-medium">Área</th>
                <th className="px-4 sm:px-6 py-3 font-medium hidden sm:table-cell">Subgerencia</th>
                <th className="px-4 sm:px-6 py-3 font-medium hidden md:table-cell">Dependencia</th>
                <th className="px-4 sm:px-6 py-3 font-medium text-center">Piso</th>
                <th className="px-4 sm:px-6 py-3 font-medium text-center hidden sm:table-cell">Dispositivos</th>
                <th className="px-4 sm:px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedOffices.map((office) => (
                <tr key={office.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900">{office.name}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 hidden sm:table-cell">{areaName(office.areaId)}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500 text-xs hidden md:table-cell">{depName(office.areaId)}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center text-gray-600">Piso {office.floor}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center hidden sm:table-cell">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                      {office.deviceCount}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openTrasladoModal(office)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Registro de Traslados"><History className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(office)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setToDelete(office); setIsDeleteOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredOffices.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No hay áreas registradas</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page} totalPages={totalPages} totalItems={totalItems}
          pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); reset(); }} title={editing ? 'Editar Área' : 'Nueva Área'}>
        <div className="space-y-4">
          <FormField label="Nombre" required error={errors.name}>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`} placeholder="Ej: Área de Fiscalización Tributaria" />
          </FormField>
          <FormField label="Piso" required error={errors.floor}>
            <input type="number" min="1" max="99" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })}
              className={`input-field ${errors.floor ? 'border-red-500' : ''}`} placeholder="Ej: 2" />
          </FormField>
          <FormField label="Dependencia">
            <select value={form.depId} onChange={(e) => setForm({ ...form, depId: e.target.value, areaId: '' })} className="input-field">
              <option value="">Sin filtro de dependencia</option>
              {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Subgerencia" required error={errors.areaId}>
            <select value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })}
              className={`input-field ${errors.areaId ? 'border-red-500' : ''}`}>
              <option value="">Seleccionar subgerencia...</option>
              {filteredAreasForModal.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </FormField>
          <ModalActions onConfirm={handleSave} onCancel={() => { setIsModalOpen(false); reset(); }}
            confirmLabel={editing ? 'Actualizar' : 'Crear'} />
        </div>
      </Modal>

      <Modal
        isOpen={!!trasladoOffice}
        onClose={() => { setTrasladoOffice(null); setTrasladoData([]); }}
        title={`Registro de Traslados — ${trasladoOffice?.name ?? ''}`}
      >
        {trasladoLoading ? (
          <div className="py-10 text-center text-gray-500 text-sm">Cargando...</div>
        ) : trasladoData.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">Sin registros de traslados para esta oficina</div>
        ) : (() => {
          const salidas  = trasladoData.filter((r) => r.origenOficinaId === trasladoOffice?.id);
          const entradas = trasladoData.filter((r) => r.destinoOficinaId === trasladoOffice?.id);
          const fmtDate  = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
          const accionLabel = (a: string) => ({ reasignacion: 'Reasignación', intercambio: 'Intercambio', edicion: 'Edición' })[a] ?? a;
          return (
            <div className="space-y-6">
              {salidas.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <ArrowRight className="w-4 h-4 text-orange-500" /> Salidas ({salidas.length})
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-3 py-2">Código</th>
                          <th className="px-3 py-2">Destino</th>
                          <th className="px-3 py-2">Acción</th>
                          <th className="px-3 py-2">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {salidas.map((r) => (
                          <tr key={r.id} className="hover:bg-orange-50">
                            <td className="px-3 py-2 font-mono">{r.codigoInventario ?? '—'}</td>
                            <td className="px-3 py-2">{r.destinoOficinaNombre ?? '—'}</td>
                            <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{accionLabel(r.accion)}</span></td>
                            <td className="px-3 py-2 text-gray-500">{fmtDate(r.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {entradas.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <ArrowRight className="w-4 h-4 text-green-500 rotate-180" /> Entradas ({entradas.length})
                  </h3>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-3 py-2">Código</th>
                          <th className="px-3 py-2">Origen</th>
                          <th className="px-3 py-2">Acción</th>
                          <th className="px-3 py-2">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {entradas.map((r) => (
                          <tr key={r.id} className="hover:bg-green-50">
                            <td className="px-3 py-2 font-mono">{r.codigoInventario ?? '—'}</td>
                            <td className="px-3 py-2">{r.origenOficinaNombre}</td>
                            <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">{accionLabel(r.accion)}</span></td>
                            <td className="px-3 py-2 text-gray-500">{fmtDate(r.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        heading="¿Eliminar área?"
        detail={toDelete ? `${toDelete.name} — Piso ${toDelete.floor}` : undefined}
        confirmDisabled={(toDelete?.deviceCount ?? 0) > 0}
        warning="Esta acción no se puede deshacer."
      >
        {(toDelete?.deviceCount ?? 0) > 0 && (
          <p className="text-sm text-red-700 mt-2">Tiene {toDelete?.deviceCount} dispositivo(s). No se puede eliminar.</p>
        )}
      </ConfirmModal>
    </div>
  );
}

export default Offices;
