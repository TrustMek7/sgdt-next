import { createBaja, createBajas, deleteBaja, getBajas, updateBaja } from '../lib/api';
import { BajaCreatePayload, BajaUpdatePayload } from '../lib/types';

export const bajaService = {
  list: () => getBajas(),
  create: (data: BajaCreatePayload) => createBaja(data),
  createBatch: (items: BajaCreatePayload[]) => createBajas(items),
  update: (id: string, data: BajaUpdatePayload) => updateBaja(id, data),
  remove: (id: string) => deleteBaja(id),
};