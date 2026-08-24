import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { EnvelopeExceptionFilter, EnvelopeInterceptor } from './common/envelope.js';
import { config } from './config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'If-None-Match'],
    exposedHeaders: ['ETag'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }),
  );
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.useGlobalFilters(new EnvelopeExceptionFilter());

  const swagger = new DocumentBuilder()
    .setTitle('CityBox BFF API')
    .setDescription('BFF do app consumidor (web, iOS, Android) — contrato docs/openapi.yaml')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/v1/docs', app, document);

  await app.listen(config.port);
  console.log(`CityBox BFF http://localhost:${config.port}/api/health`);
}

bootstrap();
