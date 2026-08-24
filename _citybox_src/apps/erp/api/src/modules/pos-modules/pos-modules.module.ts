import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PosTerminalsModule } from '../pos-terminals/pos-terminals.module';
import { PosModuleDefaultsRepository } from './domain/repositories/pos-module-defaults.repository.interface';
import { PrismaPosModuleDefaultsRepository } from './infrastructure/database/prisma-pos-module-defaults.repository';
import { GetPosModuleDefaultsUseCase } from './application/use-cases/get-pos-module-defaults/get-pos-module-defaults.use-case';
import { UpsertPosModuleDefaultsUseCase } from './application/use-cases/upsert-pos-module-defaults/upsert-pos-module-defaults.use-case';
import { GetTerminalModulesUseCase } from './application/use-cases/get-terminal-modules/get-terminal-modules.use-case';
import { UpsertTerminalModulesUseCase } from './application/use-cases/upsert-terminal-modules/upsert-terminal-modules.use-case';
import { GetPosModuleDefaultsRoute } from './infrastructure/http/routes/get-pos-module-defaults/get-pos-module-defaults.route';
import { UpsertPosModuleDefaultsRoute } from './infrastructure/http/routes/upsert-pos-module-defaults/upsert-pos-module-defaults.route';
import { GetTerminalModulesRoute } from './infrastructure/http/routes/get-terminal-modules/get-terminal-modules.route';
import { UpsertTerminalModulesRoute } from './infrastructure/http/routes/upsert-terminal-modules/upsert-terminal-modules.route';
import { CurrentTerminalModulesRoute } from './infrastructure/http/routes/current-terminal-modules/current-terminal-modules.route';

@Module({
  // `PosTerminalsModule` exporta o repositório de terminais (a sobrescrita
  // mora lá) e o `DeviceAuthGuard` usado pela rota de device.
  imports: [TenancyModule, PosTerminalsModule],
  controllers: [
    GetPosModuleDefaultsRoute,
    UpsertPosModuleDefaultsRoute,
    // Device antes das de `:id`: o Nest resolve na ordem de registro, e
    // `v1/pos/modules` não pode ser capturado por uma rota genérica.
    CurrentTerminalModulesRoute,
    GetTerminalModulesRoute,
    UpsertTerminalModulesRoute,
  ],
  providers: [
    {
      provide: PosModuleDefaultsRepository,
      useClass: PrismaPosModuleDefaultsRepository,
    },
    GetPosModuleDefaultsUseCase,
    UpsertPosModuleDefaultsUseCase,
    GetTerminalModulesUseCase,
    UpsertTerminalModulesUseCase,
  ],
})
export class PosModulesModule {}
