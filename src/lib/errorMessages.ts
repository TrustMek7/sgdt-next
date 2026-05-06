type MaybeSupabaseError = {
  code?: string;
  message?: string;
  details?: string;
};

const PG_CODES: Record<string, string> = {
  '23505': 'Ya existe un registro con ese valor (dato duplicado).',
  '23503': 'No se puede completar: hay registros relacionados que lo impiden.',
  '23502': 'Un campo obligatorio está vacío.',
  '23514': 'El valor ingresado no es válido para ese campo.',
  '42501': 'Sin permisos para realizar esta acción.',
  'PGRST116': 'No se encontró el registro solicitado.',
};

export function getErrorMessage(error: unknown): string {
  if (!error) return 'Error desconocido.';

  const e = error as MaybeSupabaseError;

  if (e.code && PG_CODES[e.code]) return PG_CODES[e.code];

  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return 'Error de conexión. Verifica tu internet.';
  }

  if (e.message) {
    if (e.message.includes('duplicate key'))    return PG_CODES['23505'];
    if (e.message.includes('foreign key'))      return PG_CODES['23503'];
    if (e.message.includes('null value'))       return PG_CODES['23502'];
    if (e.message.toLowerCase().includes('fetch')) return 'Error de conexión. Verifica tu internet.';
    return e.message;
  }

  return 'Error inesperado. Intenta de nuevo.';
}
