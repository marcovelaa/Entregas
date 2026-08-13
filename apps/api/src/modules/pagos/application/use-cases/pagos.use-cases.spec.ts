import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { GenerarPagoQrUseCase } from './generar-pago-qr.use-case';
import { ProcesarWebhookBisaUseCase } from './procesar-webhook-bisa.use-case';
import { ObtenerEstadoPagoUseCase } from './obtener-estado-pago.use-case';
import {
  PAGO_QR_REPOSITORY,
  IPagoQrRepository,
  PagoQrData,
} from '../../domain/repositories/pago-qr.repository.interface';
import {
  BISA_QR_PROVIDER,
  IBisaQrProvider,
} from '../../domain/ports/bisa-qr-provider.interface';
import {
  PEDIDO_REPOSITORY,
  IPedidoRepository,
  PedidoData,
} from '../../../pedidos/domain/repositories/pedido.repository.interface';
import { CambiarEstadoPedidoUseCase } from '../../../pedidos/application/use-cases/cambiar-estado-pedido.use-case';
import { EstadoPagoQR } from '../../domain/entities/estado-pago-qr.enum';
import { EstadoPedido } from '../../../pedidos/domain/entities/estado-pedido.enum';

describe('Pagos Use Cases', () => {
  let generarPagoQrUseCase: GenerarPagoQrUseCase;
  let procesarWebhookBisaUseCase: ProcesarWebhookBisaUseCase;
  let obtenerEstadoPagoUseCase: ObtenerEstadoPagoUseCase;
  let mockPagoRepo: jest.Mocked<IPagoQrRepository>;
  let mockPedidoRepo: jest.Mocked<IPedidoRepository>;
  let mockBisaProvider: jest.Mocked<IBisaQrProvider>;
  let mockCambiarEstadoPedidoUseCase: jest.Mocked<CambiarEstadoPedidoUseCase>;

  const mockPedido: PedidoData = {
    id: '10',
    numero_pedido: 'PED-100',
    cliente_id: '1',
    reserva_id: null,
    estado: EstadoPedido.PENDIENTE_PAGO,
    direccion_envio_snapshot: {
      destinatario_nombre: 'Juan',
      destinatario_apellidos: 'Pérez',
      direccion_completa: 'Calle 1',
      ciudad: 'La Paz',
      telefono: '70000000',
    },
    costo_envio: 10,
    subtotal: 90,
    descuento_total: 0,
    total: 100,
    metodo_pago: 'QR',
    creado_en: new Date(),
    actualizado_en: new Date(),
    detalles: [],
  };

  const mockPagoQr: PagoQrData = {
    id: '50',
    public_id: 'uuid-50',
    pedido_id: '10',
    reserva_id: null,
    idempotency_key: 'QR-10-1000',
    qr_contenido: 'https://simulador-bisa.test/qr/123',
    monto: 100,
    moneda: 'BOB',
    estado: EstadoPagoQR.PENDIENTE,
    referencia_bisa: 'BISA-SIM-10',
    expira_en: new Date(Date.now() + 900000),
    creado_en: new Date(),
    actualizado_en: new Date(),
  };

  beforeEach(async () => {
    mockPagoRepo = {
      crear: jest.fn(),
      obtenerPorId: jest.fn(),
      obtenerPorPedidoId: jest.fn(),
      obtenerPorReferenciaBisa: jest.fn(),
      obtenerPorIdempotencyKey: jest.fn(),
      marcarConfirmado: jest.fn(),
      marcarExpirado: jest.fn(),
      registrarWebhookLog: jest.fn(),
    };

    mockPedidoRepo = {
      crear: jest.fn(),
      obtenerPorId: jest.fn(),
      obtenerPorNumeroPedido: jest.fn(),
      listarPorCliente: jest.fn(),
      listarErp: jest.fn(),
      actualizarEstado: jest.fn(),
    };

    mockBisaProvider = {
      generarQR: jest.fn(),
      validarFirmaWebhook: jest.fn(),
    };

    mockCambiarEstadoPedidoUseCase = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerarPagoQrUseCase,
        ProcesarWebhookBisaUseCase,
        ObtenerEstadoPagoUseCase,
        { provide: PAGO_QR_REPOSITORY, useValue: mockPagoRepo },
        { provide: PEDIDO_REPOSITORY, useValue: mockPedidoRepo },
        { provide: BISA_QR_PROVIDER, useValue: mockBisaProvider },
        { provide: CambiarEstadoPedidoUseCase, useValue: mockCambiarEstadoPedidoUseCase },
      ],
    }).compile();

    generarPagoQrUseCase = module.get<GenerarPagoQrUseCase>(GenerarPagoQrUseCase);
    procesarWebhookBisaUseCase = module.get<ProcesarWebhookBisaUseCase>(
      ProcesarWebhookBisaUseCase,
    );
    obtenerEstadoPagoUseCase = module.get<ObtenerEstadoPagoUseCase>(
      ObtenerEstadoPagoUseCase,
    );
  });

  describe('GenerarPagoQrUseCase', () => {
    it('generación exitosa de QR simulado con idempotencia', async () => {
      mockPedidoRepo.obtenerPorId.mockResolvedValue(mockPedido);
      mockPagoRepo.obtenerPorIdempotencyKey.mockResolvedValue(null);
      mockPagoRepo.obtenerPorPedidoId.mockResolvedValue(null);
      mockBisaProvider.generarQR.mockResolvedValue({
        qrContenido: 'https://simulador-bisa.test/qr/123',
        referenciaBisa: 'BISA-SIM-10',
        expiraEn: new Date(),
      });
      mockPagoRepo.crear.mockResolvedValue(mockPagoQr);

      const res = await generarPagoQrUseCase.execute({ pedido_id: '10' });
      expect(res.referencia_bisa).toBe('BISA-SIM-10');
      expect(mockBisaProvider.generarQR).toHaveBeenCalledTimes(1);
    });

    it('devuelve QR existente si la clave de idempotencia coincide', async () => {
      mockPedidoRepo.obtenerPorId.mockResolvedValue(mockPedido);
      mockPagoRepo.obtenerPorIdempotencyKey.mockResolvedValue(mockPagoQr);

      const res = await generarPagoQrUseCase.execute({
        pedido_id: '10',
        idempotency_key: 'QR-10-1000',
      });

      expect(res.id).toBe('50');
      expect(mockBisaProvider.generarQR).not.toHaveBeenCalled();
    });
  });

  describe('ProcesarWebhookBisaUseCase', () => {
    it('procesa confirmación de pago y avanza estado de pedido a PAGADO', async () => {
      mockBisaProvider.validarFirmaWebhook.mockReturnValue(true);
      mockPagoRepo.obtenerPorReferenciaBisa.mockResolvedValue(mockPagoQr);
      mockPagoRepo.marcarConfirmado.mockResolvedValue({
        ...mockPagoQr,
        estado: EstadoPagoQR.CONFIRMADO,
      });

      const res = await procesarWebhookBisaUseCase.execute({
        referencia_bisa: 'BISA-SIM-10',
        estado: 'CONFIRMADO',
        monto: 100,
      });

      expect(res.procesado).toBe(true);
      expect(mockPagoRepo.marcarConfirmado).toHaveBeenCalledWith('50');
      expect(mockCambiarEstadoPedidoUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          pedidoId: '10',
          nuevoEstado: EstadoPedido.PAGADO,
        }),
      );
    });

    it('IDEMPOTENCIA: webhook duplicado se omite sin re-procesar', async () => {
      mockBisaProvider.validarFirmaWebhook.mockReturnValue(true);
      const pagoConfirmado = { ...mockPagoQr, estado: EstadoPagoQR.CONFIRMADO };
      mockPagoRepo.obtenerPorReferenciaBisa.mockResolvedValue(pagoConfirmado);

      const res = await procesarWebhookBisaUseCase.execute({
        referencia_bisa: 'BISA-SIM-10',
        estado: 'CONFIRMADO',
        monto: 100,
      });

      expect(res.procesado).toBe(false);
      expect(mockPagoRepo.marcarConfirmado).not.toHaveBeenCalled();
      expect(mockCambiarEstadoPedidoUseCase.execute).not.toHaveBeenCalled();
    });

    it('rechaza webhook si la firma es inválida', async () => {
      mockBisaProvider.validarFirmaWebhook.mockReturnValue(false);

      await expect(
        procesarWebhookBisaUseCase.execute({
          referencia_bisa: 'BISA-SIM-10',
          estado: 'CONFIRMADO',
          monto: 100,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
