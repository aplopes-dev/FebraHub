import 'dotenv/config';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
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

  const documentBuilder = new DocumentBuilder()
    .setTitle('Fiscal API')
    .setDescription(
      [
        'Emissão de documentos fiscais — piloto Ilhéus/BA.',
        '',
        '- **NF-e** (modelo 55) via SEFAZ-BA',
        '- **NFS-e** pelo Padrão Nacional',
        '- **NFC-e / cupom fiscal** (modelo 65) via SEFAZ-BA — 🟡 *nunca transmitido ao órgão;',
        '  exige CSC cadastrado e credenciamento próprio para o modelo 65*',
        '',
        'Produção é recusada por construção: os endpoints de produção não têm valor padrão,',
        'e a API responde `424` antes de assinar ou numerar.',
      ].join('\n'),
    )
    .setVersion('0.1.0')
    /// Todas as rotas passam pelo AuthGuard (nenhuma é @Public além do health),
    /// então o esquema vale para o documento inteiro via addSecurityRequirements
    /// — evita repetir @ApiBearerAuth() nas 21 classes de rota.
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addSecurityRequirements('bearer');

  /// O OpenAPI gerado por padrão só tem paths absolutos (`/api/v1/...`), sem
  /// `servers[]` — o Swagger UI resolve "Try it out" relativo à ORIGEM da
  /// página, não ao path onde o próprio /docs foi servido. Atrás de um reverse
  /// proxy com prefixo (`https://api.aplopes.com/fiscal/api/...` → nginx
  /// remove `/fiscal/api` e repassa `/api/...` pro container), isso faz o
  /// "Try it out" chamar `https://api.aplopes.com/api/v1/...` — sem o
  /// prefixo, cai no vhost errado (achado em 2026-08-10, ver infra/AGENTS.md
  /// §5.7: era exatamente o 502 batendo no core-api). SWAGGER_PUBLIC_SERVER_URL
  /// declara a URL pública real de onde o /docs é servido; sem a env (dev
  /// local, acesso direto à porta), documentBuilder.build() não ganha
  /// `servers[]` e o Swagger UI usa a origem da própria página — comportamento
  /// inalterado.
  const publicServerUrl = process.env.SWAGGER_PUBLIC_SERVER_URL?.trim();
  if (publicServerUrl) documentBuilder.addServer(publicServerUrl);

  const config = documentBuilder.build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 3116);
  await app.listen(port);
  console.log(`Fiscal API http://localhost:${port}/api/health`);
}

void bootstrap();
