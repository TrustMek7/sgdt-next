'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/Modal';
import { Area } from '../lib/types';
import { useAreas } from '../hooks/useAreas';

export function Areas() {
  const { areas, loading, createArea, updateArea, deleteArea } = useAreas();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setError('');
    setEditingArea(null);
  };

  const openNewArea = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditArea = (area: Area) => {
    setEditingArea(area);
    setName(area.name);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    const request = editingArea ? updateArea(editingArea.id, { name }) : createArea({ name });
    request
      .then(() => {
        toast.success(editingArea ? 'Área actualizada' : 'Área creada');
        setIsModalOpen(false);
        resetForm();
      })
      .catch((err) => {
        console.error('Error saving area', err);
        toast.error('No se pudo guardar el área');
      });
  };

  const handleDeleteClick = (area: Area) => {
    setAreaToDelete(area);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!areaToDelete) return;

    if ((areaToDelete.officeCount ?? 0) > 0) {
      toast.error('No se puede eliminar un área con oficinas asignadas');
      setIsDeleteConfirmOpen(false);
      return;
    }

    deleteArea(areaToDelete.id)
      .then(() => {
        toast.success('Área eliminada');
        setIsDeleteConfirmOpen(false);
        setAreaToDelete(null);
      })
      .catch((err) => {
        console.error('Error deleting area', err);
        toast.error('No se pudo eliminar el área');
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Áreas</h1>
        <button onClick={openNewArea} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Área
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Nombre</th>
                <th className="px-6 py-3 font-medium">Cantidad de Oficinas</th>
                <th className="px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {areas.map((area) => (
                <tr key={area.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{area.name}</td>
                  <td className="px-6 py-4 text-gray-600">{area.officeCount}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEditArea(area)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteClick(area)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && areas.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No hay datos registrados aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingArea ? 'Editar Área' : 'Nueva Área'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Ej: Recursos Humanos"
              className={`input-field ${error ? 'border-red-500' : ''}`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">
              {editingArea ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={() => {
              setIsModalOpen(false);
              resetForm();
            }} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">¿Eliminar área?</p>
              {areaToDelete && <p className="text-sm text-red-700 mt-1">{areaToDelete.name}</p>}
              {(areaToDelete?.officeCount ?? 0) > 0 && (
                 <p className="text-sm text-red-700 mt-2">Esta área tiene {areaToDelete?.officeCount ?? 0} oficina(s) asignada(s). No se puede eliminar.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeleteConfirm}
              disabled={(areaToDelete?.officeCount ?? 0) > 0}
              className="flex-1 bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Eliminar
            </button>
            <button onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Areas;
