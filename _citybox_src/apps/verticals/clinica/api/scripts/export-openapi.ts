import { mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

const out = resolve(
  __dirname,
  '../../../../../packages/docs/api/clinica-openapi.json',
);

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('Clinica API')
    .setDescription('Vertical clínica — gestão de clínica')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(document, null, 2));
  await app.close();
  console.log('clinica-openapi.json → packages/docs/api/');
}

main();
