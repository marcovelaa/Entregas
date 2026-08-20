import { DescuentosController } from './descuentos.controller';
import { DiscountEngineService } from '../../domain/discount-engine.service';
import { ListarDescuentosUseCase } from '../../application/use-cases/listar-descuentos.use-case';
import { ObtenerDescuentoUseCase } from '../../application/use-cases/obtener-descuento.use-case';
import { ObtenerAnaliticaDescuentoUseCase } from '../../application/use-cases/obtener-analitica-descuento.use-case';
import { CrearDescuentoUseCase } from '../../application/use-cases/crear-descuento.use-case';
import { ActualizarParcialDescuentoUseCase } from '../../application/use-cases/actualizar-parcial-descuento.use-case';
import { ActualizarDescuentoUseCase } from '../../application/use-cases/actualizar-descuento.use-case';
import { EliminarDescuentoUseCase } from '../../application/use-cases/eliminar-descuento.use-case';
import {
  ActualizarDescuentoDto,
  ActualizarParcialDescuentoDto,
  CrearDescuentoDto,
} from '../../application/dtos/descuento.dto';

describe('DescuentosController - delegates to use-cases (no Prisma/business logic in the controller)', () => {
  let controller: DescuentosController;
  let useCases: {
    listar: jest.Mocked<Pick<ListarDescuentosUseCase, 'execute'>>;
    obtener: jest.Mocked<Pick<ObtenerDescuentoUseCase, 'execute'>>;
    analitica: jest.Mocked<Pick<ObtenerAnaliticaDescuentoUseCase, 'execute'>>;
    crear: jest.Mocked<Pick<CrearDescuentoUseCase, 'execute'>>;
    parcial: jest.Mocked<Pick<ActualizarParcialDescuentoUseCase, 'execute'>>;
    actualizar: jest.Mocked<Pick<ActualizarDescuentoUseCase, 'execute'>>;
    eliminar: jest.Mocked<Pick<EliminarDescuentoUseCase, 'execute'>>;
  };

  beforeEach(() => {
    useCases = {
      listar: {
        execute: jest.fn().mockResolvedValue({ success: true, data: [] }),
      },
      obtener: {
        execute: jest.fn().mockResolvedValue({ success: true, data: {} }),
      },
      analitica: {
        execute: jest.fn().mockResolvedValue({ success: true, data: {} }),
      },
      crear: { execute: jest.fn().mockResolvedValue({ success: true }) },
      parcial: { execute: jest.fn().mockResolvedValue({ success: true }) },
      actualizar: { execute: jest.fn().mockResolvedValue({ success: true }) },
      eliminar: { execute: jest.fn().mockResolvedValue({ success: true }) },
    };

    controller = new DescuentosController(
      {} as DiscountEngineService,
      useCases.listar as unknown as ListarDescuentosUseCase,
      useCases.obtener as unknown as ObtenerDescuentoUseCase,
      useCases.analitica as unknown as ObtenerAnaliticaDescuentoUseCase,
      useCases.crear as unknown as CrearDescuentoUseCase,
      useCases.parcial as unknown as ActualizarParcialDescuentoUseCase,
      useCases.actualizar as unknown as ActualizarDescuentoUseCase,
      useCases.eliminar as unknown as EliminarDescuentoUseCase,
    );
  });

  it('listar() delegates to ListarDescuentosUseCase', async () => {
    await controller.listar();
    expect(useCases.listar.execute).toHaveBeenCalledWith();
  });

  it('obtenerPorId() delegates to ObtenerDescuentoUseCase with the id', async () => {
    await controller.obtenerPorId('5');
    expect(useCases.obtener.execute).toHaveBeenCalledWith('5');
  });

  it('obtenerAnalitica() delegates to ObtenerAnaliticaDescuentoUseCase with the id', async () => {
    await controller.obtenerAnalitica('5');
    expect(useCases.analitica.execute).toHaveBeenCalledWith('5');
  });

  it('crear() delegates to CrearDescuentoUseCase with the dto', async () => {
    const dto = { nombre: 'x' } as unknown as CrearDescuentoDto;
    await controller.crear(dto);
    expect(useCases.crear.execute).toHaveBeenCalledWith(dto);
  });

  it('toggleOActualizarParcial() delegates to ActualizarParcialDescuentoUseCase with id and dto', async () => {
    const dto = { activo: false } as unknown as ActualizarParcialDescuentoDto;
    await controller.toggleOActualizarParcial('5', dto);
    expect(useCases.parcial.execute).toHaveBeenCalledWith('5', dto);
  });

  it('actualizar() delegates to ActualizarDescuentoUseCase with id and dto', async () => {
    const dto = { nombre: 'y' } as unknown as ActualizarDescuentoDto;
    await controller.actualizar('5', dto);
    expect(useCases.actualizar.execute).toHaveBeenCalledWith('5', dto);
  });

  it('eliminar() delegates to EliminarDescuentoUseCase with the id', async () => {
    await controller.eliminar('5');
    expect(useCases.eliminar.execute).toHaveBeenCalledWith('5');
  });
});

describe('DescuentosController - validarPromocion', () => {
  let controller: DescuentosController;
  let mockEngine: { evaluateWithReason: jest.Mock };

  const noop = { execute: jest.fn() } as unknown as ListarDescuentosUseCase &
    ObtenerDescuentoUseCase &
    ObtenerAnaliticaDescuentoUseCase &
    CrearDescuentoUseCase &
    ActualizarParcialDescuentoUseCase &
    ActualizarDescuentoUseCase &
    EliminarDescuentoUseCase;

  beforeEach(() => {
    mockEngine = { evaluateWithReason: jest.fn() };
    controller = new DescuentosController(
      mockEngine as unknown as DiscountEngineService,
      noop,
      noop,
      noop,
      noop,
      noop,
      noop,
      noop,
    );
  });

  it('returns the discount when one applies', async () => {
    mockEngine.evaluateWithReason.mockResolvedValue({
      discount: { id: '1', montoDescontado: 10 },
    });

    const result = await controller.validarPromocion({ items: [] });

    expect(result).toEqual({
      success: true,
      data: { id: '1', montoDescontado: 10 },
    });
  });

  it('returns success:false with the reason when a coupon was tried and failed', async () => {
    mockEngine.evaluateWithReason.mockResolvedValue({
      discount: null,
      rejectionReason: 'CUPON_INACTIVO',
      rejectionMessage: 'El cupón existe pero está desactivado.',
    });

    const result = await controller.validarPromocion({
      cupon: 'OFF10',
      items: [],
    });

    expect(result).toEqual({
      success: false,
      error: 'El cupón existe pero está desactivado.',
      reason: 'CUPON_INACTIVO',
    });
  });

  it('returns success:true with data:null and a reason when no coupon was tried', async () => {
    mockEngine.evaluateWithReason.mockResolvedValue({
      discount: null,
      rejectionReason: 'MONTO_MINIMO_NO_ALCANZADO',
      rejectionMessage:
        'El carrito no alcanza el monto mínimo de compra requerido.',
    });

    const result = await controller.validarPromocion({ items: [] });

    expect(result).toEqual({
      success: true,
      data: null,
      reason: 'MONTO_MINIMO_NO_ALCANZADO',
      message: 'El carrito no alcanza el monto mínimo de compra requerido.',
    });
  });
});
