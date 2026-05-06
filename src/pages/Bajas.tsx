'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle, ListPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { getErrorMessage } from '../lib/errorMessages';
import { Baja } from '../lib/types';
import { useAreas } from '../hooks/useAreas';
import { useBajas } from '../hooks/useBajas';
import { useDependencias } from '../hooks/useDependencias';
import { usePagination } from '../hooks/usePagination';

interface BulkRow {
  areaId: string;
  inventoryCode: string;
  description: string;
  officeName: string;
  origin: string;
  reason: string;
}

const emptyRow = (): BulkRow => ({ areaId: '', inventoryCode: '', description: '', officeName: '', origin: '', reason: '' });

export function Bajas() {
  const { areas, loading: areasLoading } = useAreas();
  const { dependencias } = useDependencias();
  const { bajas, loading, createBaja, createBajas, updateBaja, deleteBaja } = useBajas();

  // Single baja modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBaja, setEditingBaja] = useState<Baja | null>(null);
  const [formData, setFormData] = useState({
    areaId: '',
    inventoryCode: '',
    description: '',
    officeName: '',
    origin: '',
    reason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Bulk baja modal
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([emptyRow()]);
  const [bulkErrors, setBulkErrors] = useState<Record<string, string>>();

  // Delete confirm modal
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [bajaToDelete, setBajaToDelete] = useState<Baja | null>(null);

  // Filter state
  const [filterDepId, setFilterDepId]   = useState('');
  const [filterAreaId, setFilterAreaId] = useState('');

  // Cascading filter: areas filtered by selected dependencia
  const filteredAreasForFilter = filterDepId
    ? areas.filter((a) => a.dependenciaId === filterDepId)
    : areas;

  const filteredBajas = useMemo(() => bajas.filter((baja) => {
    if (filterAreaId && baja.areaId !== filterAreaId) return false;
    if (filterDepId) {
      const area = areas.find((a) => a.id === baja.areaId);
      if (area?.dependenciaId !== filterDepId) return false;
    }
    return true;
  }), [bajas, areas, filterAreaId, filterDepId]);

  const { paginatedItems: pagedBajas, page, setPage, pageSize, setPageSize, totalPages, totalItems } = usePagination(filteredBajas, 10);

  // ── Single modal helpers ───────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({ areaId: '', inventoryCode: '', description: '', officeName: '', origin: '', reason: '' });
    setErrors({});
    setEditingBaja(null);
  };

  const openNewBaja = () => { resetForm(); setIsModalOpen(true); };

  const openEditBaja = (baja: Baja) => {
    setEditingBaja(baja);
    setFormData({
      areaId: baja.areaId,
      inventoryCode: baja.inventoryCode,
      description: baja.description,
      officeName: baja.officeName,
      origin: baja.origin,
      reason: baja.reason,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.areaId) nextErrors.areaId = 'Subgerencia es requerida';
    if (!formData.description.trim()) nextErrors.description = 'Descripción es requerida';
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }

    try {
      const payload = {
        areaId: formData.areaId,
        codigoInventario: formData.inventoryCode || undefined,
        descripcion: formData.description,
        oficinaNombre: formData.officeName || undefined,
        origen: formData.origin || undefined,
        motivo: formData.reason || undefined,
      };
      if (editingBaja) {
        await updateBaja(editingBaja.id, payload);
        toast.success('Baja actualizada');
      } else {
        await createBaja(payload);
        toast.success('Baja creada');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error(`No se pudo guardar la baja: ${getErrorMessage(err)}`);
    }
  };

  // ── Bulk modal helpers ─────────────────────────────────────────────────────

  const openBulkModal = () => { 
    setBulkRows([emptyRow()]); 
    setBulkErrors({}); 
    setIsBulkModalOpen(true); 
  };

  const updateBulkRow = (index: number, field: keyof BulkRow, value: string) =>
    setBulkRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const addBulkRow = () => setBulkRows((prev) => [...prev, emptyRow()]);

  const removeBulkRow = (index: number) => {
    if (bulkRows.length === 1) return;
    setBulkRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkSave = async () => {
    const nextErrors: Record<string, string> = {};
    const validRows = bulkRows.filter((r) => r.description.trim());
    if (validRows.length === 0) nextErrors.rows = 'Al menos un ítem debe tener descripción';
    if (validRows.some((r) => !r.areaId)) nextErrors.areaId = 'Cada ítem debe tener subgerencia seleccionada';
    if (Object.keys(nextErrors).length > 0) { setBulkErrors(nextErrors); return; }

    try {
      await createBajas(validRows.map((row) => ({
        areaId: row.areaId,
        codigoInventario: row.inventoryCode || undefined,
        descripcion: row.description,
        oficinaNombre: row.officeName || undefined,
        origen: row.origin || undefined,
        motivo: row.reason || undefined,
      })));
      toast.success(`${validRows.length} baja${validRows.length > 1 ? 's' : ''} registrada${validRows.length > 1 ? 's' : ''}`);
      setIsBulkModalOpen(false);
      setBulkRows([emptyRow()]);
    } catch (err) {
      toast.error(`No se pudo guardar las bajas: ${getErrorMessage(err)}`);
    }
  };

  // ── Delete helpers ─────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    if (!bajaToDelete) return;
    try {
      await deleteBaja(bajaToDelete.id);
      toast.success('Baja eliminada');
      setIsDeleteConfirmOpen(false);
      setBajaToDelete(null);
    } catch (err) {
      toast.error(`No se pudo eliminar la baja: ${getErrorMessage(err)}`);
    }
  };

  const areaNameById = (areaId: string) => areas.find((a) => a.id === areaId)?.name || '-';
  const depNameByAreaId = (areaId: string) => {
    const depId = areas.find((a) => a.id === areaId)?.dependenciaId;
    return dependencias.find((d) => d.id === depId)?.name ?? '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bajas</h1>
        <div className="flex gap-2">
          <button onClick={openBulkModal} className="btn-secondary flex items-center gap-2">
            <ListPlus className="w-4 h-4" /> Baja Múltiple
          </button>
          <button onClick={openNewBaja} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva Baja
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <select className="input-field w-48" value={filterDepId}
          onChange={(e) => { setFilterDepId(e.target.value); setFilterAreaId(''); }}>
          <option value="">Todas las dependencias</option>
          {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input-field w-56" value={filterAreaId} onChange={(e) => setFilterAreaId(e.target.value)}>
          <option value="">Todas las subgerencias</option>
          {filteredAreasForFilter.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">Subgerencia</th>
                <th className="px-6 py-3 font-medium">Código</th>
                <th className="px-6 py-3 font-medium">Descripción</th>
                <th className="px-6 py-3 font-medium">Oficina</th>
                <th className="px-6 py-3 font-medium">Origen</th>
                <th className="px-6 py-3 font-medium">Motivo</th>
                <th className="px-6 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedBajas.map((baja) => (
                <tr key={baja.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{areaNameById(baja.areaId)}</div>
                    <div className="text-xs text-gray-400">{depNameByAreaId(baja.areaId)}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{baja.inventoryCode || '-'}</td>
                  <td className="px-6 py-4 text-gray-700">{baja.description}</td>
                  <td className="px-6 py-4 text-gray-500">{baja.officeName || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{baja.origin || '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{baja.reason || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEditBaja(baja)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setBajaToDelete(baja); setIsDeleteConfirmOpen(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredBajas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No hay bajas registradas aún</td>
                </tr>
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

      {/* Single baja modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingBaja ? 'Editar Baja' : 'Nueva Baja'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subgerencia *</label>
            <select value={formData.areaId} onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
              className={`input-field ${errors.areaId ? 'border-red-500' : ''}`} disabled={areasLoading}>
              <option value="">Seleccionar subgerencia...</option>
              {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
            </select>
            {errors.areaId && <p className="text-red-500 text-sm mt-1">{errors.areaId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código de Inventario</label>
            <input type="text" value={formData.inventoryCode} onChange={(e) => setFormData({ ...formData, inventoryCode: e.target.value })}
              className="input-field" placeholder="Ej: BAJ-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`input-field min-h-[96px] ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Descripción del bien a dar de baja" />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oficina</label>
            <input type="text" value={formData.officeName} onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
              className="input-field" placeholder="Ej: Mesa de partes" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
            <input type="text" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="input-field" placeholder="Ej: Equipo obsoleto / averiado" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="input-field min-h-[80px]" placeholder="Motivo de la baja" />
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">
              {editingBaja ? 'Actualizar' : 'Crear'}
            </button>
            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk baja modal */}
      <Modal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} title="Baja Múltiple">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">Ítems a dar de baja</label>
              <button type="button" onClick={addBulkRow}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                <Plus className="w-3.5 h-3.5" /> Agregar ítem
              </button>
            </div>
            
            {/* Tabla con grid */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-gray-50 border-b border-gray-200 p-2 text-xs font-medium text-gray-600">
                <div className="col-span-1">#</div>
                <div className="col-span-2">Subgerencia *</div>
                <div className="col-span-1.5">Cód. inv.</div>
                <div className="col-span-2">Descripción *</div>
                <div className="col-span-1.5">Oficina</div>
                <div className="col-span-1.5">Origen</div>
                <div className="col-span-1.5">Motivo</div>
                <div className="col-span-0.5"></div>
              </div>
              
              <div className="space-y-0 max-h-96 overflow-y-auto">
                {bulkRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border-b border-gray-100 last:border-b-0">
                    <div className="col-span-1 text-xs text-gray-400 text-center">{index + 1}</div>
                    
                    <select
                      value={row.areaId}
                      onChange={(e) => updateBulkRow(index, 'areaId', e.target.value)}
                      className="col-span-2 input-field text-xs"
                      disabled={areasLoading}
                    >
                      <option value="">Sel...</option>
                      {areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}
                    </select>
                    
                    <input
                      type="text"
                      value={row.inventoryCode}
                      onChange={(e) => updateBulkRow(index, 'inventoryCode', e.target.value)}
                      className="col-span-1.5 input-field text-xs"
                      placeholder="Cód."
                    />
                    
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateBulkRow(index, 'description', e.target.value)}
                      className="col-span-2 input-field text-xs"
                      placeholder="Desc *"
                    />
                    
                    <input
                      type="text"
                      value={row.officeName}
                      onChange={(e) => updateBulkRow(index, 'officeName', e.target.value)}
                      className="col-span-1.5 input-field text-xs"
                      placeholder="Oficina"
                    />
                    
                    <input
                      type="text"
                      value={row.origin}
                      onChange={(e) => updateBulkRow(index, 'origin', e.target.value)}
                      className="col-span-1.5 input-field text-xs"
                      placeholder="Origen"
                    />
                    
                    <input
                      type="text"
                      value={row.reason}
                      onChange={(e) => updateBulkRow(index, 'reason', e.target.value)}
                      className="col-span-1.5 input-field text-xs"
                      placeholder="Motivo"
                    />
                    
                    <button
                      type="button"
                      onClick={() => removeBulkRow(index)}
                      className="col-span-0.5 p-1 text-gray-400 hover:text-red-500 transition"
                      disabled={bulkRows.length === 1}
                      title="Eliminar fila"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {bulkErrors?.rows && <p className="text-red-500 text-sm mt-2">{bulkErrors.rows}</p>}
            {bulkErrors?.areaId && <p className="text-red-500 text-sm mt-2">{bulkErrors.areaId}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleBulkSave} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">
              Registrar bajas
            </button>
            <button onClick={() => setIsBulkModalOpen(false)} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">¿Eliminar baja?</p>
              {bajaToDelete && <p className="text-sm text-red-700 mt-1">{bajaToDelete.description}</p>}
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

export default Bajas;
