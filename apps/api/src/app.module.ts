import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IamModule } from './modules/iam/iam.module';
import { AuthModule } from './modules/iam/auth/auth.module';
import { JwtAuthGuard } from './modules/iam/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/iam/auth/guards/roles.guard';
import { PrismaModule } from './common/prisma/prisma.module';
import { PrismaService } from './common/prisma/prisma.service';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { ComprasModule } from './modules/compras/compras.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { ClienteAuthModule } from './modules/clientes/auth/cliente-auth.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DescuentosModule } from './modules/descuentos/descuentos.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 100 }]),
    ScheduleModule.forRoot(),
    IamModule,
    AuthModule,
    PrismaModule,
    CatalogoModule,
    InventarioModule,
    ProveedoresModule,
    ComprasModule,
    ClientesModule,
    ClienteAuthModule,
    VentasModule,
    DashboardModule,
    DescuentosModule,
    PedidosModule,
    PagosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
