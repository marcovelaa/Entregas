import { Logger } from '@nestjs/common';
import { InventoryReservationExpirationJob } from './inventory-reservation-expiration.job';
import { InventoryReservationsService } from './inventory-reservations.service';

describe('InventoryReservationExpirationJob', () => {
  let expire: jest.Mock;
  let job: InventoryReservationExpirationJob;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    expire = jest.fn();
    job = new InventoryReservationExpirationJob({
      expire,
    } as unknown as InventoryReservationsService);
    logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('releases expired reservations and logs the count when reservations were released', async () => {
    expire.mockResolvedValue({ liberadas: 3 });

    await job.run();

    expect(expire).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('3'));
  });

  it('stays silent when there is nothing to release', async () => {
    expire.mockResolvedValue({ liberadas: 0 });

    await job.run();

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('logs and swallows failures instead of crashing the scheduler', async () => {
    expire.mockRejectedValue(new Error('conexión perdida'));

    await expect(job.run()).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Fallo al liberar'),
      expect.stringContaining('conexión perdida'),
    );
  });
});
