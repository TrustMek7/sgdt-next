'use client';

import React from 'react';
import { Dependencia, Area, Office } from '../lib/types';

export interface LocationValue {
  dependenciaId: string;
  areaId: string;       // subgerencia
  officeId: string;     // área física
}

interface Props {
  dependencias: Dependencia[];
  areas: Area[];        // subgerencias
  offices: Office[];    // áreas físicas
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  level?: 'dependencia' | 'subgerencia' | 'area';
  required?: { dependencia?: boolean; subgerencia?: boolean; area?: boolean };
  errors?: { dependencia?: string; subgerencia?: string; area?: string };
  disabled?: boolean;
  labels?: { dependencia?: string; subgerencia?: string; area?: string };
}

export function LocationSelector({
  dependencias,
  areas,
  offices,
  value,
  onChange,
  level = 'area',
  required,
  errors,
  disabled,
  labels,
}: Props) {
  const filteredAreas = value.dependenciaId
    ? areas.filter((a) => a.dependenciaId === value.dependenciaId)
    : areas;

  const filteredOffices = value.areaId
    ? offices.filter((o) => o.areaId === value.areaId)
    : offices;

  const handleDependencia = (dependenciaId: string) => {
    onChange({ dependenciaId, areaId: '', officeId: '' });
  };

  const handleArea = (areaId: string) => {
    onChange({ ...value, areaId, officeId: '' });
  };

  const handleOffice = (officeId: string) => {
    onChange({ ...value, officeId });
  };

  return (
    <div className="space-y-3">
      {/* Dependencia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {labels?.dependencia ?? 'Dependencia'}{required?.dependencia ? ' *' : ''}
        </label>
        <select
          value={value.dependenciaId}
          onChange={(e) => handleDependencia(e.target.value)}
          className={`input-field ${errors?.dependencia ? 'border-red-500' : ''}`}
          disabled={disabled}
        >
          <option value="">Seleccionar dependencia...</option>
          {dependencias.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        {errors?.dependencia && <p className="text-red-500 text-sm mt-1">{errors.dependencia}</p>}
      </div>

      {/* Subgerencia */}
      {(level === 'subgerencia' || level === 'area') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {labels?.subgerencia ?? 'Subgerencia'}{required?.subgerencia ? ' *' : ''}
          </label>
          <select
            value={value.areaId}
            onChange={(e) => handleArea(e.target.value)}
            className={`input-field ${errors?.subgerencia ? 'border-red-500' : ''}`}
            disabled={disabled || (!value.dependenciaId && dependencias.length > 0)}
          >
            <option value="">Seleccionar subgerencia...</option>
            {filteredAreas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {errors?.subgerencia && <p className="text-red-500 text-sm mt-1">{errors.subgerencia}</p>}
        </div>
      )}

      {/* Área física */}
      {level === 'area' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {labels?.area ?? 'Área'}{required?.area ? ' *' : ''}
          </label>
          <select
            value={value.officeId}
            onChange={(e) => handleOffice(e.target.value)}
            className={`input-field ${errors?.area ? 'border-red-500' : ''}`}
            disabled={disabled || !value.areaId}
          >
            <option value="">Seleccionar área...</option>
            {filteredOffices.map((o) => (
              <option key={o.id} value={o.id}>{o.name} — Piso {o.floor}</option>
            ))}
          </select>
          {errors?.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
        </div>
      )}
    </div>
  );
}
