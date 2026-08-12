import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  DiscountEngineService,
  CartItemInput,
} from '../../domain/discount-engine.service';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';

const HHMM_RE = /^\d{2}:\d{2}$/;

function parseHHMM(v: unknown): string | null {
  if (typeof v !== 'string' || !HHMM_RE.test(v)) return null;
  const hh = Number(v.slice(0, 2));
  const mm = Number(v.slice(3, 5));
  if (hh > 23 || mm > 59) return null;
  return v;
}

function parseDiasSemana(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return Array.from(
    new Set(v.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
  );
}

@ApiTags('descuentos')
@Controller('descuentos')
export class DescuentosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discountEngine: DiscountEngineService,
  ) {}

  @Get()
  @RequierePermiso('descuentos:ver')
  @ApiOperation({
    summary:
      'Listar todos los descuentos con sus alcances (productos/variantes/empaques/categorías)',
  })
  @ApiResponse({ status: 200, description: 'Listado de descuentos' })
  async listar() {
    const descuentos = await this.prisma.descuento.findMany({
      include: {
        productos: { include: { producto: true } },
        variantes: { include: { variante: true } },
        empaques: { include: { empaque: true } },
        categorias: { include: { categoria: true } },
      },
      orderBy: [{ prioridad: 'desc' }, { creado_en: 'desc' }],
    });

    const data = descuentos.map((d: any) => ({
      id: d.id.toString(),
      nombre: d.nombre,
      descripcion: d.descripcion,
      codigoCupon: d.codigo_cupon,
      tipo: d.tipo,
      valor: Number(d.valor),
      maxMontoDescuento: d.max_monto_descuento
        ? Number(d.max_monto_descuento)
        : null,
      alcance: d.alcance,
      canal: d.canal,
      cantidadRequerida: d.cantidad_requerida,
      cantidadPaga: d.cantidad_paga,
      montoMinimoCompra: d.monto_minimo_compra
        ? Number(d.monto_minimo_compra)
        : null,
      limiteUsos: d.limite_usos,
      limiteUsosPorCliente: d.limite_usos_por_cliente,
      usosActuales: d.usos_actuales,
      esAcumulable: d.es_acumulable,
      prioridad: d.prioridad,
      fechaInicio: d.fecha_inicio,
      fechaFin: d.fecha_fin,
      activo: d.activo,
      diasSemana: d.dias_semana,
      horaInicio: d.hora_inicio,
      horaFin: d.hora_fin,
      productos: d.productos.map((p: any) => ({
        id: p.producto.id.toString(),
        nombre: p.producto.nombre,
      })),
      variantes: d.variantes.map((v: any) => ({
        id: v.variante.id.toString(),
        nombre: v.variante.nombre,
      })),
      empaques: d.empaques.map((e: any) => ({
        id: e.empaque.id.toString(),
        nombre: e.empaque.nombre,
      })),
      categorias: d.categorias.map((c: any) => ({
        id: c.categoria.id.toString(),
        nombre: c.categoria.nombre,
      })),
    }));

    return { success: true, data };
  }

  @Get(':id/analitica')
  @RequierePermiso('descuentos:ver')
  @ApiOperation({
    summary:
      'Obtener analítica de uso de un descuento (canjes, ahorro, productos top)',
  })
  @ApiParam({ name: 'id', description: 'ID del descuento' })
  @ApiResponse({ status: 200, description: 'Analítica del descuento' })
  async obtenerAnalitica(@Param('id') id: string) {
    const descId = BigInt(id);

    const descuento = await this.prisma.descuento.findUnique({
      where: { id: descId },
    });

    if (!descuento) {
      return { success: false, error: 'Descuento no encontrado' };
    }

    const usos = await this.prisma.descuentoUso.findMany({
      where: { descuento_id: descId },
      include: {
        venta: {
          include: {
            detalles: {
              include: { producto: true },
            },
          },
        },
        cliente: true,
      },
      orderBy: { creado_en: 'desc' },
    });

    let totalVentasBs = 0;
    let totalDescontadoBs = 0;
    const productCountMap = new Map<
      string,
      { nombre: string; cantidad: number; totalBs: number }
    >();
    const dailyMap = new Map<
      string,
      { fecha: string; canjes: number; descontadoBs: number }
    >();

    usos.forEach((u: any) => {
      const descontado = Number(u.monto_descontado);
      const ventaTotal = Number(u.venta?.total || 0);

      totalDescontadoBs += descontado;
      totalVentasBs += ventaTotal;

      const dayKey = u.creado_en.toISOString().split('T')[0];
      const existingDay = dailyMap.get(dayKey) || {
        fecha: dayKey,
        canjes: 0,
        descontadoBs: 0,
      };
      existingDay.canjes += 1;
      existingDay.descontadoBs += descontado;
      dailyMap.set(dayKey, existingDay);

      if (u.venta?.detalles) {
        u.venta.detalles.forEach((d: any) => {
          const prodId = d.producto_id.toString();
          const prodNombre = d.producto?.nombre || `Producto #${prodId}`;
          const cant = d.cantidad || 1;
          const subtotal = Number(d.subtotal || 0);

          const existingProd = productCountMap.get(prodId) || {
            nombre: prodNombre,
            cantidad: 0,
            totalBs: 0,
          };
          existingProd.cantidad += cant;
          existingProd.totalBs += subtotal;
          productCountMap.set(prodId, existingProd);
        });
      }
    });

    const totalUsos = usos.length;
    const ticketPromedioBs = totalUsos > 0 ? totalVentasBs / totalUsos : 0;

    const topProductos = Array.from(productCountMap.values())
      .sort((a, b) => b.totalBs - a.totalBs)
      .slice(0, 5);

    const historialDiario = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
    );

    return {
      success: true,
      data: {
        descuentoId: descuento.id.toString(),
        nombre: descuento.nombre,
        tipo: descuento.tipo,
        codigoCupon: descuento.codigo_cupon,
        canal: descuento.canal,
        activo: descuento.activo,
        totalUsos,
        totalVentasBs,
        totalDescontadoBs,
        ticketPromedioBs,
        topProductos,
        historialDiario,
        ultimosCanjes: usos.slice(0, 10).map((u: any) => ({
          id: u.id.toString(),
          ventaId: u.venta_id.toString(),
          clienteNombre: u.cliente ? u.cliente.nombre : 'Cliente General',
          montoDescontado: Number(u.monto_descontado),
          montoVenta: Number(u.venta?.total || 0),
          fecha: u.creado_en,
        })),
      },
    };
  }

  @Get(':id')
  @RequierePermiso('descuentos:ver')
  @ApiOperation({ summary: 'Obtener un descuento por ID' })
  @ApiParam({ name: 'id', description: 'ID del descuento' })
  @ApiResponse({ status: 200, description: 'Descuento encontrado' })
  async obtenerPorId(@Param('id') id: string) {
    const d = await this.prisma.descuento.findUnique({
      where: { id: BigInt(id) },
      include: {
        productos: { include: { producto: true } },
        variantes: { include: { variante: true } },
        empaques: { include: { empaque: true } },
        categorias: { include: { categoria: true } },
      },
    });

    if (!d) {
      return { success: false, error: 'Descuento no encontrado' };
    }

    const data = {
      id: d.id.toString(),
      nombre: d.nombre,
      descripcion: d.descripcion,
      codigoCupon: d.codigo_cupon,
      tipo: d.tipo,
      valor: Number(d.valor),
      maxMontoDescuento: d.max_monto_descuento
        ? Number(d.max_monto_descuento)
        : null,
      alcance: d.alcance,
      canal: d.canal,
      cantidadRequerida: d.cantidad_requerida,
      cantidadPaga: d.cantidad_paga,
      montoMinimoCompra: d.monto_minimo_compra
        ? Number(d.monto_minimo_compra)
        : null,
      limiteUsos: d.limite_usos,
      limiteUsosPorCliente: d.limite_usos_por_cliente,
      usosActuales: d.usos_actuales,
      esAcumulable: d.es_acumulable,
      prioridad: d.prioridad,
      fechaInicio: d.fecha_inicio,
      fechaFin: d.fecha_fin,
      activo: d.activo,
      diasSemana: d.dias_semana,
      horaInicio: d.hora_inicio,
      horaFin: d.hora_fin,
      productos: d.productos.map((p: any) => ({
        id: p.producto.id.toString(),
        nombre: p.producto.nombre,
      })),
      variantes: d.variantes.map((v: any) => ({
        id: v.variante.id.toString(),
        nombre: v.variante.nombre,
      })),
      empaques: d.empaques.map((e: any) => ({
        id: e.empaque.id.toString(),
        nombre: e.empaque.nombre,
      })),
      categorias: d.categorias.map((c: any) => ({
        id: c.categoria.id.toString(),
        nombre: c.categoria.nombre,
      })),
    };

    return { success: true, data };
  }

  @Post()
  @RequierePermiso('descuentos:gestionar')
  @ApiOperation({ summary: 'Crear un descuento o regla promocional' })
  @ApiResponse({ status: 201, description: 'Descuento creado' })
  async crear(@Body() dto: any) {
    const {
      nombre,
      descripcion,
      codigoCupon,
      tipo,
      valor,
      maxMontoDescuento,
      alcance,
      canal,
      cantidadRequerida,
      cantidadPaga,
      montoMinimoCompra,
      limiteUsos,
      limiteUsosPorCliente,
      esAcumulable,
      prioridad,
      fechaInicio,
      fechaFin,
      diasSemana,
      horaInicio,
      horaFin,
      productoIds,
      varianteIds,
      empaqueIds,
      categoriaIds,
    } = dto;

    const nuevo = await this.prisma.descuento.create({
      data: {
        nombre,
        descripcion,
        codigo_cupon: codigoCupon ? codigoCupon.trim().toUpperCase() : null,
        tipo: tipo || 'PORCENTAJE',
        valor: valor || 0,
        max_monto_descuento: maxMontoDescuento
          ? parseFloat(maxMontoDescuento)
          : null,
        alcance: alcance || 'GLOBAL',
        canal: canal || 'TODOS',
        cantidad_requerida: cantidadRequerida
          ? parseInt(cantidadRequerida, 10)
          : 1,
        cantidad_paga: cantidadPaga ? parseInt(cantidadPaga, 10) : 1,
        monto_minimo_compra: montoMinimoCompra
          ? parseFloat(montoMinimoCompra)
          : null,
        limite_usos: limiteUsos ? parseInt(limiteUsos, 10) : null,
        limite_usos_por_cliente: limiteUsosPorCliente
          ? parseInt(limiteUsosPorCliente, 10)
          : 1,
        es_acumulable: esAcumulable ?? false,
        prioridad: prioridad ? parseInt(prioridad, 10) : 0,
        fecha_inicio: new Date(fechaInicio),
        fecha_fin: new Date(fechaFin),
        activo: true,
        dias_semana: parseDiasSemana(diasSemana),
        hora_inicio: parseHHMM(horaInicio),
        hora_fin: parseHHMM(horaFin),
        productos: productoIds?.length
          ? {
              create: productoIds.map((id: string) => ({
                producto_id: BigInt(id),
              })),
            }
          : undefined,
        variantes: varianteIds?.length
          ? {
              create: varianteIds.map((id: string) => ({
                variante_id: BigInt(id),
              })),
            }
          : undefined,
        empaques: empaqueIds?.length
          ? {
              create: empaqueIds.map((id: string) => ({
                empaque_id: BigInt(id),
              })),
            }
          : undefined,
        categorias: categoriaIds?.length
          ? {
              create: categoriaIds.map((id: string) => ({
                categoria_id: BigInt(id),
              })),
            }
          : undefined,
      },
    });

    return {
      success: true,
      message: 'Descuento creado exitosamente',
      data: { id: nuevo.id.toString() },
    };
  }

  @Patch(':id')
  @RequierePermiso('descuentos:gestionar')
  @ApiOperation({
    summary: 'Actualizar parcialmente un descuento (ej. activar/desactivar)',
  })
  @ApiParam({ name: 'id', description: 'ID del descuento' })
  @ApiResponse({ status: 200, description: 'Descuento actualizado' })
  @ApiResponse({ status: 404, description: 'Descuento no encontrado' })
  async toggleOActualizarParcial(@Param('id') id: string, @Body() dto: any) {
    const descId = BigInt(id);
    const existing = await this.prisma.descuento.findUnique({
      where: { id: descId },
    });

    if (!existing) {
      throw new NotFoundException('Descuento no encontrado');
    }

    const dataToUpdate: any = {};
    if (dto.activo !== undefined) dataToUpdate.activo = Boolean(dto.activo);
    if (dto.nombre !== undefined) dataToUpdate.nombre = dto.nombre;
    if (dto.descripcion !== undefined)
      dataToUpdate.descripcion = dto.descripcion;
    if (dto.prioridad !== undefined)
      dataToUpdate.prioridad = parseInt(dto.prioridad, 10);
    if (dto.valor !== undefined) dataToUpdate.valor = parseFloat(dto.valor);
    if (dto.fechaInicio) dataToUpdate.fecha_inicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) dataToUpdate.fecha_fin = new Date(dto.fechaFin);
    if (dto.diasSemana !== undefined)
      dataToUpdate.dias_semana = parseDiasSemana(dto.diasSemana);
    if (dto.horaInicio !== undefined)
      dataToUpdate.hora_inicio = parseHHMM(dto.horaInicio);
    if (dto.horaFin !== undefined)
      dataToUpdate.hora_fin = parseHHMM(dto.horaFin);

    const updated = await this.prisma.descuento.update({
      where: { id: descId },
      data: dataToUpdate,
    });

    return {
      success: true,
      message: 'Descuento actualizado exitosamente',
      data: { id: updated.id.toString(), activo: updated.activo },
    };
  }

  @Put(':id')
  @RequierePermiso('descuentos:gestionar')
  @ApiOperation({ summary: 'Reemplazar un descuento completo' })
  @ApiParam({ name: 'id', description: 'ID del descuento' })
  @ApiResponse({ status: 200, description: 'Descuento actualizado' })
  @ApiResponse({ status: 404, description: 'Descuento no encontrado' })
  async actualizar(@Param('id') id: string, @Body() dto: any) {
    const descId = BigInt(id);

    const {
      nombre,
      descripcion,
      codigoCupon,
      tipo,
      valor,
      maxMontoDescuento,
      alcance,
      canal,
      cantidadRequerida,
      cantidadPaga,
      montoMinimoCompra,
      limiteUsos,
      limiteUsosPorCliente,
      esAcumulable,
      prioridad,
      fechaInicio,
      fechaFin,
      activo,
      diasSemana,
      horaInicio,
      horaFin,
      productoIds,
      varianteIds,
      empaqueIds,
      categoriaIds,
    } = dto;

    const existing = await this.prisma.descuento.findUnique({
      where: { id: descId },
    });
    if (!existing) {
      throw new NotFoundException('Descuento no encontrado');
    }

    const dataToUpdate: any = {
      nombre: nombre !== undefined ? nombre : existing.nombre,
      descripcion:
        descripcion !== undefined ? descripcion : existing.descripcion,
      codigo_cupon:
        codigoCupon !== undefined
          ? codigoCupon
            ? codigoCupon.trim().toUpperCase()
            : null
          : existing.codigo_cupon,
      tipo: tipo || existing.tipo,
      valor: valor !== undefined ? parseFloat(valor) : existing.valor,
      max_monto_descuento:
        maxMontoDescuento !== undefined
          ? maxMontoDescuento
            ? parseFloat(maxMontoDescuento)
            : null
          : existing.max_monto_descuento,
      alcance: alcance || existing.alcance,
      canal: canal || existing.canal,
      cantidad_requerida:
        cantidadRequerida !== undefined
          ? parseInt(cantidadRequerida, 10)
          : existing.cantidad_requerida,
      cantidad_paga:
        cantidadPaga !== undefined
          ? parseInt(cantidadPaga, 10)
          : existing.cantidad_paga,
      monto_minimo_compra:
        montoMinimoCompra !== undefined
          ? montoMinimoCompra
            ? parseFloat(montoMinimoCompra)
            : null
          : existing.monto_minimo_compra,
      limite_usos:
        limiteUsos !== undefined
          ? limiteUsos
            ? parseInt(limiteUsos, 10)
            : null
          : existing.limite_usos,
      limite_usos_por_cliente:
        limiteUsosPorCliente !== undefined
          ? limiteUsosPorCliente
            ? parseInt(limiteUsosPorCliente, 10)
            : 1
          : existing.limite_usos_por_cliente,
      es_acumulable:
        esAcumulable !== undefined
          ? Boolean(esAcumulable)
          : existing.es_acumulable,
      prioridad:
        prioridad !== undefined ? parseInt(prioridad, 10) : existing.prioridad,
      fecha_inicio: fechaInicio ? new Date(fechaInicio) : existing.fecha_inicio,
      fecha_fin: fechaFin ? new Date(fechaFin) : existing.fecha_fin,
      activo: activo !== undefined ? Boolean(activo) : existing.activo,
      dias_semana:
        diasSemana !== undefined
          ? parseDiasSemana(diasSemana)
          : existing.dias_semana,
      hora_inicio:
        horaInicio !== undefined ? parseHHMM(horaInicio) : existing.hora_inicio,
      hora_fin: horaFin !== undefined ? parseHHMM(horaFin) : existing.hora_fin,
    };

    if (
      productoIds !== undefined ||
      varianteIds !== undefined ||
      empaqueIds !== undefined ||
      categoriaIds !== undefined
    ) {
      await this.prisma.$transaction([
        this.prisma.descuentoProducto.deleteMany({
          where: { descuento_id: descId },
        }),
        this.prisma.descuentoVariante.deleteMany({
          where: { descuento_id: descId },
        }),
        this.prisma.descuentoEmpaque.deleteMany({
          where: { descuento_id: descId },
        }),
        this.prisma.descuentoCategoria.deleteMany({
          where: { descuento_id: descId },
        }),
        this.prisma.descuento.update({
          where: { id: descId },
          data: {
            ...dataToUpdate,
            productos: productoIds?.length
              ? {
                  create: productoIds.map((pId: string) => ({
                    producto_id: BigInt(pId),
                  })),
                }
              : undefined,
            variantes: varianteIds?.length
              ? {
                  create: varianteIds.map((vId: string) => ({
                    variante_id: BigInt(vId),
                  })),
                }
              : undefined,
            empaques: empaqueIds?.length
              ? {
                  create: empaqueIds.map((eId: string) => ({
                    empaque_id: BigInt(eId),
                  })),
                }
              : undefined,
            categorias: categoriaIds?.length
              ? {
                  create: categoriaIds.map((cId: string) => ({
                    categoria_id: BigInt(cId),
                  })),
                }
              : undefined,
          },
        }),
      ]);
    } else {
      await this.prisma.descuento.update({
        where: { id: descId },
        data: dataToUpdate,
      });
    }

    return {
      success: true,
      message: 'Descuento actualizado exitosamente',
    };
  }

  @Delete(':id')
  @RequierePermiso('descuentos:gestionar')
  @ApiOperation({ summary: 'Eliminar un descuento' })
  @ApiParam({ name: 'id', description: 'ID del descuento' })
  @ApiResponse({ status: 200, description: 'Descuento eliminado' })
  async eliminar(@Param('id') id: string) {
    await this.prisma.descuento.delete({
      where: { id: BigInt(id) },
    });
    return { success: true, message: 'Descuento eliminado' };
  }

  @Post('validar')
  @RequierePermiso('descuentos:validar')
  @ApiOperation({
    summary:
      'Evaluar el carrito contra los descuentos/cupones activos y calcular el mejor ahorro aplicable',
  })
  @ApiResponse({
    status: 201,
    description: 'Resultado de la evaluación de descuentos',
  })
  async validarPromocion(
    @Body()
    body: {
      cupon?: string;
      canal?: 'POS' | 'ECOMMERCE';
      clienteId?: string;
      items: CartItemInput[];
    },
  ) {
    const result = await this.discountEngine.evaluate(body);

    if (!result) {
      if (body.cupon) {
        return {
          success: false,
          error:
            'Cupón inválido, expirado o no aplicable a los productos elegidos',
        };
      }
      return { success: true, data: null };
    }

    return {
      success: true,
      data: result,
    };
  }
}
