import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CrearPedidoUseCase } from './crear-pedido.use-case';
import { CambiarEstadoPedidoUseCase } from './cambiar-estado-pedido.use-case';
import { ListarPedidosClienteUseCase } from './listar-pedidos-cliente.use-case';
import { ObtenerPedidoClienteUseCase } from './obtener-pedido-cliente.use-case';
import { ListarPedidosErpUseCase } from './listar-pedidos-erp.use-case';
import {
  PEDIDO_REPOSITORY,
  IPedidoRepository,
  PedidoData,
} from '../../domain/repositories/pedido.repository.interface';
import { EstadoPedido } from '../../domain/entities/estado-pedido.enum';

describe('Pedidos Use Cases', () => {
  let crearPedidoUseCase: CrearPedidoUseCase;
  let cambiarEstadoPedidoUseCase: CambiarEstadoPedidoUseCase;
  let listarPedidosClienteUseCase: ListarPedidosClienteUseCase;
  let obtenerPedidoClienteUseCase: ObtenerPedidoClienteUseCase;
  let listarPedidosErpUseCase: ListarPedidosErpUseCase;
  let mockPedidoRepo: jest.Mocked<IPedidoRepository>;

  const mockPedido: PedidoData = {
    id: '10',
    numero_pedido: 'PED-100',
    cliente_id: '1',
    reserva_id: null,
    estado: EstadoPedido.PENDIENTE_PAGO,
    direccion_envio_snapshot: {
      destinatario_nombre: 'Juan',
      destinatario_apellidos: 'Pérez',
      direccion_completa: 'Calle Falsa 123',
      ciudad: 'Santa Cruz',
      telefono: '70000000',
    },
    costo_envio: 15,
    subtotal: 100,
    descuento_total: 0,
    total: 115,
    metodo_pago: 'QR',
    creado_en: new Date(),
    actualizado_en: new Date(),
    detalles: [
      {
        id: '101',
        producto_id: '5',
        nombre_producto: 'Cuaderno A4',
        precio_unitario: 50,
        cantidad: 2,
        subtotal: 100,
      },
    ],
  };

  beforeEach(async () => {
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
        CrearPedidoUseCase,
        CambiarEstadoPedidoUseCase,
        ListarPedidosClienteUseCase,
        ObtenerPedidoClienteUseCase,
        ListarPedidosErpUseCase,
        { provide: PEDIDO_REPOSITORY, useValue: mockPedidoRepo },
      ],
    }).compile();

    crearPedidoUseCase = module.get<CrearPedidoUseCase>(CrearPedidoUseCase);
    cambiarEstadoPedidoUseCase = module.get<CambiarEstadoPedidoUseCase>(
      CambiarEstadoPedidoUseCase,
    );
    listarPedidosClienteUseCase = module.get<ListarPedidosClienteUseCase>(
      ListarPedidosClienteUseCase,
    );
    obtenerPedidoClienteUseCase = module.get<ObtenerPedidoClienteUseCase>(
      ObtenerPedidoClienteUseCase,
    );
    listarPedidosErpUseCase = module.get<ListarPedidosErpUseCase>(
      ListarPedidosErpUseCase,
    );
  });

  describe('CrearPedidoUseCase', () => {
    it('crea un pedido con snapshot de dirección e ítems', async () => {
      mockPedidoRepo.crear.mockResolvedValue(mockPedido);

      const resultado = await crearPedidoUseCase.execute(
        {
          direccion_envio: {
            destinatario_nombre: 'Juan',
            destinatario_apellidos: 'Pérez',
            direccion_completa: 'Calle Falsa 123',
            ciudad: 'Santa Cruz',
            telefono: '70000000',
          },
          costo_envio: 15,
          detalles: [
            {
              producto_id: '5',
              nombre_producto: 'Cuaderno A4',
              precio_unitario: 50,
              cantidad: 2,
            },
          ],
        },
        '1',
      );

      expect(resultado.id).toBe('10');
      expect(mockPedidoRepo.crear).toHaveBeenCalledTimes(1);
    });

    it('falla si el pedido no tiene detalles', async () => {
      await expect(
        crearPedidoUseCase.execute(
          {
            direccion_envio: {
              destinatario_nombre: 'Juan',
              destinatario_apellidos: 'Pérez',
              direccion_completa: 'Calle Falsa 123',
              ciudad: 'Santa Cruz',
              telefono: '70000000',
            },
            detalles: [],
          },
          '1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('CambiarEstadoPedidoUseCase', () => {
    it('avanza exitosamente de PENDIENTE_PAGO a PAGADO', async () => {
      mockPedidoRepo.obtenerPorId.mockResolvedValue(mockPedido);
      const pedidoPagado = { ...mockPedido, estado: EstadoPedido.PAGADO };
      mockPedidoRepo.actualizarEstado.mockResolvedValue(pedidoPagado);

      const res = await cambiarEstadoPedidoUseCase.execute({
        pedidoId: '10',
        nuevoEstado: EstadoPedido.PAGADO,
        motivo: 'Pago verificado',
      });

      expect(res.estado).toBe(EstadoPedido.PAGADO);
      expect(mockPedidoRepo.actualizarEstado).toHaveBeenCalledWith(
        '10',
        EstadoPedido.PAGADO,
        expect.objectContaining({ motivo: 'Pago verificado' }),
      );
    });

    it('rechaza salto de estado inválido (de PENDIENTE_PAGO a ENVIADO)', async () => {
      mockPedidoRepo.obtenerPorId.mockResolvedValue(mockPedido);

      await expect(
        cambiarEstadoPedidoUseCase.execute({
          pedidoId: '10',
          nuevoEstado: EstadoPedido.ENVIADO,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si el pedido no existe', async () => {
      mockPedidoRepo.obtenerPorId.mockResolvedValue(null);

      await expect(
        cambiarEstadoPedidoUseCase.execute({
          pedidoId: '99',
          nuevoEstado: EstadoPedido.PAGADO,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('ObtenerPedidoClienteUseCase', () => {
    it('devuelve el pedido si pertenece al cliente', async () => {
      mockPedidoRepo.obtenerPorId.mockResolvedValue(mockPedido);

      const res = await obtenerPedidoClienteUseCase.execute('1', '10');
      expect(res.id).toBe('10');
    });

    it('lanza NotFoundException si el pedido pertenece a otro cliente', async () => {
      mockPedidoRepo.obtenerPorId.mockResolvedValue(mockPedido);

      await expect(
        obtenerPedidoClienteUseCase.execute('cliente-impostor', '10'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
