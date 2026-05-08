import { createOffice, deleteOffice, getOffices, getOfficeTrasladoRegistro, updateOffice } from '../lib/api';
import { Office } from '../lib/types';

export const officeService = {
  list: () => getOffices(),
  create: (data: Partial<Office>) => createOffice(data),
  update: (id: string, data: Partial<Office>) => updateOffice(id, data),
  remove: (id: string) => deleteOffice(id),
  getTrasladoRegistro: (id: string) => getOfficeTrasladoRegistro(id),
};
