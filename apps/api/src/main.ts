import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {
  AllExceptionsFilter,
  DomainExceptionFilter,
  PrismaExceptionFilter,
} from './common/filters';
import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface';

declare global {
  interface BigInt {
    toJSON(): number;
  }
}

const DEV_DEFAULT_ORIGINS = ['http://localhost:3000', 'http://localhost:3002'];

function resolveAllowedOrigins(): string[] {
  const configured = process.env.CORS_ORIGINS;
  if (configured) {
    return configured
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }
  // No CORS_ORIGINS set: fail closed in production (nothing is allowed until it's
  // configured explicitly), fall back to the known local dev ports otherwise.
  return process.env.NODE_ENV === 'production' ? [] : DEV_DEFAULT_ORIGINS;
}

BigInt.prototype.toJSON = function () {
  return Number(this);
};
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cookieParser());

  app.setGlobalPrefix('api');

  const allowedOrigins = resolveAllowedOrigins();
  const corsOrigin: CustomOrigin = (origin, callback) => {
    // Requests without an Origin header (curl or server-to-server) are not subject to CORS.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // CORS is a browser read-protection mechanism, not authorization. Reject the origin
    // without turning an otherwise valid same-origin request into a server error.
    return callback(null, false);
  };
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // NestJS's RouterExceptionFilters reverses this array before matching, so the
  // LAST filter passed here is checked FIRST. Register the true catch-all first
  // (checked last) and the most specific filters last (checked first).
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new PrismaExceptionFilter(),
    new DomainExceptionFilter(),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Entregas API')
    .setDescription(
      'API del sistema Entregas.com.bo — catálogo, inventario, ventas y compras',
    )
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
