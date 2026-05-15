'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, Unplug, ArrowLeftRight, MapPin, Archive, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { ConfirmModal } from '../components/ConfirmModal';
import { FormField } from '../components/FormField';
import { ModalActions } from '../components/ModalActions';
import { Pagination } from '../components/Pagination';
import { Device, DeviceCreatePayload, DeviceUpdatePayload, DeviceHistorialEntry } from '../lib/types';
import { getDeviceHistory } from '../lib/api';
import { useDevices } from '../hooks/useDevices';
import { useClasificaciones } from '../hooks/useClasificaciones';
import { useLocationFilter } from '../hooks/useLocationFilter';
import { usePagination } from '../hooks/usePagination';
import { getErrorMessage } from '../lib/errorMessages';

interface DevicesProps {
  initialStatus?: string;
  initialAsig?: string;
}

export function Devices({ initialStatus = '', initialAsig = '' }: DevicesProps) {
  const {
    devices, deviceTypes, offices, areas, dependencias, loading,
    createDevice, updateDevice, unassignDevice, reassignDevice, swapDevices, deleteDevice, retireDevice,
  } = useDevices();
  const { clasificaciones } = useClasificaciones();

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search,       setSearch]       = useState('');
  const [filterClasif, setFilterClasif] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialStatus);
  const [filterAsig,   setFilterAsig]   = useState(initialAsig);
  const [filterFloor,        setFilterFloor]        = useState('');
  const [filterTipoTraslado, setFilterTipoTraslado] = useState('');
  const filterLoc = useLocationFilter({ areas, offices });

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [isDeleteOpen,    setIsDeleteOpen]    = useState(false);
  const [isUnassignOpen,  setIsUnassignOpen]  = useState(false);
  const [isReassignOpen,  setIsReassignOpen]  = useState(false);
  const [isSwapOpen,      setIsSwapOpen]      = useState(false);
  const [isRetireOpen,    setIsRetireOpen]    = useState(false);
  const [retireMotivo,    setRetireMotivo]    = useState('');
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);
  const [historial,       setHistorial]       = useState<DeviceHistorialEntry[]>([]);
  const [historialLoading, setHistorialLoading] = useState(false);

  const [editing,      setEditing]      = useState<Device | null>(null);
  const [actionDevice, setActionDevice] = useState<Device | null>(null);

  // ── Form (create/edit) ──────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    status: '', typeId: '', inventoryCodes: [''],
    destinationOfficeId: '', originOfficeDescription: '', quantity: 1,
    tipoTraslado: '' as '' | 'permanente' | 'redistribuido',
    destinoRedistribucion: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formLoc     = useLocationFilter({ areas, offices });
  const reassignLoc = useLocationFilter({ areas, offices });

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredDevices = useMemo(() => devices.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      if (!d.inventoryCode.toLowerCase().includes(q) && !d.planCode.toLowerCase().includes(q)) return false;
    }
    if (filterStatus && d.status !== filterStatus) return false;
    if (filterAsig && d.asignacion !== filterAsig) return false;
    if (filterTipoTraslado && d.tipoTraslado !== filterTipoTraslado) return false;
    if (filterClasif) {
      const tipo = deviceTypes.find((t) => t.id === d.typeId);
      if (tipo?.clasificacionId !== filterClasif) return false;
    }
    if (filterLoc.officeId || filterLoc.areaId || filterLoc.depId || filterFloor) {
      const office = offices.find((o) => o.id === d.destinationOfficeId);
      if (!office) return filterAsig === 'pendiente' || !d.destinationOfficeId;
      if (filterLoc.officeId && office.id !== filterLoc.officeId) return false;
      if (filterLoc.areaId && office.areaId !== filterLoc.areaId) return false;
      if (filterFloor && office.floor.toString() !== filterFloor) return false;
      if (filterLoc.depId) {
        const area = areas.find((a) => a.id === office.areaId);
        if (area?.dependenciaId !== filterLoc.depId) return false;
      }
    }
    return true;
  }), [devices, search, filterStatus, filterAsig, filterClasif, filterFloor, filterTipoTraslado, filterLoc.officeId, filterLoc.areaId, filterLoc.depId, offices, areas, deviceTypes]);

  const { paginatedItems: pagedDevices, page, setPage, pageSize, setPageSize, totalPages, totalItems } = usePagination(filteredDevices, 10);

  const swapCandidates = useMemo(() => {
    if (!actionDevice) return [];
    return devices.filter(
      (d) => d.typeId === actionDevice.typeId && d.asignacion === 'asignado'
        && d.destinationOfficeId !== actionDevice.destinationOfficeId && d.id !== actionDevice.id
    );
  }, [devices, actionDevice]);

  const typesForCurrentStatus = useMemo(() => {
    const s = formData.status || editing?.status;
    if (!s) return deviceTypes;
    if (s === 'New') return deviceTypes.filter((t) => !t.planCode.startsWith('Ex'));
    return deviceTypes.filter((t) => t.planCode.startsWith('Ex'));
  }, [formData.status, editing, deviceTypes]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const officeName = (id: string) => offices.find((o) => o.id === id)?.name ?? '-';
  const clasifName = (id?: string) => clasificaciones.find((c) => c.id === id)?.name ?? '';

  const FURNITURE_KEYWORDS = ['mueble', 'mobiliario', 'otro'];
  const selectedType   = deviceTypes.find((t) => t.id === formData.typeId);
  const selectedClasif = clasificaciones.find((c) => c.id === selectedType?.clasificacionId);
  const isFurnitureLike = Boolean(
    selectedClasif &&
    FURNITURE_KEYWORDS.some((k) => selectedClasif.name.toLowerCase().includes(k)),
  );

  const generateFurnitureCodes = (typeId: string, officeId: string, qty: number): string[] => {
    const type   = deviceTypes.find((t) => t.id === typeId);
    const office = offices.find((o) => o.id === officeId);
    if (!type || !office) return Array(qty).fill('') as string[];
    const officeAbbrev = office.name.split(/\s+/).map((w) => w[0]?.toUpperCase() ?? '').join('').slice(0, 4);
    const typeAbbrev   = type.description.slice(0, 3).toUpperCase();
    const existing     = devices.filter((d) => d.typeId === typeId && d.destinationOfficeId === officeId).length;
    return Array.from({ length: qty }, (_, i) =>
      `${officeAbbrev}-${typeAbbrev}-${String(existing + i + 1).padStart(3, '0')}`,
    );
  };

  // ── Create/Edit form ─────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ status: '', typeId: '', inventoryCodes: [''], destinationOfficeId: '', originOfficeDescription: '', quantity: 1, tipoTraslado: '', destinoRedistribucion: '' });
    setErrors({}); setEditing(null); formLoc.reset();
  };

  const openNew = () => { resetForm(); setIsModalOpen(true); };
  const openEdit = (d: Device) => {
    setEditing(d);
    setFormData({
      status: d.status, typeId: d.typeId, inventoryCodes: [d.inventoryCode],
      destinationOfficeId: d.destinationOfficeId,
      originOfficeDescription: d.originOfficeDescription ?? '', quantity: 1,
      tipoTraslado: d.tipoTraslado ?? '',
      destinoRedistribucion: d.destinoRedistribucion ?? '',
    });
    setErrors({}); setIsModalOpen(true);
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!formData.typeId) errs.typeId = 'Tipo es requerido';
    if (!editing && !formData.status) errs.status = 'Estado es requerido';
    if (!editing && !formData.destinationOfficeId) errs.destinationOfficeId = 'Área es requerida';
    if (!editing && formData.status === 'Transfer' && !formData.originOfficeDescription.trim())
      errs.originOfficeDescription = 'Dirección de origen es requerida para traslados';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      const isTransfer = formData.status === 'Transfer' || editing?.status === 'Transfer';
      if (editing) {
        const payload: DeviceUpdatePayload = {
          inventoryCode: formData.inventoryCodes[0] || undefined,
          typeId: formData.typeId,
          destinationOfficeId: formData.destinationOfficeId || undefined,
          originOfficeDescription: formData.originOfficeDescription || undefined,
          ...(isTransfer && {
            tipoTraslado: formData.tipoTraslado || null,
            destinoRedistribucion: formData.destinoRedistribucion || undefined,
          }),
        };
        await updateDevice(editing.id, payload);
        toast.success('Dispositivo actualizado');
      } else {
        const codes = isFurnitureLike
          ? generateFurnitureCodes(formData.typeId, formData.destinationOfficeId, formData.quantity)
          : formData.inventoryCodes.filter(Boolean);
        const payload: DeviceCreatePayload = {
          status: formData.status as 'New' | 'Transfer', typeId: formData.typeId,
          destinationOfficeId: formData.destinationOfficeId,
          originOfficeDescription: formData.originOfficeDescription || undefined,
          inventoryCodes: codes,
          quantity: formData.quantity,
          ...(isTransfer && {
            tipoTraslado: formData.tipoTraslado || null,
            destinoRedistribucion: formData.destinoRedistribucion || undefined,
          }),
        };
        const res = await createDevice(payload);
        toast.success(`${res.created} dispositivo(s) creado(s)`);
      }
      setIsModalOpen(false); resetForm();
    } catch (err) { toast.error(`No se pudo guardar el dispositivo: ${getErrorMessage(err)}`); }
  };

  const handleUnassign = async () => {
    if (!actionDevice) return;
    try {
      await unassignDevice(actionDevice.id);
      toast.success('Dispositivo desasignado (pendiente)');
      setIsUnassignOpen(false); setActionDevice(null);
    } catch (err) { toast.error(`No se pudo desasignar: ${getErrorMessage(err)}`); }
  };

  const handleReassign = async () => {
    if (!actionDevice || !reassignLoc.officeId) { toast.error('Selecciona un área destino'); return; }
    try {
      await reassignDevice(actionDevice.id, reassignLoc.officeId);
      toast.success('Dispositivo reasignado');
      setIsReassignOpen(false); setActionDevice(null); reassignLoc.reset();
    } catch (err) { toast.error(`No se pudo reasignar: ${getErrorMessage(err)}`); }
  };

  const handleSwap = async () => {
    if (!actionDevice || !swapTargetId) { toast.error('Selecciona un dispositivo'); return; }
    try {
      await swapDevices(actionDevice.id, swapTargetId);
      toast.success('Intercambio realizado');
      setIsSwapOpen(false); setActionDevice(null); setSwapTargetId('');
    } catch (err) { toast.error(`No se pudo realizar el intercambio: ${getErrorMessage(err)}`); }
  };

  const handleDelete = async () => {
    if (!actionDevice) return;
    try {
      await deleteDevice(actionDevice.id);
      toast.success('Dispositivo eliminado');
      setIsDeleteOpen(false); setActionDevice(null);
    } catch (err) { toast.error(`No se pudo eliminar el dispositivo: ${getErrorMessage(err)}`); }
  };

  const openHistorial = async (device: Device) => {
    setActionDevice(device);
    setHistorial([]); setHistorialLoading(true); setIsHistorialOpen(true);
    try {
      const data = await getDeviceHistory(device.id);
      setHistorial(data);
    } catch { toast.error('No se pudo cargar el historial'); }
    finally { setHistorialLoading(false); }
  };

  const handleRetire = async () => {
    if (!actionDevice || !retireMotivo.trim()) { toast.error('El motivo es requerido'); return; }
    try {
      await retireDevice(actionDevice.id, retireMotivo.trim());
      toast.success('Dispositivo dado de baja');
      setIsRetireOpen(false); setActionDevice(null); setRetireMotivo('');
    } catch (err) { toast.error(`No se pudo dar de baja: ${getErrorMessage(err)}`); }
  };

  const [swapTargetId, setSwapTargetId] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dispositivos</h1>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Dispositivo
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Código o plan..."
            className="input-field pl-9 w-full sm:w-40" />
        </div>
        <select className="input-field w-full sm:w-36" value={filterLoc.depId}
          onChange={(e) => filterLoc.setDepId(e.target.value)}>
          <option value="">Dependencia</option>
          {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input-field w-full sm:w-48" value={filterLoc.areaId} onChange={(e) => filterLoc.setAreaId(e.target.value)}>
          <option value="">Subgerencia</option>
          {filterLoc.filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="input-field w-full sm:w-48" value={filterLoc.officeId} onChange={(e) => filterLoc.setOfficeId(e.target.value)}>
          <option value="">Área</option>
          {filterLoc.filteredOffices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select className="input-field w-full sm:w-28" value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
          <option value="">Piso</option>
          {[...new Set(offices.map((o) => o.floor))].sort((a, b) => a - b).map((f) => (
            <option key={f} value={f}>Piso {f}</option>
          ))}
        </select>
        <select className="input-field w-full sm:w-36" value={filterClasif} onChange={(e) => setFilterClasif(e.target.value)}>
          <option value="">Clasificación</option>
          {clasificaciones.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input-field w-full sm:w-28" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Estado</option>
          <option value="New">Nuevo</option>
          <option value="Transfer">Traslado</option>
        </select>
        <select className="input-field w-full sm:w-36" value={filterTipoTraslado} onChange={(e) => setFilterTipoTraslado(e.target.value)}>
          <option value="">Tipo traslado</option>
          <option value="permanente">Permanente</option>
          <option value="redistribuido">Redistribuido</option>
        </select>
        <select className="input-field w-full sm:w-32" value={filterAsig} onChange={(e) => setFilterAsig(e.target.value)}>
          <option value="">Asignación</option>
          <option value="asignado">Asignado</option>
          <option value="pendiente">Pendiente</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Plan</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Clasificación</th>
                <th className="px-4 py-3 font-medium">Área destino</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Origen</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-center hidden sm:table-cell">Asignación</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedDevices.map((device) => {
                const tipo = deviceTypes.find((t) => t.id === device.typeId);
                return (
                  <tr key={device.id} className={`hover:bg-gray-50 transition-colors ${device.asignacion === 'pendiente' ? 'bg-yellow-50/40' : ''}`}>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{device.inventoryCode || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 hidden sm:table-cell">{device.planCode}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{clasifName(tipo?.clasificacionId)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{device.destinationOfficeId ? officeName(device.destinationOfficeId) : <span className="text-yellow-600 font-medium">Sin asignar</span>}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate hidden md:table-cell" title={device.originOfficeDescription}>{device.originOfficeDescription || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge status={device.status} />
                      {device.status === 'Transfer' && device.tipoTraslado && (
                        <span className={`block text-xs px-1.5 py-0.5 rounded-full mt-0.5 ${
                          device.tipoTraslado === 'redistribuido' ? 'bg-purple-50 text-purple-700' : 'bg-teal-50 text-teal-700'
                        }`}>
                          {device.tipoTraslado === 'redistribuido' ? 'Redistribuido' : 'Permanente'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${device.asignacion === 'asignado' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {device.asignacion === 'asignado' ? 'Asignado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEdit(device)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openHistorial(device)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition" title="Ver historial"><Clock className="w-3.5 h-3.5" /></button>
                        {device.asignacion === 'asignado' && device.destinationOfficeId && (
                          <button onClick={() => { setActionDevice(device); setIsUnassignOpen(true); }} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Desasignar"><Unplug className="w-3.5 h-3.5" /></button>
                        )}
                        {device.asignacion === 'asignado' && device.destinationOfficeId && (
                          <button onClick={() => { setActionDevice(device); setSwapTargetId(''); setIsSwapOpen(true); }} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Intercambiar"><ArrowLeftRight className="w-3.5 h-3.5" /></button>
                        )}
                        {device.asignacion === 'pendiente' && (
                          <button onClick={() => { setActionDevice(device); reassignLoc.reset(); setIsReassignOpen(true); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Reasignar"><MapPin className="w-3.5 h-3.5" /></button>
                        )}
                        {device.asignacion === 'asignado' && (
                          <button onClick={() => { setActionDevice(device); setRetireMotivo(''); setIsRetireOpen(true); }} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Dar de baja"><Archive className="w-3.5 h-3.5" /></button>
                        )}
                        <button onClick={() => { setActionDevice(device); setIsDeleteOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredDevices.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">No hay dispositivos con estos filtros</td></tr>
              )}
              {loading && (
                <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">Cargando...</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page} totalPages={totalPages} totalItems={totalItems}
          pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize}
        />
      </div>

      {/* Create / Edit modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editing ? `Editar Dispositivo ${editing.inventoryCode || editing.planCode}` : 'Nuevo Dispositivo'}>
        <div className="space-y-4">
          {!editing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Estado" error={errors.status}>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value, typeId: '' })}
                  className={`input-field ${errors.status ? 'border-red-500' : ''}`}>
                  <option value="">Seleccionar...</option>
                  <option value="New">Nuevo</option>
                  <option value="Transfer">Traslado</option>
                </select>
              </FormField>
              <FormField label="Cantidad">
                <input type="number" min="1" max="50" value={formData.quantity}
                  onChange={(e) => {
                    const q = Math.max(1, Number(e.target.value));
                    setFormData({ ...formData, quantity: q, inventoryCodes: Array.from({ length: q }, (_, i) => formData.inventoryCodes[i] || '') });
                  }} className="input-field" />
              </FormField>
            </div>
          )}
          <FormField label="Tipo" required error={errors.typeId}>
            <select value={formData.typeId} onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
              className={`input-field ${errors.typeId ? 'border-red-500' : ''}`}>
              <option value="">Seleccionar tipo...</option>
              {typesForCurrentStatus.map((t) => <option key={t.id} value={t.id}>[{t.planCode}] {t.description}</option>)}
            </select>
          </FormField>

          {!editing && (
            <>
              <FormField label="Dependencia">
                <select value={formLoc.depId} onChange={(e) => { formLoc.setDepId(e.target.value); setFormData({ ...formData, destinationOfficeId: '' }); }} className="input-field">
                  <option value="">Sin filtro</option>
                  {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </FormField>
              <FormField label="Subgerencia">
                <select value={formLoc.areaId} onChange={(e) => { formLoc.setAreaId(e.target.value); setFormData({ ...formData, destinationOfficeId: '' }); }} className="input-field">
                  <option value="">Todas</option>
                  {formLoc.filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>
            </>
          )}

          <FormField label={`Área destino${!editing ? ' *' : ''}`} error={errors.destinationOfficeId}>
            <select value={formData.destinationOfficeId} onChange={(e) => setFormData({ ...formData, destinationOfficeId: e.target.value })}
              className={`input-field ${errors.destinationOfficeId ? 'border-red-500' : ''}`}>
              <option value="">Seleccionar área...</option>
              {(editing ? offices : formLoc.filteredOffices).map((o) => <option key={o.id} value={o.id}>{o.name} — Piso {o.floor}</option>)}
            </select>
          </FormField>

          {(formData.status === 'Transfer' || editing?.status === 'Transfer') && (
            <>
              <FormField label={`Dirección de origen${!editing ? ' *' : ''}`} error={errors.originOfficeDescription}>
                <input type="text" value={formData.originOfficeDescription}
                  onChange={(e) => setFormData({ ...formData, originOfficeDescription: e.target.value })}
                  className={`input-field ${errors.originOfficeDescription ? 'border-red-500' : ''}`}
                  placeholder="Dirección o descripción del origen" />
              </FormField>
              <FormField label="Tipo de traslado">
                <div className="flex gap-6 py-1">
                  {(['permanente', 'redistribuido'] as const).map((v) => (
                    <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="tipoTraslado" value={v}
                        checked={formData.tipoTraslado === v}
                        onChange={() => setFormData({ ...formData, tipoTraslado: v, destinoRedistribucion: '' })} />
                      {v === 'permanente' ? 'Permanente' : 'Redistribuido'}
                    </label>
                  ))}
                </div>
              </FormField>
              {formData.tipoTraslado === 'redistribuido' && (
                <FormField label="Destino de redistribución">
                  <input type="text" value={formData.destinoRedistribucion}
                    onChange={(e) => setFormData({ ...formData, destinoRedistribucion: e.target.value })}
                    className="input-field"
                    placeholder="Ej: Edificio Central, Piso 3" />
                </FormField>
              )}
            </>
          )}

          {editing ? (
            <FormField label="Código de inventario">
              <input type="text" value={formData.inventoryCodes[0] ?? ''}
                onChange={(e) => setFormData({ ...formData, inventoryCodes: [e.target.value] })}
                className="input-field" placeholder="Código de inventario (opcional)" />
            </FormField>
          ) : isFurnitureLike ? (
            formData.typeId && formData.destinationOfficeId ? (
              <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 leading-relaxed">
                <span className="font-medium">Códigos a generar: </span>
                {generateFurnitureCodes(formData.typeId, formData.destinationOfficeId, formData.quantity).join(', ')}
              </div>
            ) : (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">Los códigos se generarán automáticamente al seleccionar el área destino.</p>
            )
          ) : (
            <FormField label="Códigos de inventario">
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.inventoryCodes.map((code, i) => (
                  <input key={i} type="text" value={code}
                    onChange={(e) => { const next = [...formData.inventoryCodes]; next[i] = e.target.value; setFormData({ ...formData, inventoryCodes: next }); }}
                    className="input-field" placeholder={`Código ${i + 1} (opcional)`} />
                ))}
              </div>
            </FormField>
          )}

          <ModalActions onConfirm={handleSave} onCancel={() => { setIsModalOpen(false); resetForm(); }}
            confirmLabel={editing ? 'Actualizar' : 'Crear'} />
        </div>
      </Modal>

      {/* Unassign confirm (orange, not red — kept as plain Modal) */}
      <Modal isOpen={isUnassignOpen} onClose={() => setIsUnassignOpen(false)} title="Desasignar Dispositivo">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">El dispositivo quedará como Pendiente</p>
              {actionDevice && <p className="text-sm text-orange-700 mt-1">{actionDevice.inventoryCode || actionDevice.planCode} · {officeName(actionDevice.destinationOfficeId)}</p>}
              <p className="text-sm text-orange-700 mt-2">Podrás reasignarlo desde la lista filtrando por "Pendiente".</p>
            </div>
          </div>
          <ModalActions onConfirm={handleUnassign} onCancel={() => setIsUnassignOpen(false)}
            confirmLabel="Desasignar" variant="orange" />
        </div>
      </Modal>

      {/* Reassign modal */}
      <Modal isOpen={isReassignOpen} onClose={() => setIsReassignOpen(false)} title="Reasignar Dispositivo">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Asigna el dispositivo <span className="font-medium">{actionDevice?.inventoryCode || actionDevice?.planCode}</span> a un área.</p>
          <FormField label="Dependencia">
            <select value={reassignLoc.depId} onChange={(e) => reassignLoc.setDepId(e.target.value)} className="input-field">
              <option value="">Sin filtro</option>
              {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
          <FormField label="Subgerencia">
            <select value={reassignLoc.areaId} onChange={(e) => reassignLoc.setAreaId(e.target.value)} className="input-field">
              <option value="">Todas</option>
              {reassignLoc.filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </FormField>
          <FormField label="Área destino" required>
            <select value={reassignLoc.officeId} onChange={(e) => reassignLoc.setOfficeId(e.target.value)} className="input-field">
              <option value="">Seleccionar área...</option>
              {reassignLoc.filteredOffices.map((o) => <option key={o.id} value={o.id}>{o.name} — Piso {o.floor}</option>)}
            </select>
          </FormField>
          <ModalActions onConfirm={handleReassign} onCancel={() => setIsReassignOpen(false)}
            confirmLabel="Reasignar" variant="green" />
        </div>
      </Modal>

      {/* Swap modal */}
      <Modal isOpen={isSwapOpen} onClose={() => setIsSwapOpen(false)} title="Intercambiar Dispositivo">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Intercambia <span className="font-medium">{actionDevice?.inventoryCode || actionDevice?.planCode}</span> ({officeName(actionDevice?.destinationOfficeId ?? '')}) con otro dispositivo del mismo tipo.
          </p>
          {swapCandidates.length === 0 ? (
            <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">No hay otros dispositivos del mismo tipo asignados disponibles para intercambio.</p>
          ) : (
            <FormField label="Dispositivo destino" required>
              <select value={swapTargetId} onChange={(e) => setSwapTargetId(e.target.value)} className="input-field">
                <option value="">Seleccionar dispositivo...</option>
                {swapCandidates.map((d) => (
                  <option key={d.id} value={d.id}>{d.inventoryCode || d.planCode} → {officeName(d.destinationOfficeId)}</option>
                ))}
              </select>
            </FormField>
          )}
          <ModalActions onConfirm={handleSwap} onCancel={() => setIsSwapOpen(false)}
            confirmLabel="Intercambiar" variant="purple" confirmDisabled={!swapTargetId} />
        </div>
      </Modal>

      {/* Historial de movimientos */}
      <Modal isOpen={isHistorialOpen} onClose={() => setIsHistorialOpen(false)} title="Historial del dispositivo">
        <div className="space-y-3">
          {actionDevice && <p className="text-sm text-gray-500">{actionDevice.inventoryCode || actionDevice.planCode}</p>}
          {historialLoading ? (
            <p className="text-center text-gray-400 py-6">Cargando historial...</p>
          ) : historial.length === 0 ? (
            <p className="text-center text-gray-400 py-6">Sin registros de movimientos</p>
          ) : (
            <ol className="relative border-l border-gray-200 ml-3">
              {historial.map((entry) => {
                const labels: Record<string, { label: string; color: string }> = {
                  creacion:     { label: 'Creación',     color: 'bg-green-100 text-green-700' },
                  reasignacion: { label: 'Reasignación', color: 'bg-blue-100 text-blue-700' },
                  intercambio:  { label: 'Intercambio',  color: 'bg-purple-100 text-purple-700' },
                  baja:         { label: 'Baja',         color: 'bg-red-100 text-red-700' },
                };
                const meta = labels[entry.accion] ?? { label: entry.accion, color: 'bg-gray-100 text-gray-700' };
                return (
                  <li key={entry.id} className="mb-4 ml-4">
                    <div className="absolute w-2.5 h-2.5 bg-gray-300 rounded-full -left-1.5 mt-1.5" />
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                      <time className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleString('es-PE')}</time>
                    </div>
                    {entry.detalle && <p className="text-sm text-gray-600">{entry.detalle}</p>}
                  </li>
                );
              })}
            </ol>
          )}
          <div className="pt-2">
            <button onClick={() => setIsHistorialOpen(false)} className="w-full border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cerrar</button>
          </div>
        </div>
      </Modal>

      {/* Retire (dar de baja) */}
      <Modal isOpen={isRetireOpen} onClose={() => { setIsRetireOpen(false); setRetireMotivo(''); }} title="Dar de baja">
        <div className="space-y-4">
          {actionDevice && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm space-y-1 text-gray-600">
              <p><span className="font-medium">Código:</span> {actionDevice.inventoryCode || '—'}</p>
              <p><span className="font-medium">Tipo:</span> {deviceTypes.find((t) => t.id === actionDevice.typeId)?.description ?? actionDevice.planCode}</p>
              <p><span className="font-medium">Oficina:</span> {officeName(actionDevice.destinationOfficeId)}</p>
            </div>
          )}
          <FormField label="Motivo" required>
            <textarea value={retireMotivo} onChange={(e) => setRetireMotivo(e.target.value)}
              className="input-field min-h-[96px]"
              placeholder="Describe el motivo de la baja (obsolescencia, daño, etc.)" />
          </FormField>
          <ModalActions onConfirm={handleRetire} onCancel={() => { setIsRetireOpen(false); setRetireMotivo(''); }}
            confirmLabel="Dar de baja" variant="amber" />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        heading="¿Eliminar dispositivo?"
        detail={actionDevice?.inventoryCode || actionDevice?.planCode}
        warning="Esta acción no se puede deshacer. Si quieres conservar el historial, usa Desasignar en vez de eliminar."
      />
    </div>
  );
}

export default Devices;
