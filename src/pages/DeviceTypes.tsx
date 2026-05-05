'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SidePanel } from '../components/SidePanel';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { DeviceType } from '../lib/types';
import { useDeviceTypes } from '../hooks/useDeviceTypes';
import { useClasificaciones } from '../hooks/useClasificaciones';

const CLASIF_COLORS: Record<string, string> = {
  'Electrónico': 'bg-blue-100 text-blue-700',
  'Mobiliario':  'bg-green-100 text-green-700',
};

export function DeviceTypes() {
  const { deviceTypes: types, loading, createDeviceType, updateDeviceType, deleteDeviceType } = useDeviceTypes();
  const { clasificaciones } = useClasificaciones();

  const [filterClasifId, setFilterClasifId] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentType, setCurrentType] = useState<DeviceType | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<DeviceType | null>(null);
  const [formData, setFormData] = useState({
    planCode: '',
    description: '',
    characteristics: '',
    brandModel: '',
    clasificacionId: '',
  });

  const resetForm = () => {
    setFormData({ planCode: '', description: '', characteristics: '', brandModel: '', clasificacionId: '' });
    setCurrentType(null);
  };

  const openNewType = () => { resetForm(); setIsPanelOpen(true); };

  const handleEdit = (type: DeviceType) => {
    setCurrentType(type);
    setFormData({
      planCode: type.planCode,
      description: type.description,
      characteristics: type.characteristics,
      brandModel: type.brandModel,
      clasificacionId: type.clasificacionId ?? '',
    });
    setIsPanelOpen(true);
  };

  const handleSave = () => {
    if (!formData.planCode.trim() || !formData.description.trim()) {
      toast.error('El código y la descripción son requeridos');
      return;
    }

    const payload = {
      planCode: formData.planCode,
      description: formData.description,
      characteristics: formData.characteristics,
      brandModel: formData.brandModel,
      clasificacionId: formData.clasificacionId || undefined,
    };

    const request = currentType
      ? updateDeviceType(currentType.id, payload)
      : createDeviceType(payload);

    request
      .then(() => {
        toast.success(currentType ? 'Tipo de dispositivo actualizado' : 'Tipo de dispositivo creado');
        setIsPanelOpen(false);
        resetForm();
      })
      .catch(() => toast.error('No se pudo guardar el tipo de dispositivo'));
  };

  const handleDeleteClick = (type: DeviceType) => { setTypeToDelete(type); setIsDeleteConfirmOpen(true); };

  const handleDeleteConfirm = () => {
    if (!typeToDelete) return;
    deleteDeviceType(typeToDelete.id)
      .then(() => { toast.success('Tipo de dispositivo eliminado'); setIsDeleteConfirmOpen(false); setTypeToDelete(null); })
      .catch(() => toast.error('No se pudo eliminar el tipo de dispositivo'));
  };

  const getBadgeStatus = (planCode: string) => {
    if (planCode.startsWith('Ex')) return 'Transfer';
    if (planCode.startsWith('E')) return 'New';
    return null;
  };

  const clasifName = (id?: string) => clasificaciones.find((c) => c.id === id)?.name;
  const clasifColor = (name?: string) => (name && CLASIF_COLORS[name]) ? CLASIF_COLORS[name] : 'bg-gray-100 text-gray-600';

  const filtered = filterClasifId ? types.filter((t) => t.clasificacionId === filterClasifId) : types;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tipos de Dispositivos (Leyenda)</h1>
        <button onClick={openNewType} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Tipo
        </button>
      </div>

      {clasificaciones.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
          <select className="input-field w-52" value={filterClasifId} onChange={(e) => setFilterClasifId(e.target.value)}>
            <option value="">Todas las clasificaciones</option>
            {clasificaciones.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Código Plan</th>
                <th className="px-6 py-3 font-medium">Clasificación</th>
                <th className="px-6 py-3 font-medium">Descripción</th>
                <th className="px-6 py-3 font-medium">Características</th>
                <th className="px-6 py-3 font-medium">Marca-Modelo</th>
                <th className="px-6 py-3 font-medium text-center">Imagen</th>
                <th className="px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((type) => {
                const status = getBadgeStatus(type.planCode);
                const name = clasifName(type.clasificacionId);
                return (
                  <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{type.planCode}</span>
                        {status && <Badge status={status as 'New' | 'Transfer'} />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {name
                        ? <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${clasifColor(name)}`}>{name}</span>
                        : <span className="text-gray-400 text-xs">-</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-gray-700">{type.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="max-w-[200px] whitespace-pre-wrap" title={type.characteristics}>
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
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No hay datos registrados aún</td>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Plan *</label>
              <input type="text" className="input-field" value={formData.planCode}
                onChange={(e) => setFormData({ ...formData, planCode: e.target.value })} placeholder="Ej: E1, M5, Ex2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clasificación</label>
              <select className="input-field" value={formData.clasificacionId}
                onChange={(e) => setFormData({ ...formData, clasificacionId: e.target.value })}>
                <option value="">Sin clasificación</option>
                {clasificaciones.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <input type="text" className="input-field" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Características</label>
              <textarea className="input-field min-h-[100px] resize-y" value={formData.characteristics}
                onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca-Modelo</label>
              <input type="text" className="input-field" value={formData.brandModel}
                onChange={(e) => setFormData({ ...formData, brandModel: e.target.value })} />
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
