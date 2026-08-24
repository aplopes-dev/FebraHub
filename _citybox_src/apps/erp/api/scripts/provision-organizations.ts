import 'dotenv/config';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PrismaModule } from '../src/shared/infra/prisma/prisma.module';
import { StoreSetupModule } from '../src/modules/store-setup/store-setup.module';
import { StoreSetupRepository } from '../src/modules/store-setup/domain/repositories/store-setup.repository.interface';
import { ProvisionOrganizationDataUseCase } from '../src/modules/store-setup/application/use-cases/provision-organization-data/provision-organization-data.use-case';

/**
 * Reaplica o template de dados de sistema em todas as organizações.
 *
 * Serve para dois casos: organizações criadas antes deste módulo existir (sem nenhum
 * `systemKey`) e organizações que ficaram numa versão anterior do template. É idempotente —
 * pode rodar quantas vezes quiser.
 *
 * Uso: `pnpm --filter @citybox/erp-api provision:orgs [-- --force]`
 */
@Module({ imports: [PrismaModule, StoreSetupModule] })
class ProvisionScriptModule {}

async function main(): Promise<void> {
  const force = process.argv.includes('--force');
  const context = await NestFactory.createApplicationContext(
    ProvisionScriptModule,
    { logger: ['error', 'warn', 'log'] },
  );

  try {
    const repository = context.get(StoreSetupRepository);
    const provision = context.get(ProvisionOrganizationDataUseCase);

    const organizationIds = await repository.listOrganizationIds();

    let provisioned = 0;
    for (const organizationId of organizationIds) {
      const result = await provision.execute({ organizationId, force });
      if (result.provisioned) provisioned += 1;
    }

    console.log(
      `Organizações: ${organizationIds.length} · provisionadas agora: ${provisioned}`,
    );
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
