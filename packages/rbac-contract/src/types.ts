export type PermissionExceptionType = 'publico' | 'sin_ruta' | 'pendiente';

export interface PermissionException {
  tipo: PermissionExceptionType;
  motivo: string;
}

export interface PermissionDef {
  codigo: `${string}:${string}`;
  modulo: string;
  descripcion: string;
  excepcion?: PermissionException;
}
