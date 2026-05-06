'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle, Network } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { getErrorMessage } from '../lib/errorMessages';
import { Dependencia } from '../lib/types';
import { useDependencias } from '../hooks/useDependencias';
import { usePagination } from '../hooks/usePagination';

export function Dependencias() {
  const { dependencias, loading, create, update, remove } = useDependencias();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Dependencia | null>(null);
  const [toDelete, setToDelete] = useState<Dependencia | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => { setForm({ name: '', description: '' }); setErrors({}); setEditing(null); };

  const openNew = () => { reset(); setIsModalOpen(true); };
  const openEdit = (d: Dependencia) => {
    setEditing(d);
    setForm({ name: d.name, description: d.description ?? '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = 'Nombre es requerido';
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    try {
      if (editing) {
        await update(editing.id, { name: form.name.trim(), description: form.description.trim() || undefined });
        toast.success('Dependencia actualizada');
      } else {
        await create({ name: form.name.trim(), description: form.description.trim() || undefined });
        toast.success('Dependencia creada');
      }
      setIsModalOpen(false); reset();
    } catch (err) {
      toast.error(`No se pudo guardar la dependencia: ${getErrorMessage(err)}`);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      toast.success('Dependencia eliminada');
      setIsDeleteOpen(false); setToDelete(null);
    } catch (err) {
      toast.error(`No se pudo eliminar la dependencia: ${getErrorMessage(err)}`);
    }
  };

  const { paginatedItems: pagedDependencias, page, setPage, pageSize, setPageSize, totalPages, totalItems } = usePagination(dependencias, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dependencias</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Dependencia
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Nombre</th>
                <th className="px-6 py-3 font-medium">Descripción</th>
                <th className="px-6 py-3 font-medium text-center">Subgerencias</th>
                <th className="px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedDependencias.map((dep) => (
                <tr key={dep.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    <Network className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {dep.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{dep.description || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                      {dep.subgerenciaCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(dep)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setToDelete(dep); setIsDeleteOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && dependencias.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay dependencias registradas</td></tr>
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); reset(); }} title={editing ? 'Editar Dependencia' : 'Nueva Dependencia'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`} placeholder="Ej: Gerencia de Administración" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input-field min-h-[80px]" placeholder="Descripción opcional" />
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
              <p className="font-semibold text-red-900">¿Eliminar dependencia?</p>
              {toDelete && <p className="text-sm text-red-700 mt-1">{toDelete.name}</p>}
              <p className="text-sm text-red-700 mt-2">Solo se puede eliminar si no tiene subgerencias asociadas.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleDelete} className="flex-1 bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-700 transition">Eliminar</button>
            <button onClick={() => setIsDeleteOpen(false)} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Dependencias;
