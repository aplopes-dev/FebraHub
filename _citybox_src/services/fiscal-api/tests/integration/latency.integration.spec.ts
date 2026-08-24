import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';
import { PrismaStatusCheckRepository } from '../../src/modules/sefaz-status/infrastructure/prisma-status-check.repository';
import { CheckSefazStatusUseCase } from '../../src/modules/sefaz-status/application/use-cases/check-sefaz-status/check-sefaz-status.use-case';
import {
  StatusProbe,
  type ProbeResult,
} from '../../src/modules/sefaz-status/domain/status-probe';
import { AllowAllCompanyAccessPolicy } from '../../src/shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../src/shared/infra/http/auth/authenticated-user';

/// T031 (SC-003, FR-008a) — a consulta responde em ≤5s no **pior caso**: os três
/// modelos consultados e todos os órgãos lentos/inacessíveis. É o teste que
/// reprova se o contato virar sequencial — três esperas de ~2s somariam 6s.
/// Com contato paralelo, o total fica próximo do pior caso de UM órgão.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

const USER: AuthenticatedUser = {
  sub: randomUUID(),
  roles: ['platform_admin'],
};

/// Simula um órgão lento: demora `delayMs` e então devolve UNREACHABLE (como se
/// tivesse estourado o timeout). O importante é a DEMORA — se as três demoras
/// forem somadas (sequencial), o teste estoura.
class SlowProbe extends StatusProbe {
  constructor(private readonly delayMs: number) {
    super();
  }
  probe(): Promise<ProbeResult> {
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            status: 'UNREACHABLE',
            authority: 'SVRS',
            authorityMessage: null,
            expectedReturnAt: null,
          }),
        this.delayMs,
      ),
    );
  }
}

describeIfDb('latência da consulta (Postgres real)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaStatusCheckRepository(prisma);

  beforeAll(() => prisma.$connect());
  afterAll(() => prisma.$disconnect());

  it('três modelos, todos lentos → resposta paralela bem abaixo da soma (SC-003, FR-008a)', async () => {
    const companyId = randomUUID();
    await prisma.sefazStatusCheck.deleteMany({ where: { companyId } });

    // 2s por órgão. Sequencial = ~6s (reprova os 5s). Paralelo ≈ 2s.
    const PER_ORG_MS = 2_000;
    const slow = new SlowProbe(PER_ORG_MS);
    const useCase = new CheckSefazStatusUseCase(
      new AllowAllCompanyAccessPolicy(),
      repository,
      slow as never,
      slow,
    );

    const started = Date.now();
    const response = await useCase.execute({
      companyId,
      user: USER,
      models: ['NFE', 'NFCE', 'NFSE'],
    });
    const elapsed = Date.now() - started;

    // Paralelo: bem abaixo da soma sequencial (3 × 2s = 6s) e dentro dos 5s.
    expect(elapsed).toBeLessThan(5_000);
    // E prova que foi paralelo, não sorte: menos que 2 órgãos em série.
    expect(elapsed).toBeLessThan(PER_ORG_MS * 2);

    // Um órgão inalcançável não derruba os demais — três resultados voltam.
    expect(response.results).toHaveLength(3);
    expect(response.overall).toBe('HAS_PROBLEM');

    await prisma.sefazStatusCheck.deleteMany({ where: { companyId } });
  }, 15_000);
});
