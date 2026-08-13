import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SolicitarDevolucionUseCase } from './solicitar-devolucion.use-case';
import { EvaluarDevolucionUseCase } from './evaluar-devolucion.use-case';
import { ListarDevolucionesClienteUseCase } from './listar-devoluciones-cliente.use-case';
import { ListarDevolucionesErpUseCase } from './listar-devoluciones-erp.use-case';
import {
  DEVOLUCION_REPOSITORY,
  IDevolucionRepository,
  DevolucionData,
} from '../../domain/repositories/devolucion.repository.interface';
import {
  PEDIDO_REPOSITORY,
  IPedidoRepository,
  PedidoData,
} from '../../../pedidos/domain/repositories/pedido.repository.interface';
import {
  EstadoDevolucion,
  ResolucionDevolucion,
  DestinoFisicoItem,
} from '../../domain/entities/devolucion-enums';
import { EstadoPedido } from '../../../pedidos/domain/entities/estado-pedido.enum';

describe('Devoluciones Use Cases', () => {
  let solicitarDevolucionUseCase: SolicitarDevolucionUseCase;
  let evaluarDevolucionUseCase: EvaluarDevolucionUseCase;
  let mockDevolucionRepo: jest.Mocked<IDevolucionRepository>;
  let mockPedidoRepo: jest.Mocked<IPedidoRepository>;

  const mockPedidoEntregado: PedidoData = {
    id: '10',
    numero_pedido: 'PED-100',
    cliente_id: '1',
    reserva_id: null,
    estado: EstadoPedido.ENTREGADO,
    direccion_envio_snapshot: {
      destinatario_nombre: 'Juan',
      destinatario_apellidos: 'Pérez',
      direccion_completa: 'Calle 1',
      ciudad: 'La Paz',
      telefono: '70000000',
    },
    costo_envio: 10,
    subtotal: 50,
    descuento_total: 0,
    total: 60,
    metodo_pago: 'QR',
    creado_en: new Date(),
    actualizado_en: new Date(),
    detalles: [
      {
        id: '101',
        producto_id: '500',
        nombre_producto: 'Libro A',
        precio_unitario: 50,
        cantidad: 2,
        subtotal: 100,
      },
    ],
  };

  const mockDevolucion: DevolucionData = {
    id: '1',
    public_id: 'uuid-1',
    pedido_id: '10',
    cliente_id: '1',
    estado: EstadoDevolucion.SOLICITADA,
    motivo: 'Producto defectuoso',
    creado_en: new Date(),
    actualizado_en: new Date(),
    detalles: [
      {
        id: '11',
        pedido_detalle_id: '101',
        producto_id: '500',
        cantidad: 1,
      },
    ],
  };

  beforeEach(async () => {
    mockDevolucionRepo = {
      crear: jest.fn(),
      obtenerPorId: jest.fn(),
      listarPorCliente: jest.fn(),
      listarErp: jest.fn(),
      evaluarYRestock: jest.fn(),
    };

    mockPedidoRepo = {
      crear: jest.fn(),
      obtenerPorId: jest.fn(),
      obtenerPorNumeroPedido: jest.fn(),
      listarPorCliente: jest.fn(),
      listarErp: jest.fn(),
      actualizarEstado: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolicitarDevolucionUseCase,
        EvaluarDevolucionUseCase,
        ListarDevolucionesClienteUseCase,
        ListarDevolucionesErpUseCase,
        { provide: DEVOLUCION_REPOSITORY, useValue: mockDevolucionRepo },
        { provide: PEDIDO_REPOSITORY, useValue: mockPedidoRepo },
      ],
    }).compile();

    solicitarDevolucionUseCase = module.get<SolicitarDevolucionUseCase>(
      SolicitarDevolucionUseCase,
    );
    evaluarDevolucionUseCase = module.get<EvaluarDevolucionUseCase>(
      EvaluarDevolucionUseCase,
    );
  });

  describe('SolicitarDevolucionUseCase', () => {
    it('crea solicitud de devolución exitosamente para pedido ENTREGADO', async () => {
      mockPedidoRepo.obtenerPorId.mockResolvedValue(mockPedidoEntregado);
      mockDevolucionRepo.crear.mockResolvedValue(mockDevolucion);

      const res = await solicitarDevolucionUseCase.execute(
        {
          pedido_id: '10',
          motivo: 'Producto defectuoso',
          detalles: [
            { pedido_detalle_id: '101', producto_id: '500', cantidad: 1 },
          ],
        },
        '1',
      );

      expect(res.id).toBe('1');
      expect(mockDevolucionRepo.crear).toHaveBeenCalledTimes(1);
    });

    it('rechaza devolución si el pedido no está en estado ENTREGADO', async () => {
      mockPedidoRepo.obtenerPorId.mockResolvedValue({
        ...mockPedidoEntregado,
        estado: EstadoPedido.PAGADO,
      });

      await expect(
        solicitarDevolucionUseCase.execute(
          {
            pedido_id: '10',
            motivo: 'Producto defectuoso',
            detalles: [
              { pedido_detalle_id: '101', producto_id: '500', cantidad: 1 },
            ],
          },
          '1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si la cantidad a devolver supera la comprada', async () => {
      mockPedidoRepo.obtenerPorId.mockResolvedValue(mockPedidoEntregado);

      await expect(
        solicitarDevolucionUseCase.execute(
          {
            pedido_id: '10',
            motivo: 'Producto defectuoso',
            detalles: [
              { pedido_detalle_id: '101', producto_id: '500', cantidad: 5 },
            ],
          },
          '1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('EvaluarDevolucionUseCase', () => {
    it('evalúa y aprueba devolución ejecutando restock de inventario', async () => {
      mockDevolucionRepo.obtenerPorId.mockResolvedValue(mockDevolucion);
      mockDevolucionRepo.evaluarYRestock.mockResolvedValue({
        ...mockDevolucion,
        estado: EstadoDevolucion.APROBADA,
        resolucion: ResolucionDevolucion.REEMBOLSO,
        destino_fisico: DestinoFisicoItem.INVENTARIO_RESTOCK,
      });

      const res = await evaluarDevolucionUseCase.execute(
        '1',
        {
          estado: EstadoDevolucion.APROBADA,
          resolucion: ResolucionDevolucion.REEMBOLSO,
          destino_fisico: DestinoFisicoItem.INVENTARIO_RESTOCK,
          monto_reembolso: 50,
        },
        'user-1',
      );

      expect(res.estado).toBe(EstadoDevolucion.APROBADA);
      expect(mockDevolucionRepo.evaluarYRestock).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          destinoFisico: DestinoFisicoItem.INVENTARIO_RESTOCK,
        }),
      );
    });
  });
});
