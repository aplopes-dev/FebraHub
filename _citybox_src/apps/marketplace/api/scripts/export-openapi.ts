import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../packages/docs/api/openapi.json');

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder().setTitle('Citybox Core API').setVersion('0.1.0').build();
  const document = SwaggerModule.createDocument(app, config);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(document, null, 2));
  await app.close();
  console.log('openapi.json → packages/docs/api/');
}

main();