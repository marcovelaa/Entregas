import { Controller, Post, Patch, Delete, Body, Param, UseInterceptors, UploadedFile, Inject, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { CrearProductoImagenUseCase } from '../../application/use-cases/productos/crear-producto-imagen.use-case';
import { CrearProductoImagenDto } from '../../application/dtos/producto-imagen.dto';
import { PRODUCTO_IMAGEN_REPOSITORY } from '../../domain/repositories/producto-imagen.repository.interface';
import type { IProductoImagenRepository } from '../../domain/repositories/producto-imagen.repository.interface';
import { ParseBigIntPipe } from '../../../../common/pipes';

// Asegurar que la carpeta existe
const uploadDir = './uploads/productos';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Controller('producto-imagenes')
export class ProductoImagenesController {
  constructor(
    private readonly crearProductoImagenUseCase: CrearProductoImagenUseCase,
    @Inject(PRODUCTO_IMAGEN_REPOSITORY)
    private readonly repo: any,
  ) {}

  @Post()
  async crear(@Body() dto: CrearProductoImagenDto) {
    return this.crearProductoImagenUseCase.execute(dto);
  }

  @Post('upload/:producto_id')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      }
    })
  }))
  async uploadImagen(@Param('producto_id') producto_id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ninguna imagen');
    const url = `/uploads/productos/${file.filename}`;
    
    return this.crearProductoImagenUseCase.execute({
      producto_id: BigInt(producto_id),
      url,
      es_principal: true
    });
  }

  @Patch(':id')
  async actualizar(@Param('id', ParseBigIntPipe) id: bigint, @Body() body: any) {
    if (body.es_principal) {
      // Find image to get its producto_id
      // For now we set es_principal
    }
    return this.repo.actualizar(id, body);
  }

  @Delete(':id')
  async eliminar(@Param('id', ParseBigIntPipe) id: bigint) {
    await this.repo.eliminar(id);
    return { success: true };
  }
}

