import 'dotenv/config';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { assertDevBypassIsSafe } from './shared/infra/http/auth/dev-bypass';

async function bootstrap() {
  // Antes de qualquer coisa: subir com o bypass de autenticação aberto fora de
  // dev é pior do que não subir.
  assertDevBypassIsSafe();

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('ERP Comércio API')
    .setDescription(
      [
        'Backend do backoffice de comércio — **multi-empresa**.',
        '',
        '**Como testar por aqui:**',
        '1. Clique em **Authorize** e informe o token. Em dev, com `AUTH_DEV_BYPASS=true`, use `dev-admin`.',
        '2. Crie uma organização em `POST /v1/organizations` — você vira o responsável (OWNER) dela.',
        '3. Copie o `id` retornado para o header **X-Organization-Id**, no campo abaixo do Authorize.',
        '4. A partir daí, crie unidades em `POST /v1/branches` e membros em `POST /v1/members`.',
        '',
        'O header **X-Branch-Id** é opcional e define a unidade ativa da requisição.',
        'Autenticação vem do Keycloak; a autorização (papel na empresa) vem do banco do ERP.',
      ].join('\n'),
    )
    .setVersion('0.2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token do Keycloak. Em dev: `dev-admin`.',
      },
      'bearer',
    )
    // Aplica o Authorize a todas as rotas de uma vez — evita ter que repetir
    // `@ApiBearerAuth()` em cada controller e esquecer em algum.
    .addSecurityRequirements('bearer')
    .addGlobalParameters(
      {
        name: 'X-Organization-Id',
        in: 'header',
        required: false,
        description:
          'Organização ativa. Obrigatório em todas as rotas, menos criar/listar organizações e o health.',
        schema: { type: 'string', format: 'uuid' },
      },
      {
        name: 'X-Branch-Id',
        in: 'header',
        required: false,
        description:
          'Unidade ativa da requisição. Precisa estar entre as que o membro pode operar.',
        schema: { type: 'string', format: 'uuid' },
      },
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    // Sem isto, o token some a cada reload e testar vira um vaivém.
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 3114);
  await app.listen(port);
  console.log(`ERP Comércio API http://localhost:${port}/api/health`);
}

void bootstrap();
