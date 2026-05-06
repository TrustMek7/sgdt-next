'use client';

import React, { useMemo, useState } from 'react';
import { Plus, Search, Edit, Trash2, AlertCircle, Unplug, ArrowLeftRight, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { Device, DeviceCreatePayload, DeviceUpdatePayload } from '../lib/types';
import { useDevices } from '../hooks/useDevices';
import { useClasificaciones } from '../hooks/useClasificaciones';
import { usePagination } from '../hooks/usePagination';

export function Devices() {
  const {
    devices, deviceTypes, offices, areas, dependencias,
    loading,
    createDevice, updateDevice, unassignDevice, reassignDevice, swapDevices, deleteDevice,
  } = useDevices();
  const { clasificaciones } = useClasificaciones();

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('');
  const [filterDepId,   setFilterDepId]   = useState('');
  const [filterAreaId,  setFilterAreaId]  = useState('');  // subgerencia
  const [filterClasif,  setFilterClasif]  = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterAsig,    setFilterAsig]    = useState('');

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [isDeleteOpen,   setIsDeleteOpen]   = useState(false);
  const [isUnassignOpen, setIsUnassignOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isSwapOpen,     setIsSwapOpen]     = useState(false);

  const [editing,        setEditing]        = useState<Device | null>(null);
  const [actionDevice,   setActionDevice]   = useState<Device | null>(null);

  // ── Form (create/edit) ─────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    status: '', typeId: '', inventoryCodes: [''],
    destinationOfficeId: '', originOfficeDescription: '', quantity: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Reassign / Swap state ──────────────────────────────────────────────────
  const [reassignDepId,  setReassignDepId]  = useState('');
  const [reassignAreaId, setReassignAreaId] = useState('');
  const [reassignOffice, setReassignOffice] = useState('');
  const [swapTargetId,   setSwapTargetId]   = useState('');

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredAreasForFilter = filterDepId
    ? areas.filter((a) => a.dependenciaId === filterDepId)
    : areas;

  const filteredDevices = useMemo(() => devices.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      if (!d.inventoryCode.toLowerCase().includes(q) && !d.planCode.toLowerCase().includes(q)) return false;
    }
    if (filterStatus && d.status !== filterStatus) return false;
    if (filterAsig && d.asignacion !== filterAsig) return false;

    if (filterClasif) {
      const tipo = deviceTypes.find((t) => t.id === d.typeId);
      if (tipo?.clasificacionId !== filterClasif) return false;
    }

    if (filterAreaId || filterDepId) {
      const office = offices.find((o) => o.id === d.destinationOfficeId);
      if (!office) return filterAsig === 'pendiente' || !d.destinationOfficeId;
      if (filterAreaId && office.areaId !== filterAreaId) return false;
      if (filterDepId) {
        const area = areas.find((a) => a.id === office.areaId);
        if (area?.dependenciaId !== filterDepId) return false;
      }
    }
    return true;
  }), [devices, search, filterStatus, filterAsig, filterClasif, filterAreaId, filterDepId, offices, areas, deviceTypes]);

  const { paginatedItems: pagedDevices, page, setPage, pageSize, setPageSize, totalPages, totalItems } = usePagination(filteredDevices, 10);

  // Devices eligible for swap (same type, asignado, different office)
  const swapCandidates = useMemo(() => {
    if (!actionDevice) return [];
    return devices.filter(
      (d) => d.typeId === actionDevice.typeId && d.asignacion === 'asignado'
        && d.destinationOfficeId !== actionDevice.destinationOfficeId && d.id !== actionDevice.id
    );
  }, [devices, actionDevice]);

  // Reassign offices cascade
  const reassignAreas = reassignDepId ? areas.filter((a) => a.dependenciaId === reassignDepId) : areas;
  const reassignOffices = reassignAreaId ? offices.filter((o) => o.areaId === reassignAreaId) : offices;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const officeName = (id: string) => offices.find((o) => o.id === id)?.name ?? '-';
  const clasifName = (id?: string) => clasificaciones.find((c) => c.id === id)?.name ?? '';

  // ── Create/Edit form ───────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ status: '', typeId: '', inventoryCodes: [''], destinationOfficeId: '', originOfficeDescription: '', quantity: 1 });
    setErrors({}); setEditing(null);
  };

  const openNew = () => { resetForm(); setIsModalOpen(true); };
  const openEdit = (d: Device) => {
    setEditing(d);
    setFormData({
      status: d.status,
      typeId: d.typeId,
      inventoryCodes: [d.inventoryCode],
      destinationOfficeId: d.destinationOfficeId,
      originOfficeDescription: d.originOfficeDescription ?? '',
      quantity: 1,
    });
    setErrors({}); setIsModalOpen(true);
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    if (!formData.typeId) errs.typeId = 'Tipo es requerido';
    if (!editing && !formData.destinationOfficeId) errs.destinationOfficeId = 'Área es requerida';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    try {
      if (editing) {
        const payload: DeviceUpdatePayload = {
          typeId: formData.typeId,
          destinationOfficeId: formData.destinationOfficeId || undefined,
          originOfficeDescription: formData.originOfficeDescription || undefined,
        };
        await updateDevice(editing.id, payload);
        toast.success('Dispositivo actualizado');
      } else {
        const payload: DeviceCreatePayload = {
          typeId: formData.typeId,
          destinationOfficeId: formData.destinationOfficeId,
          originOfficeDescription: formData.originOfficeDescription || undefined,
          inventoryCodes: formData.inventoryCodes.filter(Boolean),
          quantity: formData.quantity,
        };
        const res = await createDevice(payload);
        toast.success(`${res.created} dispositivo(s) creado(s)`);
      }
      setIsModalOpen(false); resetForm();
    } catch { toast.error('No se pudo guardar'); }
  };

  // ── Unassign ───────────────────────────────────────────────────────────────
  const handleUnassign = async () => {
    if (!actionDevice) return;
    try {
      await unassignDevice(actionDevice.id);
      toast.success('Dispositivo desasignado (pendiente)');
      setIsUnassignOpen(false); setActionDevice(null);
    } catch { toast.error('No se pudo desasignar'); }
  };

  // ── Reassign ───────────────────────────────────────────────────────────────
  const handleReassign = async () => {
    if (!actionDevice || !reassignOffice) { toast.error('Selecciona un área destino'); return; }
    try {
      await reassignDevice(actionDevice.id, reassignOffice);
      toast.success('Dispositivo reasignado');
      setIsReassignOpen(false); setActionDevice(null);
      setReassignDepId(''); setReassignAreaId(''); setReassignOffice('');
    } catch { toast.error('No se pudo reasignar'); }
  };

  // ── Swap ───────────────────────────────────────────────────────────────────
  const handleSwap = async () => {
    if (!actionDevice || !swapTargetId) { toast.error('Selecciona un dispositivo'); return; }
    try {
      await swapDevices(actionDevice.id, swapTargetId);
      toast.success('Intercambio realizado');
      setIsSwapOpen(false); setActionDevice(null); setSwapTargetId('');
    } catch { toast.error('No se pudo realizar el intercambio'); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!actionDevice) return;
    try {
      await deleteDevice(actionDevice.id);
      toast.success('Dispositivo eliminado');
      setIsDeleteOpen(false); setActionDevice(null);
    } catch { toast.error('No se pudo eliminar'); }
  };

  const typesForCurrentStatus = useMemo(() => {
    const s = formData.status || editing?.status;
    if (!s) return deviceTypes;
    if (s === 'New') return deviceTypes.filter((t) => !t.planCode.startsWith('Ex'));
    return deviceTypes.filter((t) => t.planCode.startsWith('Ex'));
  }, [formData.status, editing, deviceTypes]);

  // ── Form offices cascade ───────────────────────────────────────────────────
  const [formDepId, setFormDepId]   = useState('');
  const [formAreaId, setFormAreaId] = useState('');
  const formFilteredAreas   = formDepId  ? areas.filter((a) => a.dependenciaId === formDepId)   : areas;
  const formFilteredOffices = formAreaId ? offices.filter((o) => o.areaId === formAreaId) : offices;

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
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Código o plan..."
            className="input-field pl-9 w-40" />
        </div>
        <select className="input-field w-36" value={filterDepId}
          onChange={(e) => { setFilterDepId(e.target.value); setFilterAreaId(''); }}>
          <option value="">Dependencia</option>
          {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input-field w-48" value={filterAreaId} onChange={(e) => setFilterAreaId(e.target.value)}>
          <option value="">Subgerencia</option>
          {filteredAreasForFilter.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className="input-field w-36" value={filterClasif} onChange={(e) => setFilterClasif(e.target.value)}>
          <option value="">Clasificación</option>
          {clasificaciones.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input-field w-28" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Estado</option>
          <option value="New">Nuevo</option>
          <option value="Transfer">Traslado</option>
        </select>
        <select className="input-field w-32" value={filterAsig} onChange={(e) => setFilterAsig(e.target.value)}>
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
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium">Clasificación</th>
                <th className="px-4 py-3 font-medium">Área destino</th>
                <th className="px-4 py-3 font-medium text-center">Estado</th>
                <th className="px-4 py-3 font-medium text-center">Asignación</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagedDevices.map((device) => {
                const tipo = deviceTypes.find((t) => t.id === device.typeId);
                return (
                  <tr key={device.id} className={`hover:bg-gray-50 transition-colors ${device.asignacion === 'pendiente' ? 'bg-yellow-50/40' : ''}`}>
                    <td className="px-4 py-3 text-gray-700 font-mono text-xs">{device.inventoryCode || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{device.planCode}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={tipo?.description}>{tipo?.description ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{clasifName(tipo?.clasificacionId)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{device.destinationOfficeId ? officeName(device.destinationOfficeId) : <span className="text-yellow-600 font-medium">Sin asignar</span>}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge status={device.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${device.asignacion === 'asignado' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {device.asignacion === 'asignado' ? 'Asignado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEdit(device)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar"><Edit className="w-3.5 h-3.5" /></button>
                        {device.asignacion === 'asignado' && device.destinationOfficeId && (
                          <button onClick={() => { setActionDevice(device); setIsUnassignOpen(true); }} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Desasignar"><Unplug className="w-3.5 h-3.5" /></button>
                        )}
                        {device.asignacion === 'asignado' && device.destinationOfficeId && (
                          <button onClick={() => { setActionDevice(device); setSwapTargetId(''); setIsSwapOpen(true); }} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Intercambiar"><ArrowLeftRight className="w-3.5 h-3.5" /></button>
                        )}
                        {device.asignacion === 'pendiente' && (
                          <button onClick={() => { setActionDevice(device); setReassignDepId(''); setReassignAreaId(''); setReassignOffice(''); setIsReassignOpen(true); }} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Reasignar"><MapPin className="w-3.5 h-3.5" /></button>
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
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Create / Edit modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); setFormDepId(''); setFormAreaId(''); }}
        title={editing ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}>
        <div className="space-y-4">
          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value, typeId: '' })} className="input-field">
                  <option value="">Todos</option>
                  <option value="New">Nuevo</option>
                  <option value="Transfer">Traslado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input type="number" min="1" max="50" value={formData.quantity}
                  onChange={(e) => {
                    const q = Math.max(1, Number(e.target.value));
                    setFormData({ ...formData, quantity: q, inventoryCodes: Array.from({ length: q }, (_, i) => formData.inventoryCodes[i] || '') });
                  }} className="input-field" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select value={formData.typeId} onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
              className={`input-field ${errors.typeId ? 'border-red-500' : ''}`}>
              <option value="">Seleccionar tipo...</option>
              {typesForCurrentStatus.map((t) => <option key={t.id} value={t.id}>[{t.planCode}] {t.description}</option>)}
            </select>
            {errors.typeId && <p className="text-red-500 text-sm mt-1">{errors.typeId}</p>}
          </div>

          {!editing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dependencia</label>
                <select value={formDepId} onChange={(e) => { setFormDepId(e.target.value); setFormAreaId(''); setFormData({ ...formData, destinationOfficeId: '' }); }} className="input-field">
                  <option value="">Sin filtro</option>
                  {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subgerencia</label>
                <select value={formAreaId} onChange={(e) => { setFormAreaId(e.target.value); setFormData({ ...formData, destinationOfficeId: '' }); }} className="input-field">
                  <option value="">Todas</option>
                  {formFilteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Área destino {!editing && '*'}</label>
            <select value={formData.destinationOfficeId} onChange={(e) => setFormData({ ...formData, destinationOfficeId: e.target.value })}
              className={`input-field ${errors.destinationOfficeId ? 'border-red-500' : ''}`}>
              <option value="">Seleccionar área...</option>
              {(editing ? offices : formFilteredOffices).map((o) => <option key={o.id} value={o.id}>{o.name} — Piso {o.floor}</option>)}
            </select>
            {errors.destinationOfficeId && <p className="text-red-500 text-sm mt-1">{errors.destinationOfficeId}</p>}
          </div>

          {(formData.status === 'Transfer' || editing?.status === 'Transfer') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de origen</label>
              <input type="text" value={formData.originOfficeDescription}
                onChange={(e) => setFormData({ ...formData, originOfficeDescription: e.target.value })}
                className="input-field" placeholder="Dirección o descripción del origen" />
            </div>
          )}

          {!editing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Códigos de inventario</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.inventoryCodes.map((code, i) => (
                  <input key={i} type="text" value={code}
                    onChange={(e) => { const next = [...formData.inventoryCodes]; next[i] = e.target.value; setFormData({ ...formData, inventoryCodes: next }); }}
                    className="input-field" placeholder={`Código ${i + 1} (opcional)`} />
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">{editing ? 'Actualizar' : 'Crear'}</button>
            <button onClick={() => { setIsModalOpen(false); resetForm(); setFormDepId(''); setFormAreaId(''); }} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          </div>
        </div>
      </Modal>

      {/* Unassign confirm */}
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
          <div className="flex gap-3">
            <button onClick={handleUnassign} className="flex-1 bg-orange-600 text-white font-medium py-2 rounded-lg hover:bg-orange-700 transition">Desasignar</button>
            <button onClick={() => setIsUnassignOpen(false)} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          </div>
        </div>
      </Modal>

      {/* Reassign modal */}
      <Modal isOpen={isReassignOpen} onClose={() => setIsReassignOpen(false)} title="Reasignar Dispositivo">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Asigna el dispositivo <span className="font-medium">{actionDevice?.inventoryCode || actionDevice?.planCode}</span> a un área.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dependencia</label>
            <select value={reassignDepId} onChange={(e) => { setReassignDepId(e.target.value); setReassignAreaId(''); setReassignOffice(''); }} className="input-field">
              <option value="">Sin filtro</option>
              {dependencias.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subgerencia</label>
            <select value={reassignAreaId} onChange={(e) => { setReassignAreaId(e.target.value); setReassignOffice(''); }} className="input-field">
              <option value="">Todas</option>
              {reassignAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Área destino *</label>
            <select value={reassignOffice} onChange={(e) => setReassignOffice(e.target.value)} className="input-field">
              <option value="">Seleccionar área...</option>
              {reassignOffices.map((o) => <option key={o.id} value={o.id}>{o.name} — Piso {o.floor}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleReassign} className="flex-1 bg-green-600 text-white font-medium py-2 rounded-lg hover:bg-green-700 transition">Reasignar</button>
            <button onClick={() => setIsReassignOpen(false)} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dispositivo destino *</label>
              <select value={swapTargetId} onChange={(e) => setSwapTargetId(e.target.value)} className="input-field">
                <option value="">Seleccionar dispositivo...</option>
                {swapCandidates.map((d) => (
                  <option key={d.id} value={d.id}>{d.inventoryCode || d.planCode} → {officeName(d.destinationOfficeId)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={handleSwap} disabled={!swapTargetId} className="flex-1 bg-purple-600 text-white font-medium py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-40">Intercambiar</button>
            <button onClick={() => setIsSwapOpen(false)} className="flex-1 border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancelar</button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirmar Eliminación">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">¿Eliminar dispositivo?</p>
              {actionDevice && <p className="text-sm text-red-700 mt-1">{actionDevice.inventoryCode || actionDevice.planCode}</p>}
              <p className="text-sm text-red-700 mt-2">Esta acción no se puede deshacer. Si quieres conservar el historial, usa Desasignar en vez de eliminar.</p>
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

export default Devices;
