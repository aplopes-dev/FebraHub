import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PosTerminalsModule } from '../pos-terminals/pos-terminals.module';
import { PosFiscalSettingsRepository } from './domain/repositories/pos-fiscal-settings.repository.interface';
import { PrismaPosFiscalSettingsRepository } from './infrastructure/database/prisma-pos-fiscal-settings.repository';
import { GetPosFiscalSettingsUseCase } from './application/use-cases/get-pos-fiscal-settings/get-pos-fiscal-settings.use-case';
import { UpsertPosFiscalSettingsUseCase } from './application/use-cases/upsert-pos-fiscal-settings/upsert-pos-fiscal-settings.use-case';
import { GetPosFiscalSettingsRoute } from './infrastructure/http/routes/get-pos-fiscal-settings/get-pos-fiscal-settings.route';
import { UpsertPosFiscalSettingsRoute } from './infrastructure/http/routes/upsert-pos-fiscal-settings/upsert-pos-fiscal-settings.route';
import { CurrentFiscalSettingsRoute } from './infrastructure/http/routes/current-fiscal-settings/current-fiscal-settings.route';

/// Configuração do tipo de NF emitida pelo PDV (spec erp/013).
/// `PosTerminalsModule` exporta o `DeviceAuthGuard` usado pela rota de device.
@Module({
  imports: [TenancyModule, PosTerminalsModule],
  controllers: [
    GetPosFiscalSettingsRoute,
    UpsertPosFiscalSettingsRoute,
    CurrentFiscalSettingsRoute,
  ],
  providers: [
    {
      provide: PosFiscalSettingsRepository,
      useClass: PrismaPosFiscalSettingsRepository,
    },
    GetPosFiscalSettingsUseCase,
    UpsertPosFiscalSettingsUseCase,
  ],
  exports: [PosFiscalSettingsRepository],
})
export class PosFiscalSettingsModule {}
