import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { PosTerminalsModule } from '../pos-terminals/pos-terminals.module';
import { PosPolicyRepository } from './domain/repositories/pos-policy.repository.interface';
import { PrismaPosPolicyRepository } from './infrastructure/database/prisma-pos-policy.repository';
import { GetPosPolicyUseCase } from './application/use-cases/get-pos-policy/get-pos-policy.use-case';
import { UpsertPosPolicyUseCase } from './application/use-cases/upsert-pos-policy/upsert-pos-policy.use-case';
import { GetPosPolicyRoute } from './infrastructure/http/routes/get-pos-policy/get-pos-policy.route';
import { UpsertPosPolicyRoute } from './infrastructure/http/routes/upsert-pos-policy/upsert-pos-policy.route';
import { CurrentPolicyRoute } from './infrastructure/http/routes/current-policy/current-policy.route';

@Module({
  // `PosTerminalsModule` exporta o `DeviceAuthGuard` usado pela rota de device.
  imports: [TenancyModule, PosTerminalsModule],
  controllers: [GetPosPolicyRoute, UpsertPosPolicyRoute, CurrentPolicyRoute],
  providers: [
    { provide: PosPolicyRepository, useClass: PrismaPosPolicyRepository },
    GetPosPolicyUseCase,
    UpsertPosPolicyUseCase,
  ],
  exports: [PosPolicyRepository, GetPosPolicyUseCase],
})
export class PosPoliciesModule {}
