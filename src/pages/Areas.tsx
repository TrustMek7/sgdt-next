'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { Area } from '../lib/types';
import { useAreas } from '../hooks/useAreas';
import { useDependencias } from '../hooks/useDependencias';
import { usePagination } from '../hooks/usePagination';

export function Areas() {
  const { areas, loading, createArea, updateArea, deleteArea } = useAreas();
  const { dependencias } = useDependencias();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [toDelete, setToDelete] = useState<Area | null>(null);
  const [filterDepId, setFilterDepId] = useState('');
  const [form, setForm] = useState({ name: '', dependenciaId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => { setForm({ name: '', dependenciaId: '' }); setErrors({}); setEditing(null); };

  const openNew = () => { reset(); setIsModalOpen(true); };
  const openEdit = (area: Area) => {
    setEditing(area);
    setForm({ name: area.name, dependenciaId: area.dependenciaId ?? '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Nombre es requerido';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    try {
      const data = { name: form.name.trim(), dependenciaId: form.dependenciaId || undefined };
      if (editing) {
        await updateArea(editing.id, data);
        toast.success('Subgerencia actualizada');
      } else {
        await createArea(data);
        toast.success('Subgerencia creada');
      }
      setIsModalOpen(false); reset();
    } catch {
      toast.error('No se pudo guardar');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    if ((toDelete.officeCount ?? 0) > 0) {
      toast.error('No se puede eliminar: tiene áreas asociadas');
      setIsDeleteOpen(false); return;
    }
    try {
      await deleteArea(toDelete.id);
      toast.success('Subgerencia eliminada');
      setIsDeleteOpen(false); setToDelete(null);
    } catch {
      toast.error('No se pudo eliminar');
    }
  };

  const depName = (id?: string) => dependencias.find((d) => d.id === id)?.name ?? '-';

  const filtered = filterDepId ? areas.filter((a) => a.dependenciaId === filterDepId) : areas;

  const { paginatedItems: pagedAreas, page, setPage, pageSize, setPageSize, totalPages, totalItems } = usePagination(filtered, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Subgerencias</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Subgerencia
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <select className="input-field w-64" value={filterDepId} onChange={(e) => setFilterDepId(e.target.value)}>
          <option value="">Todas las dependencias</option>
          {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Subgerencia</th>
                <th className="px-6 py-3 font-medium">Dependencia</th>
                <th className="px-6 py-3 font-medium text-center">Áreas</th>
                <th className="px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedAreas.map((area) => (
                <tr key={area.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{area.name}</td>
                  <td className="px-6 py-4 text-gray-500">{depName(area.dependenciaId)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                      {area.officeCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(area)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setToDelete(area); setIsDeleteOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay subgerencias registradas</td></tr>
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); reset(); }} title={editing ? 'Editar Subgerencia' : 'Nueva Subgerencia'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`} placeholder="Ej: Subgerencia de Fiscalización" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dependencia</label>
            <select value={form.dependenciaId} onChange={(e) => setForm({ ...form, dependenciaId: e.target.value })} className="input-field">
              <option value="">Sin dependencia</option>
              {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">
              {editing ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={() => { setIsModalOpen(false); reset(); }} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">¿Eliminar subgerencia?</p>
              {toDelete && <p className="text-sm text-red-700 mt-1">{toDelete.name}</p>}
              {(toDelete?.officeCount ?? 0) > 0 && (
                <p className="text-sm text-red-700 mt-2">Tiene {toDelete?.officeCount} área(s) asociada(s). No se puede eliminar.</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDelete} disabled={(toDelete?.officeCount ?? 0) > 0}
              className="flex-1 bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
              Eliminar
            </button>
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Areas;
