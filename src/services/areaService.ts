import { createArea, deleteArea, getAreas, updateArea } from '../lib/api';

export const areaService = {
  list: () => getAreas(),
  create: (data: { name: string; dependenciaId?: string }) => createArea(data),
  update: (id: string, data: { name?: string; dependenciaId?: string | null }) => updateArea(id, data),
  remove: (id: string) => deleteArea(id),
};
