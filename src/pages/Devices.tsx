'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Device, DeviceCreatePayload, DeviceUpdatePayload } from '../lib/types';
import { useDevices } from '../hooks/useDevices';

export function Devices() {
  const {
    devices,
    deviceTypes,
    offices,
    page,
    setPage,
    totalPages,
    loading,
    catalogLoading,
    createDevice,
    updateDevice,
    deleteDevice,
  } = useDevices();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    status: '',
    typeId: '',
    inventoryCodes: [''],
    destinationOfficeId: '',
    originOfficeDescription: '',
    quantity: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredDeviceTypesSearch = useMemo(() => {
    if (!statusFilter) return deviceTypes;
    if (statusFilter === 'New') return deviceTypes.filter((type) => !type.planCode.startsWith('Ex'));
    return deviceTypes.filter((type) => type.planCode.startsWith('Ex'));
  }, [statusFilter, deviceTypes]);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        device.inventoryCode.toLowerCase().includes(search.toLowerCase()) ||
        device.planCode.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter ? device.typeId === typeFilter : true;
      const matchesStatus = statusFilter ? device.status === statusFilter : true;
      const matchesFloor = floorFilter ? device.floor.toString() === floorFilter : true;
      return matchesSearch && matchesType && matchesStatus && matchesFloor;
    });
  }, [devices, search, typeFilter, statusFilter, floorFilter]);

  const selectedType = deviceTypes.find((type) => type.id === formData.typeId);
  const isTransfer = formData.status === 'Transfer';

  const filteredModalDeviceTypes = useMemo(() => {
    if (!formData.status) return [];
    if (formData.status === 'New') return deviceTypes.filter((type) => !type.planCode.startsWith('Ex'));
    return deviceTypes.filter((type) => type.planCode.startsWith('Ex'));
  }, [formData.status, deviceTypes]);

  const floors = Array.from(new Set(offices.map((office) => office.floor))).sort((a, b) => a - b);

  const resetForm = () => {
    setFormData({
      status: '',
      typeId: '',
      inventoryCodes: [''],
      destinationOfficeId: '',
      originOfficeDescription: '',
      quantity: 1,
    });
    setErrors({});
    setEditingDevice(null);
  };

  const openNewDevice = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditDevice = (device: Device) => {
    const deviceType = deviceTypes.find((type) => type.id === device.typeId);
    const deviceStatus = deviceType?.planCode.startsWith('Ex') ? 'Transfer' : 'New';
    setEditingDevice(device);
    setFormData({
      status: deviceStatus,
      typeId: device.typeId,
      inventoryCodes: [device.inventoryCode],
      destinationOfficeId: device.destinationOfficeId,
      originOfficeDescription: device.originOfficeDescription || device.originOfficeId || '',
      quantity: 1,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.status) newErrors.status = 'Estado es requerido';
    if (!formData.typeId) newErrors.typeId = 'Tipo es requerido';
    if (!formData.destinationOfficeId) newErrors.destinationOfficeId = 'Oficina destino es requerida';
    if (isTransfer && !formData.originOfficeDescription.trim()) newErrors.originOfficeDescription = 'Descripción de origen es requerida para traslados';
    if (!editingDevice && (!Number.isInteger(Number(formData.quantity)) || Number(formData.quantity) < 1 || Number(formData.quantity) > 999)) {
      newErrors.quantity = 'Cantidad válida entre 1 y 999 es requerida';
    }

    if (!editingDevice) {
      const quantity = Number(formData.quantity || 1);
      const normalizedCodes = formData.inventoryCodes.slice(0, quantity).map((code) => code.trim());

      if (quantity > 1 && normalizedCodes.some((code) => !code)) {
        newErrors.inventoryCodes = 'Completa el código de inventario de cada dispositivo';
      }

      if (quantity === 1 && !normalizedCodes[0]) {
        newErrors.inventoryCodes = 'Código de inventario es requerido';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedType) {
      toast.error('Tipo de dispositivo inválido');
      return;
    }

    const quantity = editingDevice ? 1 : Number(formData.quantity || 1);
    const inventoryCodes = editingDevice
      ? [formData.inventoryCodes[0]?.trim() || '']
      : Array.from({ length: quantity }, (_, index) => (formData.inventoryCodes[index] || '').trim());

    const createPayload: DeviceCreatePayload = {
      inventoryCode: inventoryCodes[0],
      inventoryCodes,
      typeId: formData.typeId,
      destinationOfficeId: formData.destinationOfficeId,
      originOfficeDescription: isTransfer ? formData.originOfficeDescription.trim() : undefined,
      quantity,
    };
    const updatePayload: DeviceUpdatePayload = {
      inventoryCode: inventoryCodes[0],
      typeId: formData.typeId,
      destinationOfficeId: formData.destinationOfficeId,
      originOfficeDescription: isTransfer ? formData.originOfficeDescription.trim() : undefined,
    };

    const request = editingDevice ? updateDevice(editingDevice.id, updatePayload) : createDevice(createPayload);

    request
      .then((response) => {
        const createdCount = response?.created || 1;
        toast.success(
          editingDevice
            ? 'Dispositivo actualizado'
            : createdCount > 1
              ? `${createdCount} dispositivos creados`
              : 'Dispositivo creado',
        );
        setIsModalOpen(false);
        resetForm();
      })
      .catch((error) => {
        console.error('Error saving device', error);
        toast.error('No se pudo guardar el dispositivo');
      });
  };

  const handleDeleteClick = (device: Device) => {
    setDeviceToDelete(device);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deviceToDelete) return;

    deleteDevice(deviceToDelete.id)
      .then(() => {
        toast.success('Dispositivo eliminado');
        setIsDeleteConfirmOpen(false);
        setDeviceToDelete(null);
      })
      .catch((error) => {
        console.error('Error deleting device', error);
        toast.error('No se pudo eliminar el dispositivo');
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dispositivos</h1>
        <button onClick={openNewDevice} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Dispositivo
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar código o plan..."
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-36"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setTypeFilter('');
          }}
        >
          <option value="">Todos los estados</option>
          <option value="New">Nuevo</option>
          <option value="Transfer">Traslado</option>
        </select>
        <select
          className="input-field w-48"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          {filteredDeviceTypesSearch.map((type) => (
            <option key={type.id} value={type.id}>
              {type.planCode} - {type.description}
            </option>
          ))}
        </select>
        <select
          className="input-field w-32"
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
        >
          <option value="">Todos los pisos</option>
          {floors.map((floor) => (
            <option key={floor} value={floor}>
              Piso {floor}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Código Inventario</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Tipo</th>
                <th className="px-6 py-3 font-medium">Estado</th>
                <th className="px-6 py-3 font-medium">Piso</th>
                <th className="px-6 py-3 font-medium">Destino</th>
                <th className="px-6 py-3 font-medium">Origen</th>
                <th className="px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDevices.map((device) => {
                const type = deviceTypes.find((item) => item.id === device.typeId);
                const destination = offices.find((office) => office.id === device.destinationOfficeId);
                const origin = offices.find((office) => office.id === device.originOfficeId);
                return (
                  <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {device.inventoryCode || <span className="text-gray-400 italic">S/C</span>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-600">{device.planCode}</td>
                    <td className="px-6 py-4 text-gray-700">{type?.description || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge status={device.status} />
                    </td>
                    <td className="px-6 py-4">{device.floor}</td>
                    <td className="px-6 py-4">{destination?.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{device.originOfficeDescription || origin?.name || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditDevice(device)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(device)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredDevices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No hay datos registrados aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1 || loading || catalogLoading}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-gray-600">
          Página {page} de {totalPages}
        </span>
        <button
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages || loading || catalogLoading}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingDevice ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
            <select
              value={formData.status}
              onChange={(e) => {
                setFormData({ ...formData, status: e.target.value, typeId: '' });
                setErrors({ ...errors, status: '', typeId: '' });
              }}
              className={`input-field ${errors.status ? 'border-red-500' : ''}`}
            >
              <option value="">Seleccionar estado...</option>
              <option value="New">Nuevo</option>
              <option value="Transfer">Traslado</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Dispositivo *</label>
            <select
              value={formData.typeId}
              onChange={(e) => {
                setFormData({ ...formData, typeId: e.target.value });
                setErrors({ ...errors, typeId: '' });
              }}
              className={`input-field ${errors.typeId ? 'border-red-500' : ''}`}
              disabled={!formData.status}
            >
              <option value="">Seleccionar tipo...</option>
              {filteredModalDeviceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.planCode} - {type.description}
                </option>
              ))}
            </select>
            {errors.typeId && <p className="text-red-500 text-sm mt-1">{errors.typeId}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Inventario</label>
            <div className="space-y-3">
              {(editingDevice ? 1 : Math.max(1, Number(formData.quantity || 1))).toString() &&
                Array.from({ length: editingDevice ? 1 : Math.max(1, Number(formData.quantity || 1)) }, (_, index) => (
                  <input
                    key={index}
                    type="text"
                    value={formData.inventoryCodes[index] || ''}
                    onChange={(e) => {
                      const nextCodes = [...formData.inventoryCodes];
                      nextCodes[index] = e.target.value;
                      setFormData({ ...formData, inventoryCodes: nextCodes });
                      setErrors({ ...errors, inventoryCodes: '' });
                    }}
                    placeholder={editingDevice ? 'Ej: INV-2026-001' : `Código ${index + 1}`}
                    className="input-field"
                  />
                ))}
            </div>
            {errors.inventoryCodes && <p className="text-red-500 text-sm mt-1">{errors.inventoryCodes}</p>}
          </div>

          {!editingDevice && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
              <input
                type="number"
                min="1"
                max="999"
                value={formData.quantity}
                onChange={(e) => {
                  const nextQuantity = Number(e.target.value);
                  const nextCodes = Array.from({ length: Math.max(1, nextQuantity || 1) }, (_, index) => formData.inventoryCodes[index] || '');
                  setFormData({ ...formData, quantity: nextQuantity, inventoryCodes: nextCodes });
                  setErrors({ ...errors, quantity: '' });
                }}
                className={`input-field ${errors.quantity ? 'border-red-500' : ''}`}
              />
              <p className="text-xs text-gray-500 mt-1">Si ingresas más de 1, aparecerá un campo por cada dispositivo para que indiques un código independiente.</p>
              {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>
          )}

          {isTransfer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de Origen *</label>
              <textarea
                value={formData.originOfficeDescription}
                onChange={(e) => {
                  setFormData({ ...formData, originOfficeDescription: e.target.value });
                  setErrors({ ...errors, originOfficeDescription: '' });
                }}
                className={`input-field min-h-[96px] ${errors.originOfficeDescription ? 'border-red-500' : ''}`}
                placeholder="Ej: Piso 3, oficina de archivo / oficina aún no registrada"
              />
              <p className="text-xs text-gray-500 mt-1">Escribe una descripción libre del origen. No depende del catálogo de oficinas.</p>
              {errors.originOfficeDescription && <p className="text-red-500 text-sm mt-1">{errors.originOfficeDescription}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oficina Destino *</label>
            <select
              value={formData.destinationOfficeId}
              onChange={(e) => {
                setFormData({ ...formData, destinationOfficeId: e.target.value });
                setErrors({ ...errors, destinationOfficeId: '' });
              }}
              className={`input-field ${errors.destinationOfficeId ? 'border-red-500' : ''}`}
            >
              <option value="">Seleccionar oficina...</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name} - Piso {office.floor}
                </option>
              ))}
            </select>
            {errors.destinationOfficeId && <p className="text-red-500 text-sm mt-1">{errors.destinationOfficeId}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {editingDevice ? 'Actualizar' : formData.quantity > 1 ? `Crear ${formData.quantity}` : 'Crear'}
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

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">¿Eliminar dispositivo?</p>
              {deviceToDelete && (
                <p className="text-sm text-red-700 mt-1">
                  {deviceToDelete.planCode} - {deviceTypes.find((type) => type.id === deviceToDelete.typeId)?.description}
                  {deviceToDelete.inventoryCode && ` (${deviceToDelete.inventoryCode})`}
                </p>
              )}
              <p className="text-sm text-red-700 mt-2">Esta acción no se puede deshacer.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeleteConfirm}
              className="flex-1 bg-red-600 text-white font-medium py-2 rounded-lg hover:bg-red-700 transition"
            >
              Eliminar
            </button>
            <button
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Devices;
