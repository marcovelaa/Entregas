export class Rol {
  constructor(
    public readonly id: bigint,
    public nombre: string,
    public descripcion: string | null,
    public activo: boolean,
    public readonly creadoEn: Date,
    public readonly actualizadoEn: Date,
  ) {}

  static crear(nombre: string, descripcion?: string): Rol {
    return new Rol(0n, nombre, descripcion || null, true, new Date(), new Date());
  }

  desactivar(): void {
    this.activo = false;
  }

  activar(): void {
    this.activo = true;
  }

  actualizar(nombre?: string, descripcion?: string | null): void {
    if (nombre !== undefined) this.nombre = nombre;
    if (descripcion !== undefined) this.descripcion = descripcion;
  }
}
