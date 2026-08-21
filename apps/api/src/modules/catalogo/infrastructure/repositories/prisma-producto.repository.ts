import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  IProductoRepository,
  ProductoCrearInput,
  ProductoActualizarInput,
  ProductoEntity,
  ProductoFiltros,
  InventarioStockRow,
} from '../../domain/repositories/producto.repository.interface';

const MODOS_CON_VIGENCIA = ['RANGO_FECHAS', 'FECHA_HORA', 'MIXTO'];

@Injectable()
export class PrismaProductoRepository implements IProductoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(producto: ProductoCrearInput): Promise<ProductoEntity> {
    const tipoProducto = (producto.tipo_producto as any) || 'SIMPLE';
    return this.prisma.producto.create({
      data: {
        categoria_id: producto.categoria_id!,
        marca_id: producto.marca_id,
        sku: producto.sku!,
        nombre: producto.nombre!,
        descripcion: producto.descripcion,
        naturaleza: producto.naturaleza,
        tipo_producto: tipoProducto,
        unidad_medida: producto.unidad_medida ?? 'UNIDAD',
        atributos: producto.atributos ?? {},
        precio_base: producto.precio_base!,
        precio_promocional: producto.precio_promocional,
        activo: producto.activo ?? true,
        modo_venta: producto.modo_venta,
        vigencia_inicio: producto.vigencia_inicio,
        vigencia_fin: producto.vigencia_fin,
        cupo_maximo: producto.cupo_maximo,
        dias_semana: producto.dias_semana ?? [],
        canal_venta: producto.canal_venta ?? 'AMBOS',
        ...(tipoProducto !== 'COMBO' && {
          variantes: {
            create: [
              {
                nombre: 'Estándar',
                sku_base: producto.sku!,
                precio_unitario: producto.precio_base!,
                precio_promocional: producto.precio_promocional ?? null,
                activo: producto.activo ?? true,
              },
            ],
          },
        }),
        ...(producto.componentes_combo &&
          producto.componentes_combo.length > 0 && {
            componentes_combo: {
              create: producto.componentes_combo.map((c: any) => ({
                componente_prod_id: BigInt(c.componente_prod_id),
                variante_id: c.variante_id ? BigInt(c.variante_id) : null,
                empaque_id: c.empaque_id ? BigInt(c.empaque_id) : null,
                cantidad: Number(c.cantidad) || 1,
              })),
            },
          }),
      },
      include: {
        marca: true,
        categoria: true,
        variantes: { include: { empaques: true } },
        imagenes: true,
        componentes_combo: {
          include: {
            componente_producto: { include: { imagenes: true } },
            variante: true,
            empaque: true,
          },
        },
      },
    });
  }

  async buscarTodos(
    filtros?: ProductoFiltros,
    page = 1,
    limit = 20,
  ): Promise<{ data: ProductoEntity[]; total: number }> {
    const esVisibilidadPublica = filtros?.visibilidad === 'publica';
    const where: any = {
      ...(filtros?.categoria_id && { categoria_id: filtros.categoria_id }),
      ...(filtros?.marca_id && { marca_id: filtros.marca_id }),
      ...(filtros?.tipo_producto && {
        tipo_producto: filtros.tipo_producto as any,
      }),
      ...(!esVisibilidadPublica &&
        filtros?.activo !== undefined && { activo: filtros.activo }),
    };

    const condiciones: any[] = [];
    if (esVisibilidadPublica) {
      const ahora = new Date();
      condiciones.push(
        { activo: true },
        {
          OR: [
            // modo_venta is non-nullable (@default(PERMANENTE)): PERMANENTE/CUPO_FIJO
            // always pass; dated modes must satisfy the active window below.
            { modo_venta: { notIn: MODOS_CON_VIGENCIA } },
            {
              AND: [
                {
                  OR: [
                    { vigencia_inicio: null },
                    { vigencia_inicio: { lte: ahora } },
                  ],
                },
                {
                  OR: [
                    { vigencia_fin: null },
                    { vigencia_fin: { gte: ahora } },
                  ],
                },
              ],
            },
          ],
        },
      );
    }
    if (filtros?.search) {
      condiciones.push({
        OR: [
          {
            nombre: { contains: filtros.search, mode: 'insensitive' as const },
          },
          { sku: { contains: filtros.search, mode: 'insensitive' as const } },
          {
            variantes: {
              some: {
                sku_base: {
                  contains: filtros.search,
                  mode: 'insensitive' as const,
                },
              },
            },
          },
        ],
      });
    }
    if (filtros?.categoria_slug) {
      condiciones.push({
        categoria: { slug: filtros.categoria_slug },
      });
    }
    if (filtros?.atributo_nivel) {
      condiciones.push({
        atributos: { path: ['nivel'], equals: filtros.atributo_nivel },
      });
    }
    if (filtros?.atributo_subnivel) {
      condiciones.push({
        atributos: { path: ['subnivel'], equals: filtros.atributo_subnivel },
      });
    }
    if (filtros?.atributo_grado) {
      condiciones.push({
        atributos: { path: ['grado'], equals: filtros.atributo_grado },
      });
    }
    if (filtros?.atributo_materia && filtros.atributo_materia !== 'all') {
      condiciones.push({
        atributos: { path: ['materia'], equals: filtros.atributo_materia },
      });
    }
    if (condiciones.length > 0) {
      where.AND = condiciones;
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.producto.findMany({
        where,
        include: {
          marca: true,
          categoria: true,
          variantes: { include: { empaques: true } },
          Inventario: true,
          imagenes: true,
          componentes_combo: {
            include: {
              componente_producto: {
                include: { imagenes: true, Inventario: true },
              },
              variante: { include: { Inventario: true } },
              empaque: true,
            },
          },
        },
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.producto.count({ where }),
    ]);
    return { data: data as unknown as ProductoEntity[], total };
  }

  async buscarPorId(id: bigint): Promise<ProductoEntity | null> {
    return this.prisma.producto.findUnique({
      where: { id },
      include: {
        marca: true,
        categoria: true,
        variantes: { include: { empaques: true } },
        Inventario: true,
        imagenes: true,
        componentes_combo: {
          include: {
            componente_producto: {
              include: { imagenes: true, Inventario: true },
            },
            variante: { include: { Inventario: true } },
            empaque: true,
          },
        },
      },
    });
  }

  async buscarPorPublicId(publicId: string): Promise<ProductoEntity | null> {
    return this.prisma.producto.findUnique({
      where: { public_id: publicId },
      include: {
        marca: true,
        categoria: true,
        variantes: { include: { empaques: true } },
        Inventario: true,
        imagenes: true,
        componentes_combo: {
          include: {
            componente_producto: {
              include: { imagenes: true, Inventario: true },
            },
            variante: { include: { Inventario: true } },
            empaque: true,
          },
        },
      },
    });
  }

  async buscarPorSku(sku: string): Promise<ProductoEntity | null> {
    return this.prisma.producto.findUnique({
      where: { sku },
    });
  }

  async buscarStocksComponentes(ids: bigint[]): Promise<InventarioStockRow[]> {
    if (ids.length === 0) return [];
    return this.prisma.inventario.findMany({
      where: { producto_id: { in: ids } },
      select: {
        producto_id: true,
        variante_id: true,
        cantidad_disponible: true,
        reservado: true,
      },
    });
  }

  async actualizar(
    id: bigint,
    datos: ProductoActualizarInput,
  ): Promise<ProductoEntity> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (
        datos.precio_base !== undefined ||
        datos.precio_promocional !== undefined
      ) {
        const prodWithVars = await tx.producto.findUnique({
          where: { id },
          include: { variantes: true },
        });
        if (prodWithVars && prodWithVars.variantes.length === 1) {
          await tx.variante.update({
            where: { id: prodWithVars.variantes[0].id },
            data: {
              ...(datos.precio_base !== undefined && {
                precio_unitario: datos.precio_base,
              }),
              ...(datos.precio_promocional !== undefined && {
                precio_promocional: datos.precio_promocional,
              }),
            },
          });
        }
      }

      if (datos.componentes_combo !== undefined) {
        await tx.productoComponente.deleteMany({
          where: { combo_producto_id: id },
        });
        if (datos.componentes_combo.length > 0) {
          await tx.productoComponente.createMany({
            data: datos.componentes_combo.map((c: any) => ({
              combo_producto_id: id,
              componente_prod_id: BigInt(c.componente_prod_id),
              variante_id: c.variante_id ? BigInt(c.variante_id) : null,
              empaque_id: c.empaque_id ? BigInt(c.empaque_id) : null,
              cantidad: Number(c.cantidad) || 1,
            })),
          });
        }
      }

      return tx.producto.update({
        where: { id },
        data: {
          ...(datos.categoria_id !== undefined && {
            categoria_id: datos.categoria_id,
          }),
          ...(datos.marca_id !== undefined && { marca_id: datos.marca_id }),
          ...(datos.sku !== undefined && { sku: datos.sku }),
          ...(datos.nombre !== undefined && { nombre: datos.nombre }),
          ...(datos.descripcion !== undefined && {
            descripcion: datos.descripcion,
          }),
          ...(datos.naturaleza !== undefined && {
            naturaleza: datos.naturaleza,
          }),
          ...(datos.tipo_producto !== undefined && {
            tipo_producto: datos.tipo_producto as any,
          }),
          ...(datos.unidad_medida !== undefined && {
            unidad_medida: datos.unidad_medida,
          }),
          ...(datos.atributos !== undefined && { atributos: datos.atributos }),
          ...(datos.precio_base !== undefined && {
            precio_base: datos.precio_base,
          }),
          ...(datos.precio_promocional !== undefined && {
            precio_promocional: datos.precio_promocional,
          }),
          ...(datos.activo !== undefined && { activo: datos.activo }),
          ...(datos.modo_venta !== undefined && {
            modo_venta: datos.modo_venta,
          }),
          ...(datos.vigencia_inicio !== undefined && {
            vigencia_inicio: datos.vigencia_inicio,
          }),
          ...(datos.vigencia_fin !== undefined && {
            vigencia_fin: datos.vigencia_fin,
          }),
          ...(datos.cupo_maximo !== undefined && {
            cupo_maximo: datos.cupo_maximo,
          }),
          ...(datos.dias_semana !== undefined && {
            dias_semana: datos.dias_semana,
          }),
          ...(datos.canal_venta !== undefined && {
            canal_venta: datos.canal_venta,
          }),
        },
        include: {
          marca: true,
          categoria: true,
          variantes: { include: { empaques: true } },
          imagenes: true,
          componentes_combo: {
            include: {
              componente_producto: { include: { imagenes: true } },
              variante: true,
              empaque: true,
            },
          },
        },
      });
    });
  }

  async actualizarPrecioVenta(
    id: bigint,
    precio: number,
    tx?: any,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.producto.update({
      where: { id },
      data: { precio_base: precio },
    });
  }

  async desactivar(id: bigint): Promise<ProductoEntity> {
    return this.prisma.producto.update({
      where: { id },
      data: { activo: false },
    });
  }

  async eliminar(id: bigint): Promise<void> {
    await this.prisma.producto.delete({
      where: { id },
    });
  }

  async contarVariantesAsociadas(id: bigint): Promise<number> {
    return this.prisma.variante.count({
      where: { producto_id: id },
    });
  }
}
