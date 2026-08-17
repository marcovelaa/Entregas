import { Injectable, Inject } from '@nestjs/common';
import { type ICajaRepository, CAJA_REPOSITORY } from '../../domain/repositories/caja.repository.interface';

@Injectable()
export class ObtenerCajaActivaUseCase {
  constructor(
    @Inject(CAJA_REPOSITORY)
    private readonly cajaRepo: ICajaRepository,
  ) {}

  async execute() {
    const caja = await this.cajaRepo.obtenerCajaActiva();
    if (!caja) return null;
    
    // Si hay una caja abierta, calculamos el efectivo esperado
    const esperado = await this.cajaRepo.calcularEfectivoEsperado(caja.id);
    const movimientos = await this.cajaRepo.obtenerMovimientos(caja.id);
    
    return {
      ...caja,
      efectivo_esperado: esperado,
      movimientos
    };
  }
}
