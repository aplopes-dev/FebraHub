import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { SettlementsService } from '../modules/settlements/settlements.service.js';

async function runDailySettlementJob() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const settlements = app.get(SettlementsService);
    const processed = await settlements.processDueSettlements(new Date());
    console.log(`Settlement job: ${processed.length} liquidação(ões) disponibilizada(s)`);
  } finally {
    await app.close();
  }
}

runDailySettlementJob().catch((error) => {
  console.error('Settlement job failed', error);
  process.exit(1);
});
