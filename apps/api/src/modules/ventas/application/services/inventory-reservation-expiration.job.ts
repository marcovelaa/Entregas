import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InventoryReservationsService } from './inventory-reservations.service';

@Injectable()
export class InventoryReservationExpirationJob {
  private readonly logger = new Logger(InventoryReservationExpirationJob.name);

  constructor(
    private readonly inventoryReservations: InventoryReservationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'inventory-reservation-expiration',
  })
  async run(): Promise<void> {
    try {
      const { liberadas } = await this.inventoryReservations.expire();
      if (liberadas > 0) {
        this.logger.log(
          `Liberadas ${liberadas} reserva(s) de inventario vencidas.`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Fallo al liberar reservas de inventario vencidas.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
