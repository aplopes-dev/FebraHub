import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { ExcecaoGlobalFilter } from './common/filters/excecao-global.filter';
import { Configuracao } from './config/configuracao';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      // O Nginx do host é quem termina o TLS: sem confiar no proxy, todo
      // request chega como 127.0.0.1 e o rate limit por IP vira global.
      trustProxy: true,
      bodyLimit: 2 * 1024 * 1024,
    }),
    { bufferLogs: true },
  );

  const cfg = app.get(ConfigService).get<Configuracao>('app')!;

  // Sem versionamento no caminho: o Nginx encaminha /api/ para cá e o front
  // chama /api/<rota>. Ligar versionamento moveria tudo para /api/v1/ e
  // quebraria o contrato sem ninguém ganhar nada — versão entra quando houver
  // uma segunda a manter.
  app.setGlobalPrefix('api');

  await app.register(helmet, {
    contentSecurityPolicy: false, // quem serve HTML é o Next, não a API
    crossOriginEmbedderPolicy: false,
  });
  await app.register(cookie, { secret: cfg.cookie.segredo });
  await app.register(compress, { global: true, threshold: 1024 });
  await app.register(multipart, {
    limits: { fileSize: cfg.uploadMaxBytes, files: 5 },
  });

  app.enableCors({
    origin: cfg.corsOrigin.length ? cfg.corsOrigin : false,
    credentials: true, // a sessão é cookie httpOnly
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-ETL-Token'],
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new ExcecaoGlobalFilter(cfg.producao));

  // Swagger fora de produção, ou com o segredo de docs configurado. Documentar
  // rota de autenticação em público é dar o mapa de graça.
  if (!cfg.producao || process.env.SWAGGER_PUBLICO === 'true') {
    const doc = new DocumentBuilder()
      .setTitle('FebraHub API')
      .setDescription(
        'API do FebraHub — central de inteligência da Febracis Salvador. ' +
          'A sessão vive em cookie httpOnly; o Bearer existe para uso do Swagger e de scripts.',
      )
      .setVersion(cfg.versao)
      .addBearerAuth()
      .addCookieAuth('fh_acesso')
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc), {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  app.enableShutdownHooks();
  await app.listen(cfg.porta, '0.0.0.0');
}

void bootstrap();
