import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';

@Injectable()
export class SubirImagenProductoUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(producto_id: string, url: string) {
    const parsedId = BigInt(producto_id);

    // Verificar si existe el producto
    const producto = await this.prisma.producto.findUnique({
      where: { id: parsedId },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${producto_id} no encontrado`);
    }

    // Verificar si ya tiene imagen principal
    const existePrincipal = await this.prisma.productoImagen.findFirst({
      where: { producto_id: parsedId, es_principal: true },
    });

    const es_principal = !existePrincipal;

    // Crear la imagen
    const imagen = await this.prisma.productoImagen.create({
      data: {
        producto_id: parsedId,
        url,
        es_principal,
        activo: true,
      }
    });

    return {
      success: true,
      data: {
        id: imagen.id.toString(),
        url: imagen.url,
        es_principal: imagen.es_principal,
      }
    };
  }
}
