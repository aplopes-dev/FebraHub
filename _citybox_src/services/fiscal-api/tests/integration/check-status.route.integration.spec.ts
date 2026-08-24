import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';
import { PrismaStatusCheckRepository } from '../../src/modules/sefaz-status/infrastructure/prisma-status-check.repository';
import { CheckSefazStatusUseCase } from '../../src/modules/sefaz-status/application/use-cases/check-sefaz-status/check-sefaz-status.use-case';
import { SefazBaStatusProbe } from '../../src/modules/sefaz-status/infrastructure/sefaz-ba-status.probe';
import { NfseStatusProbe } from '../../src/modules/sefaz-status/infrastructure/nfse-status.probe';
import {
  AllowAllCompanyAccessPolicy,
  CompanyAccessPolicy,
} from '../../src/shared/domain/tenant/company-access.policy';
import { CompanyNotFoundError } from '../../src/modules/companies/domain/errors/company-not-found.error';
import type { AuthenticatedUser } from '../../src/shared/infra/http/auth/authenticated-user';

/// T024 — recusas do caso de uso. Testadas pela **classe do erro**, que é o que
/// o `AppExceptionFilter` mapeia para o status HTTP (por substring do nome):
/// `NotFound` → 404, `NotConfigured` → 424. Assim cobrimos o contrato sem
/// levantar o servidor HTTP inteiro.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

const USER: AuthenticatedUser = { sub: randomUUID(), roles: [] };

/// Nega tudo — o solicitante não participa da loja do emissor (FR-011).
class DenyAllCompanyAccessPolicy extends CompanyAccessPolicy {
  canActFor(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

describeIfDb('CheckSefazStatusUseCase — recusas (Postgres real)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaStatusCheckRepository(prisma);
  // Probes reais: PRODUCTION é recusado por `assertEnvironmentAvailable`, sem
  // I/O (só resolução de endpoint). Nenhum contato ao órgão ocorre nestes casos.
  const sefaz = new SefazBaStatusProbe(
    undefined as never,
    undefined as never,
    undefined as never,
  );
  const nfse = new NfseStatusProbe();

  beforeAll(() => prisma.$connect());
  afterAll(() => prisma.$disconnect());

  it('empresa de outro tenant → CompanyNotFoundError (404, não 403 — FR-011)', async () => {
    const useCase = new CheckSefazStatusUseCase(
      new DenyAllCompanyAccessPolicy(),
      repository,
      sefaz,
      nfse,
    );

    await expect(
      useCase.execute({ companyId: randomUUID(), user: USER, models: ['NFE'] }),
    ).rejects.toBeInstanceOf(CompanyNotFoundError);
  });

  it('PRODUCTION sem configuração → recusa com "NotConfigured" (424), antes de qualquer contato (FR-009)', async () => {
    const previous = process.env.SEFAZ_BA_NFE_PRODUCTION_ENDPOINT;
    delete process.env.SEFAZ_BA_NFE_PRODUCTION_ENDPOINT;
    const useCase = new CheckSefazStatusUseCase(
      new AllowAllCompanyAccessPolicy(),
      repository,
      sefaz,
      nfse,
    );

    try {
      await expect(
        useCase.execute({
          companyId: randomUUID(),
          user: USER,
          models: ['NFE'],
          environment: 'PRODUCTION',
        }),
      ).rejects.toThrow(/NotConfigured|não configurado|nao configurado/i);
    } finally {
      if (previous !== undefined)
        process.env.SEFAZ_BA_NFE_PRODUCTION_ENDPOINT = previous;
    }
  });
});
