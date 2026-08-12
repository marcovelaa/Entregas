import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  finalizeUploadedImage,
  imageUploadOptions,
} from '../../../../common/uploads/image-upload.config';
import { CrearProductoImagenUseCase } from '../../application/use-cases/productos/crear-producto-imagen.use-case';
import { CrearProductoImagenDto } from '../../application/dtos/producto-imagen.dto';
import { PRODUCTO_IMAGEN_REPOSITORY } from '../../domain/repositories/producto-imagen.repository.interface';
import type { IProductoImagenRepository } from '../../domain/repositories/producto-imagen.repository.interface';
import { ParseBigIntPipe } from '../../../../common/pipes';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';

const uploadDir = './uploads/productos';

@Controller('producto-imagenes')
export class ProductoImagenesController {
  constructor(
    private readonly crearProductoImagenUseCase: CrearProductoImagenUseCase,
    @Inject(PRODUCTO_IMAGEN_REPOSITORY)
    private readonly repo: any,
  ) {}

  @Post()
  @RequierePermiso('catalogo:gestionar')
  async crear(@Body() dto: CrearProductoImagenDto) {
    return this.crearProductoImagenUseCase.execute(dto);
  }

  @Post('upload/:producto_id')
  @RequierePermiso('catalogo:gestionar')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions(uploadDir)))
  async uploadImagen(
    @Param('producto_id') producto_id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se recibió ninguna imagen');
    const finalFilename = await finalizeUploadedImage(file);
    const url = `/uploads/productos/${finalFilename}`;

    return this.crearProductoImagenUseCase.execute({
      producto_id: BigInt(producto_id),
      url,
      es_principal: true,
    });
  }

  @Patch(':id')
  @RequierePermiso('catalogo:gestionar')
  async actualizar(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() body: any,
  ) {
    if (body.es_principal) {
      // Find image to get its producto_id
      // For now we set es_principal
    }
    return this.repo.actualizar(id, body);
  }

  @Delete(':id')
  @RequierePermiso('catalogo:gestionar')
  async eliminar(@Param('id', ParseBigIntPipe) id: bigint) {
    await this.repo.eliminar(id);
    return { success: true };
  }
}
