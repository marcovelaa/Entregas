import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';

// Repositories
import { PrismaMarcaRepository } from './infrastructure/repositories/prisma-marca.repository';
import { PrismaCategoriaRepository } from './infrastructure/repositories/prisma-categoria.repository';
import { PrismaProductoRepository } from './infrastructure/repositories/prisma-producto.repository';
import { PrismaVarianteRepository } from './infrastructure/repositories/prisma-variante.repository';
import { PrismaProductoImagenRepository } from './infrastructure/repositories/prisma-producto-imagen.repository';
import { PrismaEmpaqueRepository } from './infrastructure/repositories/prisma-empaque.repository';

// Repository tokens
import { MARCA_REPOSITORY } from './domain/repositories/marca.repository.interface';
import { CATEGORIA_REPOSITORY } from './domain/repositories/categoria.repository.interface';
import { PRODUCTO_REPOSITORY } from './domain/repositories/producto.repository.interface';
import { VARIANTE_REPOSITORY } from './domain/repositories/variante.repository.interface';
import { PRODUCTO_IMAGEN_REPOSITORY } from './domain/repositories/producto-imagen.repository.interface';
import { EMPAQUE_REPOSITORY } from './domain/repositories/empaque.repository.interface';

// Controllers
import { MarcasController } from './infrastructure/controllers/marcas.controller';
import { CategoriasController } from './infrastructure/controllers/categorias.controller';
import { ProductosController } from './infrastructure/controllers/productos.controller';
import { VariantesController } from './infrastructure/controllers/variantes.controller';
import { ProductoImagenesController } from './infrastructure/controllers/producto-imagenes.controller';
import { EmpaquesController } from './infrastructure/controllers/empaques.controller';

// Use Cases - Marcas
import { CrearMarcaUseCase } from './application/use-cases/marcas/crear-marca.use-case';
import { ListarMarcasUseCase } from './application/use-cases/marcas/listar-marcas.use-case';
import { ObtenerMarcaUseCase } from './application/use-cases/marcas/obtener-marca.use-case';
import { ActualizarMarcaUseCase } from './application/use-cases/marcas/actualizar-marca.use-case';
import { EliminarMarcaUseCase } from './application/use-cases/marcas/eliminar-marca.use-case';

// Use Cases - Categorías
import { CrearCategoriaUseCase } from './application/use-cases/categorias/crear-categoria.use-case';
import { ActualizarCategoriaUseCase } from './application/use-cases/categorias/actualizar-categoria.use-case';
import { ListarCategoriasUseCase } from './application/use-cases/categorias/listar-categorias.use-case';
import { ObtenerCategoriaUseCase } from './application/use-cases/categorias/obtener-categoria.use-case';

// Use Cases - Productos
import { CrearProductoUseCase } from './application/use-cases/productos/crear-producto.use-case';
import { ListarProductosUseCase } from './application/use-cases/productos/listar-productos.use-case';
import { ObtenerProductoUseCase } from './application/use-cases/productos/obtener-producto.use-case';
import { ActualizarProductoUseCase } from './application/use-cases/productos/actualizar-producto.use-case';
import { EliminarProductoUseCase } from './application/use-cases/productos/eliminar-producto.use-case';
import { CrearProductoImagenUseCase } from './application/use-cases/productos/crear-producto-imagen.use-case';
import { ObtenerAnaliticaComboUseCase } from './application/use-cases/productos/obtener-analitica-combo.use-case';

// Use Cases - Variantes
import { CrearVarianteUseCase } from './application/use-cases/variantes/crear-variante.use-case';
import { ListarVariantesUseCase } from './application/use-cases/variantes/listar-variantes.use-case';
import { ActualizarVarianteUseCase } from './application/use-cases/variantes/actualizar-variante.use-case';
import { EliminarVarianteUseCase } from './application/use-cases/variantes/eliminar-variante.use-case';

// Use Cases - Empaques
import { CrearEmpaqueUseCase } from './application/use-cases/empaques/crear-empaque.use-case';
import { ListarEmpaquesPorVarianteUseCase } from './application/use-cases/empaques/listar-empaques.use-case';
import { ActualizarEmpaqueUseCase } from './application/use-cases/empaques/actualizar-empaque.use-case';
import { CrearEmpaquesBulkUseCase } from './application/use-cases/empaques/crear-empaques-bulk.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [
    MarcasController,
    CategoriasController,
    ProductosController,
    VariantesController,
    ProductoImagenesController,
    EmpaquesController,
  ],
  providers: [
    // Repositories
    { provide: MARCA_REPOSITORY, useClass: PrismaMarcaRepository },
    { provide: CATEGORIA_REPOSITORY, useClass: PrismaCategoriaRepository },
    { provide: PRODUCTO_REPOSITORY, useClass: PrismaProductoRepository },
    { provide: VARIANTE_REPOSITORY, useClass: PrismaVarianteRepository },
    { provide: PRODUCTO_IMAGEN_REPOSITORY, useClass: PrismaProductoImagenRepository },
    { provide: EMPAQUE_REPOSITORY, useClass: PrismaEmpaqueRepository },

    // Marcas use cases
    { provide: CrearMarcaUseCase, useFactory: (r) => new CrearMarcaUseCase(r), inject: [MARCA_REPOSITORY] },
    { provide: ListarMarcasUseCase, useFactory: (r) => new ListarMarcasUseCase(r), inject: [MARCA_REPOSITORY] },
    { provide: ObtenerMarcaUseCase, useFactory: (r) => new ObtenerMarcaUseCase(r), inject: [MARCA_REPOSITORY] },
    { provide: ActualizarMarcaUseCase, useFactory: (r) => new ActualizarMarcaUseCase(r), inject: [MARCA_REPOSITORY] },
    { provide: EliminarMarcaUseCase, useFactory: (r) => new EliminarMarcaUseCase(r), inject: [MARCA_REPOSITORY] },

    // Categorías use cases
    { provide: CrearCategoriaUseCase, useFactory: (r) => new CrearCategoriaUseCase(r), inject: [CATEGORIA_REPOSITORY] },
    { provide: ActualizarCategoriaUseCase, useFactory: (r) => new ActualizarCategoriaUseCase(r), inject: [CATEGORIA_REPOSITORY] },
    { provide: ListarCategoriasUseCase, useFactory: (r) => new ListarCategoriasUseCase(r), inject: [CATEGORIA_REPOSITORY] },
    { provide: ObtenerCategoriaUseCase, useFactory: (r) => new ObtenerCategoriaUseCase(r), inject: [CATEGORIA_REPOSITORY] },

    // Productos use cases
    { provide: CrearProductoUseCase, useFactory: (r) => new CrearProductoUseCase(r), inject: [PRODUCTO_REPOSITORY] },
    { provide: ListarProductosUseCase, useFactory: (r) => new ListarProductosUseCase(r), inject: [PRODUCTO_REPOSITORY] },
    { provide: ObtenerProductoUseCase, useFactory: (r) => new ObtenerProductoUseCase(r), inject: [PRODUCTO_REPOSITORY] },
    { provide: ActualizarProductoUseCase, useFactory: (r) => new ActualizarProductoUseCase(r), inject: [PRODUCTO_REPOSITORY] },
    { provide: EliminarProductoUseCase, useFactory: (r) => new EliminarProductoUseCase(r), inject: [PRODUCTO_REPOSITORY] },
    { provide: CrearProductoImagenUseCase, useFactory: (r) => new CrearProductoImagenUseCase(r), inject: [PRODUCTO_IMAGEN_REPOSITORY] },
    ObtenerAnaliticaComboUseCase,

    // Variantes use cases
    { provide: CrearVarianteUseCase, useFactory: (r) => new CrearVarianteUseCase(r), inject: [VARIANTE_REPOSITORY] },
    { provide: ListarVariantesUseCase, useFactory: (r) => new ListarVariantesUseCase(r), inject: [VARIANTE_REPOSITORY] },
    { provide: ActualizarVarianteUseCase, useFactory: (r) => new ActualizarVarianteUseCase(r), inject: [VARIANTE_REPOSITORY] },
    { provide: EliminarVarianteUseCase, useFactory: (r) => new EliminarVarianteUseCase(r), inject: [VARIANTE_REPOSITORY] },

    // Empaques use cases
    { provide: CrearEmpaqueUseCase, useFactory: (r) => new CrearEmpaqueUseCase(r), inject: [EMPAQUE_REPOSITORY] },
    { provide: ListarEmpaquesPorVarianteUseCase, useFactory: (r) => new ListarEmpaquesPorVarianteUseCase(r), inject: [EMPAQUE_REPOSITORY] },
    { provide: ActualizarEmpaqueUseCase, useFactory: (r) => new ActualizarEmpaqueUseCase(r), inject: [EMPAQUE_REPOSITORY] },
    { provide: CrearEmpaquesBulkUseCase, useFactory: (r) => new CrearEmpaquesBulkUseCase(r), inject: [EMPAQUE_REPOSITORY] },
  ],
  exports: [
    CrearProductoUseCase,
    ObtenerProductoUseCase,
    ListarProductosUseCase,
    CrearMarcaUseCase,
    ListarMarcasUseCase,
    PRODUCTO_REPOSITORY,
    VARIANTE_REPOSITORY,
  ],
})
export class CatalogoModule {}
