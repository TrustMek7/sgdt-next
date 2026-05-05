'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SidePanel } from '../components/SidePanel';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { DeviceType } from '../lib/types';
import { useDeviceTypes } from '../hooks/useDeviceTypes';

export function DeviceTypes() {
  const { deviceTypes: types, loading, createDeviceType, updateDeviceType, deleteDeviceType } = useDeviceTypes();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentType, setCurrentType] = useState<DeviceType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<DeviceType | null>(null);
  const [formData, setFormData] = useState({
    planCode: '',
    description: '',
    characteristics: '',
    brandModel: '',
  });

  const resetForm = () => {
    setFormData({
      planCode: '',
      description: '',
      characteristics: '',
      brandModel: '',
    });
    setCurrentType(null);
  };

  const openNewType = () => {
    resetForm();
    setIsPanelOpen(true);
  };

  const handleEdit = (type: DeviceType) => {
    setCurrentType(type);
    setFormData({
      planCode: type.planCode,
      description: type.description,
      characteristics: type.characteristics,
      brandModel: type.brandModel,
    });
    setIsPanelOpen(true);
  };

  const handleSave = () => {
    if (!formData.planCode.trim() || !formData.description.trim()) {
      toast.error('El código y la descripción son requeridos');
      return;
    }

    const request = currentType
      ? updateDeviceType(currentType.id, {
          planCode: formData.planCode,
          description: formData.description,
          characteristics: formData.characteristics,
          brandModel: formData.brandModel,
        })
      : createDeviceType({
          planCode: formData.planCode,
          description: formData.description,
          characteristics: formData.characteristics,
          brandModel: formData.brandModel,
        });

    request
      .then(() => {
        toast.success(currentType ? 'Tipo de dispositivo actualizado' : 'Tipo de dispositivo creado');
        setIsPanelOpen(false);
        resetForm();
      })
      .catch((error) => {
        console.error('Error saving device type', error);
        toast.error('No se pudo guardar el tipo de dispositivo');
      });
  };

  const handleDeleteClick = (type: DeviceType) => {
    setTypeToDelete(type);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!typeToDelete) return;

    deleteDeviceType(typeToDelete.id)
      .then(() => {
        toast.success('Tipo de dispositivo eliminado');
        setIsDeleteConfirmOpen(false);
        setTypeToDelete(null);
      })
      .catch((error) => {
        console.error('Error deleting device type', error);
        toast.error('No se pudo eliminar el tipo de dispositivo');
      });
  };

  const getBadgeStatus = (planCode: string) => {
    if (planCode.startsWith('Ex')) return 'Transfer';
    if (planCode.startsWith('E')) return 'New';
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tipos de Dispositivos (Leyenda)</h1>
        <button onClick={openNewType} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Tipo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Código Plan</th>
                <th className="px-6 py-3 font-medium">Descripción</th>
                <th className="px-6 py-3 font-medium">Características</th>
                <th className="px-6 py-3 font-medium">Marca-Modelo</th>
                <th className="px-6 py-3 font-medium text-center">Imagen</th>
                <th className="px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {types.map((type) => {
                const status = getBadgeStatus(type.planCode);
                return (
                  <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{type.planCode}</span>
                        {status && <Badge status={status as 'New' | 'Transfer'} />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{type.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-[220px] whitespace-pre-wrap" title={type.characteristics}>
                        {type.characteristics || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{type.brandModel || '-'}</td>
                    <td className="px-6 py-4 flex justify-center">
                      <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(type)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(type)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && types.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay datos registrados aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} title={currentType ? 'Editar Tipo de Dispositivo' : 'Nuevo Tipo de Dispositivo'}>
        <div className="space-y-6 flex flex-col h-full">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Plan</label>
              <input
                type="text"
                className="input-field"
                value={formData.planCode}
                onChange={(e) => setFormData({ ...formData, planCode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                type="text"
                className="input-field"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Características</label>
              <textarea
                className="input-field min-h-[100px] resize-y"
                value={formData.characteristics}
                onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca-Modelo</label>
              <input
                type="text"
                className="input-field"
                value={formData.brandModel}
                onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de Referencia</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md bg-gray-50">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="text-sm text-gray-600">La imagen se cargará como PNG en una fase posterior</div>
                  <p className="text-xs text-gray-500">PNG, JPG hasta 2MB</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-auto">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition" onClick={() => setIsPanelOpen(false)}>
              Cancelar
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition" onClick={handleSave}>
              Guardar Cambios
            </button>
          </div>
        </div>
      </SidePanel>

      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">¿Eliminar tipo de dispositivo?</p>
              {typeToDelete && <p className="text-sm text-red-700 mt-1">{typeToDelete.planCode} - {typeToDelete.description}</p>}
              <p className="text-sm text-red-700 mt-2">Esta acción no se puede deshacer.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleDeleteConfirm} className="flex-1 bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-700 transition">Eliminar</button>
            <button onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default DeviceTypes;
