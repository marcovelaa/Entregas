export class Permiso {
  constructor(
    public readonly id: bigint,
    public codigo: string,
    public nombre: string,
    public descripcion: string | null,
    public activo: boolean,
    public readonly creadoEn: Date,
    public readonly actualizadoEn: Date,
  ) {}
}
