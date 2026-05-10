'use client';

import { useMemo, useState } from 'react';
import { Area, Office } from '../lib/types';

interface UseLocationFilterOptions {
  areas: Area[];
  offices?: Office[];
}

export interface LocationFilterState {
  depId: string;
  areaId: string;
  officeId: string;
  setDepId: (id: string) => void;
  setAreaId: (id: string) => void;
  setOfficeId: (id: string) => void;
  reset: () => void;
  filteredAreas: Area[];
  filteredOffices: Office[];
}

export function useLocationFilter({ areas, offices = [] }: UseLocationFilterOptions): LocationFilterState {
  const [depId,    setDepIdRaw]    = useState('');
  const [areaId,   setAreaIdRaw]   = useState('');
  const [officeId, setOfficeIdRaw] = useState('');

  const filteredAreas = useMemo(
    () => depId ? areas.filter((a) => a.dependenciaId === depId) : areas,
    [depId, areas],
  );

  const filteredOffices = useMemo(
    () => areaId ? offices.filter((o) => o.areaId === areaId) : offices,
    [areaId, offices],
  );

  const setDepId  = (id: string) => { setDepIdRaw(id); setAreaIdRaw(''); setOfficeIdRaw(''); };
  const setAreaId = (id: string) => { setAreaIdRaw(id); setOfficeIdRaw(''); };
  const reset     = ()           => { setDepIdRaw(''); setAreaIdRaw(''); setOfficeIdRaw(''); };

  return {
    depId, areaId, officeId,
    setDepId, setAreaId, setOfficeId: setOfficeIdRaw, reset,
    filteredAreas, filteredOffices,
  };
}
