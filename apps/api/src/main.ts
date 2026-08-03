import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { PrismaExceptionFilter } from './common/filters';


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

  app.useGlobalFilters(new PrismaExceptionFilter());

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
