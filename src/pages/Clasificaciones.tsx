'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { getErrorMessage } from '../lib/errorMessages';
import { Clasificacion } from '../lib/types';
import { useClasificaciones } from '../hooks/useClasificaciones';
import { usePagination } from '../hooks/usePagination';

export function Clasificaciones() {
  const { clasificaciones, loading, create, update, remove } = useClasificaciones();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Clasificacion | null>(null);
  const [toDelete, setToDelete] = useState<Clasificacion | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => { setForm({ name: '', description: '' }); setErrors({}); setEditing(null); };

  const openNew = () => { reset(); setIsModalOpen(true); };
  const openEdit = (c: Clasificacion) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? '' });
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
        toast.success('Clasificación actualizada');
      } else {
        await create({ name: form.name.trim(), description: form.description.trim() || undefined });
        toast.success('Clasificación creada');
      }
      setIsModalOpen(false); reset();
    } catch (err) {
      toast.error(`No se pudo guardar la clasificación: ${getErrorMessage(err)}`);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      toast.success('Clasificación eliminada');
      setIsDeleteOpen(false); setToDelete(null);
    } catch (err) {
      toast.error(`No se pudo eliminar la clasificación: ${getErrorMessage(err)}`);
    }
  };

  const { paginatedItems: pagedClasificaciones, page, setPage, pageSize, setPageSize, totalPages, totalItems } = usePagination(clasificaciones, 10);

  const colorMap: Record<string, string> = {
    'Electrónico': 'bg-blue-50 text-blue-700',
    'Mobiliario':  'bg-green-50 text-green-700',
    'Otro':        'bg-gray-50 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clasificaciones</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Clasificación
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Nombre</th>
                <th className="px-6 py-3 font-medium">Descripción</th>
                <th className="px-6 py-3 font-medium text-center">Tipos asociados</th>
                <th className="px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedClasificaciones.map((cl) => (
                <tr key={cl.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[cl.name] ?? 'bg-gray-50 text-gray-700'}`}>
                      <Tag className="w-3 h-3" />{cl.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{cl.description || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                      {cl.typeCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(cl)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setToDelete(cl); setIsDeleteOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && clasificaciones.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay clasificaciones registradas</td></tr>
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); reset(); }} title={editing ? 'Editar Clasificación' : 'Nueva Clasificación'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`input-field ${errors.name ? 'border-red-500' : ''}`} placeholder="Ej: Electrónico, Mobiliario..." />
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
              <p className="font-semibold text-red-900">¿Eliminar clasificación?</p>
              {toDelete && <p className="text-sm text-red-700 mt-1">{toDelete.name}</p>}
              <p className="text-sm text-red-700 mt-2">Solo se puede eliminar si no tiene tipos de dispositivo asociados.</p>
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

export default Clasificaciones;
