import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IamModule } from './modules/iam/iam.module';
import { AuthModule } from './modules/iam/auth/auth.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { PrismaService } from './common/prisma/prisma.service';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { ComprasModule } from './modules/compras/compras.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DescuentosModule } from './modules/descuentos/descuentos.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 100 }]),
    IamModule, AuthModule, PrismaModule, CatalogoModule, InventarioModule, ProveedoresModule, ComprasModule, ClientesModule, VentasModule, DashboardModule, DescuentosModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
