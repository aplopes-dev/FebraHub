import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

const DEFAULT_CORS_ORIGINS = [
  'https://backoffice.citybox.com',
  'https://admin.citybox.com',
  'https://app.citybox.com',
  'https://city.citybox.com',
  'http://localhost:3107',
  'http://127.0.0.1:3107',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function resolveCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return DEFAULT_CORS_ORIGINS;
  if (raw === '*') return ['*'];
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

function isSwaggerEnabled(): boolean {
  const flag = process.env.SWAGGER_ENABLED?.trim().toLowerCase();
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const allowedOrigins = resolveCorsOrigins();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean | string) => void,
    ) => {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, origin ?? true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  if (isSwaggerEnabled()) {
    const config = new DocumentBuilder()
      .setTitle('Citybox Core API')
      .setDescription('Modular monolith — domínio transacional (B-03)')
      .setVersion('0.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document);
  }

  const port = Number(process.env.PORT ?? 3101);
  await app.listen(port);
  console.log(`Citybox Core API http://localhost:${port}/api/health`);
}

bootstrap();