import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { WhatsappWorkerModule } from './whatsapp-worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WhatsappWorkerModule);
  app.enableShutdownHooks();
  console.log(
    'Clinica WhatsApp worker started (Baileys + RabbitMQ clinic.whatsapp-*)',
  );
}

void bootstrap();
