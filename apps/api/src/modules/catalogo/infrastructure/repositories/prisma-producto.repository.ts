import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import {
  IProductoRepository,
  ProductoEntity,
  ProductoFiltros,
} from '../../domain/repositories/producto.repository.interface';

@Injectable()
export class PrismaProductoRepository implements IProductoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async crear(producto: Partial<ProductoEntity> & { componentes_combo?: any[] }): Promise<ProductoEntity> {
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
        ...(producto.componentes_combo && producto.componentes_combo.length > 0 && {
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
    }) as unknown as ProductoEntity;
  }

  async buscarTodos(filtros?: ProductoFiltros, page = 1, limit = 20): Promise<{ data: ProductoEntity[]; total: number }> {
    const where = {
      ...(filtros?.activo !== undefined && { activo: filtros.activo }),
      ...(filtros?.categoria_id && { categoria_id: filtros.categoria_id }),
      ...(filtros?.marca_id && { marca_id: filtros.marca_id }),
      ...(filtros?.tipo_producto && { tipo_producto: filtros.tipo_producto as any }),
      ...(filtros?.search && {
        OR: [
          { nombre: { contains: filtros.search, mode: 'insensitive' as const } },
          { sku: { contains: filtros.search, mode: 'insensitive' as const } },
          { variantes: { some: { sku_base: { contains: filtros.search, mode: 'insensitive' as const } } } }
        ],
      }),
    };
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
              componente_producto: { include: { imagenes: true, Inventario: true } },
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
            componente_producto: { include: { imagenes: true, Inventario: true } },
            variante: { include: { Inventario: true } },
            empaque: true,
          },
        },
      },
    }) as unknown as ProductoEntity | null;
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
            componente_producto: { include: { imagenes: true, Inventario: true } },
            variante: { include: { Inventario: true } },
            empaque: true,
          },
        },
      },
    }) as unknown as ProductoEntity | null;
  }

  async buscarPorSku(sku: string): Promise<ProductoEntity | null> {
    return this.prisma.producto.findUnique({
      where: { sku },
    }) as unknown as ProductoEntity | null;
  }

  async actualizar(id: bigint, datos: Partial<ProductoEntity> & { componentes_combo?: any[] }): Promise<ProductoEntity> {
    if (datos.componentes_combo !== undefined) {
      await this.prisma.productoComponente.deleteMany({
        where: { combo_producto_id: id },
      });
      if (datos.componentes_combo.length > 0) {
        await this.prisma.productoComponente.createMany({
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

    return this.prisma.producto.update({
      where: { id },
      data: {
        ...(datos.categoria_id !== undefined && { categoria_id: datos.categoria_id }),
        ...(datos.marca_id !== undefined && { marca_id: datos.marca_id }),
        ...(datos.sku !== undefined && { sku: datos.sku }),
        ...(datos.nombre !== undefined && { nombre: datos.nombre }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion }),
        ...(datos.naturaleza !== undefined && { naturaleza: datos.naturaleza }),
        ...(datos.tipo_producto !== undefined && { tipo_producto: datos.tipo_producto as any }),
        ...(datos.unidad_medida !== undefined && { unidad_medida: datos.unidad_medida }),
        ...(datos.atributos !== undefined && { atributos: datos.atributos }),
        ...(datos.precio_base !== undefined && { precio_base: datos.precio_base }),
        ...(datos.precio_promocional !== undefined && { precio_promocional: datos.precio_promocional }),
        ...(datos.activo !== undefined && { activo: datos.activo }),
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
    }) as unknown as ProductoEntity;
  }

  async desactivar(id: bigint): Promise<ProductoEntity> {
    return this.prisma.producto.update({
      where: { id },
      data: { activo: false },
    }) as unknown as ProductoEntity;
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
