'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { getErrorMessage } from '../lib/errorMessages';
import { Office } from '../lib/types';
import { useOffices } from '../hooks/useOffices';
import { useDependencias } from '../hooks/useDependencias';
import { usePagination } from '../hooks/usePagination';

export function Offices() {
  const { offices, areas, loading, createOffice, updateOffice, deleteOffice } = useOffices();
  const { dependencias } = useDependencias();

  const [filterDepId, setFilterDepId]   = useState('');
  const [filterAreaId, setFilterAreaId] = useState('');
  const [filterFloor, setFilterFloor]   = useState('');
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editing, setEditing]           = useState<Office | null>(null);
  const [toDelete, setToDelete]         = useState<Office | null>(null);
  const [form, setForm]                 = useState({ name: '', floor: '', depId: '', areaId: '' });
  const [errors, setErrors]             = useState<Record<string, string>>({});

  // Cascading filter selects
  const filteredAreasForFilter = filterDepId
    ? areas.filter((a) => a.dependenciaId === filterDepId)
    : areas;

  // Cascading modal selects
  const filteredAreasForModal = form.depId
    ? areas.filter((a) => a.dependenciaId === form.depId)
    : areas;

  const allFloors = Array.from(new Set(offices.map((o) => o.floor))).sort((a, b) => a - b);

  const filteredOffices = useMemo(() => offices.filter((o) => {
    if (filterFloor && o.floor.toString() !== filterFloor) return false;
    if (filterAreaId && o.areaId !== filterAreaId) return false;
    if (filterDepId) {
      const area = areas.find((a) => a.id === o.areaId);
      if (area?.dependenciaId !== filterDepId) return false;
    }
    return true;
  }), [offices, areas, filterFloor, filterAreaId, filterDepId]);

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

  const areaName  = (id: string) => areas.find((a) => a.id === id)?.name ?? '-';
  const depName   = (areaId: string) => {
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

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <select className="input-field w-48" value={filterDepId} onChange={(e) => { setFilterDepId(e.target.value); setFilterAreaId(''); }}>
          <option value="">Todas las dependencias</option>
          {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input-field w-52" value={filterAreaId} onChange={(e) => setFilterAreaId(e.target.value)}>
          <option value="">Todas las subgerencias</option>
          {filteredAreasForFilter.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="input-field w-28" value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
          <option value="">Todos los pisos</option>
          {allFloors.map((f) => <option key={f} value={f}>Piso {f}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Área</th>
                <th className="px-6 py-3 font-medium">Subgerencia</th>
                <th className="px-6 py-3 font-medium">Dependencia</th>
                <th className="px-6 py-3 font-medium text-center">Piso</th>
                <th className="px-6 py-3 font-medium text-center">Dispositivos</th>
                <th className="px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedOffices.map((office) => (
                <tr key={office.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{office.name}</td>
                  <td className="px-6 py-4 text-gray-600">{areaName(office.areaId)}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{depName(office.areaId)}</td>
                  <td className="px-6 py-4 text-center text-gray-600">Piso {office.floor}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                      {office.deviceCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
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
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); reset(); }} title={editing ? 'Editar Área' : 'Nueva Área'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`} placeholder="Ej: Área de Fiscalización Tributaria" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Piso *</label>
            <input type="number" min="1" max="99" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })}
              className={`input-field ${errors.floor ? 'border-red-500' : ''}`} placeholder="Ej: 2" />
            {errors.floor && <p className="text-red-500 text-sm mt-1">{errors.floor}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dependencia</label>
            <select value={form.depId} onChange={(e) => setForm({ ...form, depId: e.target.value, areaId: '' })} className="input-field">
              <option value="">Sin filtro de dependencia</option>
              {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subgerencia *</label>
            <select value={form.areaId} onChange={(e) => setForm({ ...form, areaId: e.target.value })}
              className={`input-field ${errors.areaId ? 'border-red-500' : ''}`}>
              <option value="">Seleccionar subgerencia...</option>
              {filteredAreasForModal.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {errors.areaId && <p className="text-red-500 text-sm mt-1">{errors.areaId}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">{editing ? 'Actualizar' : 'Crear'}</button>
            <button onClick={() => { setIsModalOpen(false); reset(); }} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">¿Eliminar área?</p>
              {toDelete && <p className="text-sm text-red-700 mt-1">{toDelete.name} — Piso {toDelete.floor}</p>}
              {(toDelete?.deviceCount ?? 0) > 0 && <p className="text-sm text-red-700 mt-2">Tiene {toDelete?.deviceCount} dispositivo(s). No se puede eliminar.</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDelete} disabled={(toDelete?.deviceCount ?? 0) > 0}
              className="flex-1 bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">Eliminar</button>
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Offices;
