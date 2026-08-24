import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';
import { PrismaStatusCheckRepository } from '../../src/modules/sefaz-status/infrastructure/prisma-status-check.repository';
import { CheckSefazStatusUseCase } from '../../src/modules/sefaz-status/application/use-cases/check-sefaz-status/check-sefaz-status.use-case';
import { NfseStatusProbe } from '../../src/modules/sefaz-status/infrastructure/nfse-status.probe';
import {
  StatusProbe,
  type ProbeResult,
} from '../../src/modules/sefaz-status/domain/status-probe';
import { AllowAllCompanyAccessPolicy } from '../../src/shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../src/shared/infra/http/auth/authenticated-user';

/// T027 (US2) — NFS-e entra na mesma consulta, hoje como `UNVERIFIABLE` (R2),
/// e de forma **independente** dos demais modelos. Prova que a resposta de um
/// modelo não contamina a do outro, e que `UNVERIFIABLE` nunca é apresentado
/// como um `OPERATIONAL` não confirmado (FR-002/FR-003).
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

const USER: AuthenticatedUser = {
  sub: randomUUID(),
  roles: ['platform_admin'],
};

/// Dublê para o caminho SEFAZ (NF-e/NFC-e), com resultado fixo.
class FixedSefazProbe extends StatusProbe {
  constructor(private readonly result: ProbeResult) {
    super();
  }
  probe(): Promise<ProbeResult> {
    return Promise.resolve(this.result);
  }
}

describeIfDb('NFS-e status — UNVERIFIABLE independente (Postgres real)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaStatusCheckRepository(prisma);
  const nfse = new NfseStatusProbe();

  beforeAll(() => prisma.$connect());
  afterAll(() => prisma.$disconnect());

  async function cleanup(companyId: string): Promise<void> {
    await prisma.sefazStatusCheck.deleteMany({ where: { companyId } });
  }

  it('só NFS-e → UNVERIFIABLE com razão declarada; overall INCONCLUSIVE', async () => {
    const companyId = randomUUID();
    await cleanup(companyId);
    const useCase = new CheckSefazStatusUseCase(
      new AllowAllCompanyAccessPolicy(),
      repository,
      new FixedSefazProbe({
        status: 'OPERATIONAL',
        authority: 'SVRS',
        authorityMessage: null,
        expectedReturnAt: null,
      }) as never,
      nfse,
    );

    const response = await useCase.execute({
      companyId,
      user: USER,
      models: ['NFSE'],
    });

    expect(response.results).toHaveLength(1);
    expect(response.results[0].status).toBe('UNVERIFIABLE');
    expect(response.results[0].authority).toBe('SEFIN-NACIONAL');
    expect(response.results[0].authorityMessage).toBeTruthy();
    // UNVERIFIABLE não agenda nova verificação.
    expect(response.results[0].nextCheckAt).toBeNull();
    // Nada confirmado, nada quebrado → INCONCLUSIVE, nunca ALL_OPERATIONAL.
    expect(response.overall).toBe('INCONCLUSIVE');
    await cleanup(companyId);
  });

  it('NFC-e OPERATIONAL + NFS-e UNVERIFIABLE → situações independentes', async () => {
    const companyId = randomUUID();
    await cleanup(companyId);
    const useCase = new CheckSefazStatusUseCase(
      new AllowAllCompanyAccessPolicy(),
      repository,
      new FixedSefazProbe({
        status: 'OPERATIONAL',
        authority: 'SVRS',
        authorityMessage: 'Servico em Operacao',
        expectedReturnAt: null,
      }) as never,
      nfse,
    );

    const response = await useCase.execute({
      companyId,
      user: USER,
      models: ['NFCE', 'NFSE'],
    });

    const byModel = Object.fromEntries(
      response.results.map((r) => [r.model, r]),
    );
    expect(byModel.NFCE.status).toBe('OPERATIONAL');
    expect(byModel.NFSE.status).toBe('UNVERIFIABLE');
    // Um OPERATIONAL e um UNVERIFIABLE: sem problema, mas não tudo confirmado.
    expect(response.overall).toBe('INCONCLUSIVE');
    await cleanup(companyId);
  });
});
