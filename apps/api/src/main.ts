import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter, DomainExceptionFilter, PrismaExceptionFilter } from './common/filters';


(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cookieParser());
  
  app.setGlobalPrefix('api');
  
  app.enableCors({
    origin: true, // Allow any origin in dev to avoid CORS "Network Error"
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // NestJS's RouterExceptionFilters reverses this array before matching, so the
  // LAST filter passed here is checked FIRST. Register the true catch-all first
  // (checked last) and the most specific filters last (checked first).
  app.useGlobalFilters(new AllExceptionsFilter(), new PrismaExceptionFilter(), new DomainExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Entregas API')
    .setDescription('API del sistema Entregas.com.bo — catálogo, inventario, ventas y compras')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
