import { Module } from '@nestjs/common';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';
import { FiscalConfigService } from './fiscal-config.service';
import { FiscalNfceService } from './fiscal-nfce.service';

/**
 * Módulo Fiscal — cupom não fiscal (recibo) e cupom fiscal (NFC-e mod 65, via
 * SVRS). O StorageService (MinIO) e o PrismaService são globais; não precisam
 * ser importados aqui.
 */
@Module({
  controllers: [FiscalController],
  providers: [FiscalService, FiscalConfigService, FiscalNfceService],
  exports: [FiscalService, FiscalConfigService, FiscalNfceService],
})
export class FiscalModule {}
