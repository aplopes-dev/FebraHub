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
  'http://localhost:3107',
  'http://127.0.0.1:3107',
  'http://localhost:3101',
  'http://127.0.0.1:3101',
];

function resolveCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw) return DEFAULT_CORS_ORIGINS;
  if (raw === '*') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CORS_ORIGINS=* não é permitido em produção');
    }
    return ['*'];
  }
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
  app.use(helmet());
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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Api-Key',
      'Idempotency-Key',
      'X-Correlation-Id',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  if (isSwaggerEnabled()) {
    const config = new DocumentBuilder()
      .setTitle('Citybox Payment API')
      .setDescription('API de Pagamentos Central — multi-PSP (B-06, Etapa 8)')
      .setVersion('0.1.0')
      .addApiKey({ type: 'apiKey', name: 'X-Api-Key', in: 'header' }, 'api-key')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.PORT ?? 3106);
  await app.listen(port);
  console.log(`Citybox Payment API http://localhost:${port}/api/health`);
}

bootstrap();
