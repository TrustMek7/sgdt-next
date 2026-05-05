'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/Modal';
import { Office } from '../lib/types';
import { useOffices } from '../hooks/useOffices';

export function Offices() {
  const { offices, areas, loading, createOffice, updateOffice, deleteOffice } = useOffices();
  const [areaFilter, setAreaFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [officeToDelete, setOfficeToDelete] = useState<Office | null>(null);
  const [formData, setFormData] = useState({ name: '', floor: '', areaId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allFloors = Array.from(new Set(offices.map((office) => office.floor))).sort((a, b) => a - b);

  const availableAreaIds = floorFilter
    ? new Set(offices.filter((office) => office.floor.toString() === floorFilter).map((office) => office.areaId))
    : new Set(areas.map((area) => area.id));

  const filteredAreasForSelect = areas.filter((area) => availableAreaIds.has(area.id));

  const filteredOffices = useMemo(() => {
    return offices.filter((office) => {
      const matchesArea = areaFilter ? office.areaId === areaFilter : true;
      const matchesFloor = floorFilter ? office.floor.toString() === floorFilter : true;
      return matchesArea && matchesFloor;
    });
  }, [offices, areaFilter, floorFilter]);

  const resetForm = () => {
    setFormData({ name: '', floor: '', areaId: '' });
    setErrors({});
    setEditingOffice(null);
  };

  const openNewOffice = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditOffice = (office: Office) => {
    setEditingOffice(office);
    setFormData({ name: office.name, floor: office.floor.toString(), areaId: office.areaId });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.floor || isNaN(Number(formData.floor)) || Number(formData.floor) < 1 || Number(formData.floor) > 99) {
      newErrors.floor = 'Número de piso válido (1-99) es requerido';
    }
    if (!formData.areaId) newErrors.areaId = 'El área es requerida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const request = editingOffice
      ? updateOffice(editingOffice.id, { name: formData.name, floor: Number(formData.floor), areaId: formData.areaId })
      : createOffice({ name: formData.name, floor: Number(formData.floor), areaId: formData.areaId });

    request
      .then(() => {
        toast.success(editingOffice ? 'Oficina actualizada' : 'Oficina creada');
        setIsModalOpen(false);
        resetForm();
      })
      .catch((error) => {
        console.error('Error saving office', error);
        toast.error('No se pudo guardar la oficina');
      });
  };

  const handleDeleteClick = (office: Office) => {
    setOfficeToDelete(office);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!officeToDelete) return;

    if ((officeToDelete.deviceCount ?? 0) > 0) {
      toast.error('No se puede eliminar una oficina con dispositivos asignados');
      setIsDeleteConfirmOpen(false);
      return;
    }

    deleteOffice(officeToDelete.id)
      .then(() => {
        toast.success('Oficina eliminada');
        setIsDeleteConfirmOpen(false);
        setOfficeToDelete(null);
      })
      .catch((error) => {
        console.error('Error deleting office', error);
        toast.error('No se pudo eliminar la oficina');
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Oficinas</h1>
        <button onClick={openNewOffice} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Oficina
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <select className="input-field w-32" value={floorFilter} onChange={(e) => { setFloorFilter(e.target.value); setAreaFilter(''); }}>
          <option value="">Todos los pisos</option>
          {allFloors.map((floor) => (
            <option key={floor} value={floor}>Piso {floor}</option>
          ))}
        </select>
        <select className="input-field w-48" value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
          <option value="">Todas las áreas</option>
          {filteredAreasForSelect.map((area) => (
            <option key={area.id} value={area.id}>{area.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Nombre</th>
                <th className="px-6 py-3 font-medium">Piso</th>
                <th className="px-6 py-3 font-medium">Área</th>
                <th className="px-6 py-3 font-medium">Dispositivos</th>
                <th className="px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOffices.map((office) => {
                const area = areas.find((item) => item.id === office.areaId);
                return (
                  <tr key={office.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{office.name}</td>
                    <td className="px-6 py-4 text-gray-600">Piso {office.floor}</td>
                    <td className="px-6 py-4 text-gray-600">{area?.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{office.deviceCount || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEditOffice(office)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(office)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredOffices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay datos registrados aún</td>
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
        title={editingOffice ? 'Editar Oficina' : 'Nueva Oficina'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: '' });
              }}
              placeholder="Ej: Oficina 101"
              className={`input-field ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Piso *</label>
            <input
              type="number"
              min="1"
              max="99"
              value={formData.floor}
              onChange={(e) => {
                setFormData({ ...formData, floor: e.target.value });
                setErrors({ ...errors, floor: '' });
              }}
              className={`input-field ${errors.floor ? 'border-red-500' : ''}`}
            />
            {errors.floor && <p className="text-red-500 text-sm mt-1">{errors.floor}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
            <select
              value={formData.areaId}
              onChange={(e) => {
                setFormData({ ...formData, areaId: e.target.value });
                setErrors({ ...errors, areaId: '' });
              }}
              className={`input-field ${errors.areaId ? 'border-red-500' : ''}`}
            >
              <option value="">Seleccionar área...</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
            {errors.areaId && <p className="text-red-500 text-sm mt-1">{errors.areaId}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">
              {editingOffice ? 'Actualizar' : 'Crear'}
            </button>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition"
            >
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
              <p className="font-semibold text-red-900">¿Eliminar oficina?</p>
              {officeToDelete && <p className="text-sm text-red-700 mt-1">{officeToDelete.name} - Piso {officeToDelete.floor}</p>}
              {(officeToDelete?.deviceCount ?? 0) > 0 && (
                 <p className="text-sm text-red-700 mt-2">Esta oficina tiene {officeToDelete?.deviceCount ?? 0} dispositivo(s). No se puede eliminar.</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeleteConfirm}
              disabled={(officeToDelete?.deviceCount ?? 0) > 0}
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

export default Offices;
