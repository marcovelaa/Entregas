import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { CrearVarianteUseCase } from '../../application/use-cases/variantes/crear-variante.use-case';
import { ListarVariantesUseCase } from '../../application/use-cases/variantes/listar-variantes.use-case';
import { ActualizarVarianteUseCase } from '../../application/use-cases/variantes/actualizar-variante.use-case';
import { EliminarVarianteUseCase } from '../../application/use-cases/variantes/eliminar-variante.use-case';
import {
  CrearVarianteDto,
  ActualizarVarianteDto,
  CrearVariantesBulkDto,
} from '../../application/dtos/variante.dto';
import { ParseBigIntPipe } from '../../../../common/pipes';
import { RequierePermiso } from '../../../iam/auth/decorators/require-permiso.decorator';

const variantesDir = path.join(process.cwd(), 'uploads', 'variantes');
if (!fs.existsSync(variantesDir)) {
  fs.mkdirSync(variantesDir, { recursive: true });
}

const serializeVariante = (v: any) => ({
  ...v,
  id: v.id?.toString(),
  producto_id: v.producto_id?.toString(),
});

@Controller('variantes')
export class VariantesController {
  constructor(
    private readonly crearVarianteUseCase: CrearVarianteUseCase,
    private readonly listarVariantesUseCase: ListarVariantesUseCase,
    private readonly actualizarVarianteUseCase: ActualizarVarianteUseCase,
    private readonly eliminarVarianteUseCase: EliminarVarianteUseCase,
  ) {}

  @Post()
  @RequierePermiso('catalogo:gestionar')
  async crear(@Body() dto: CrearVarianteDto) {
    const v = await this.crearVarianteUseCase.execute(dto);
    return serializeVariante(v);
  }

  @Post('bulk')
  @RequierePermiso('catalogo:gestionar')
  async crearBulk(@Body() dto: CrearVariantesBulkDto) {
    const results = [];
    for (const item of dto.variantes) {
      const v = await this.crearVarianteUseCase.execute(item);
      results.push(serializeVariante(v));
    }
    return results;
  }

  @Get('producto/:productoId')
  async listarPorProducto(
    @Param('productoId', ParseBigIntPipe) productoId: bigint,
  ) {
    const variantes = await this.listarVariantesUseCase.execute(
      productoId.toString(),
    );
    return variantes.map(serializeVariante);
  }

  @Patch(':id')
  @RequierePermiso('catalogo:gestionar')
  async actualizar(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: ActualizarVarianteDto,
  ) {
    const v = await this.actualizarVarianteUseCase.execute(id, dto);
    return serializeVariante(v);
  }

  @Delete(':id')
  @RequierePermiso('catalogo:gestionar')
  async eliminar(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.eliminarVarianteUseCase.execute(id);
  }

  @Post('upload-imagen/:id')
  @RequierePermiso('catalogo:gestionar')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: path.join(process.cwd(), 'uploads', 'variantes'),
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
          cb(
            new BadRequestException(
              'Solo imágenes JPG, PNG, WebP o GIF',
            ) as any,
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadImagen(
    @Param('id', ParseBigIntPipe) id: bigint,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const imageUrl = `/uploads/variantes/${file.filename}`;
    const v = await this.actualizarVarianteUseCase.execute(id, {
      imagen_url: imageUrl,
    } as any);
    return serializeVariante(v);
  }
}
