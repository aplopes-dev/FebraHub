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

/// T020 — comportamento do caso de uso contra **Postgres real**.
///
/// O probe é um dublê controlado (não contatamos a SEFAZ de verdade nos testes),
/// mas o repositório é o real: é ele que guarda cache e auditoria e serializa o
/// contato. O que se prova aqui é a regra que dá razão à feature —
/// **UNREACHABLE nunca vira OPERATIONAL** (FR-003) — e que o cache respeita a
/// janela (FR-007).
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

/// Probe programável: devolve um resultado fixo e conta quantas vezes foi
/// chamado (para provar o cache).
class ProgrammableProbe extends StatusProbe {
  calls = 0;
  constructor(private result: ProbeResult) {
    super();
  }
  probe(): Promise<ProbeResult> {
    this.calls += 1;
    return Promise.resolve(this.result);
  }
}

const USER: AuthenticatedUser = {
  sub: randomUUID(),
  roles: ['platform_admin'],
};

describeIfDb('CheckSefazStatusUseCase (Postgres real)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaStatusCheckRepository(prisma);
  const policy = new AllowAllCompanyAccessPolicy();

  beforeAll(() => prisma.$connect());
  afterAll(() => prisma.$disconnect());

  async function cleanup(companyId: string): Promise<void> {
    await prisma.sefazStatusCheck.deleteMany({ where: { companyId } });
  }

  function useCaseWith(result: ProbeResult): {
    useCase: CheckSefazStatusUseCase;
    probe: ProgrammableProbe;
  } {
    const probe = new ProgrammableProbe(result);
    // Mesmo dublê para SEFAZ e NFS-e — aqui só exercitamos NFCE/NFE.
    const useCase = new CheckSefazStatusUseCase(
      policy,
      repository,
      probe as never,
      probe,
    );
    return { useCase, probe };
  }

  it('órgão respondendo → OPERATIONAL e persistido', async () => {
    const companyId = randomUUID();
    await cleanup(companyId);
    const { useCase } = useCaseWith({
      status: 'OPERATIONAL',
      authority: 'SVRS',
      authorityMessage: 'Servico em Operacao',
      expectedReturnAt: null,
    });

    const response = await useCase.execute({
      companyId,
      user: USER,
      models: ['NFCE'],
    });

    expect(response.results).toHaveLength(1);
    expect(response.results[0].status).toBe('OPERATIONAL');
    expect(response.overall).toBe('ALL_OPERATIONAL');

    const persisted = await repository.findLatest({
      companyId,
      model: 'NFCE',
      environment: 'HOMOLOGATION',
    });
    expect(persisted?.status).toBe('OPERATIONAL');
    await cleanup(companyId);
  });

  it('sem resposta → UNREACHABLE, nunca OPERATIONAL (FR-003, SC-002)', async () => {
    const companyId = randomUUID();
    await cleanup(companyId);
    const { useCase } = useCaseWith({
      status: 'UNREACHABLE',
      authority: 'SVRS',
      authorityMessage: null,
      expectedReturnAt: null,
    });

    const response = await useCase.execute({
      companyId,
      user: USER,
      models: ['NFCE'],
    });

    expect(response.results[0].status).toBe('UNREACHABLE');
    expect(response.results[0].status).not.toBe('OPERATIONAL');
    expect(response.overall).toBe('HAS_PROBLEM');
    await cleanup(companyId);
  });

  it('segunda consulta dentro da janela vem do cache (um só contato — FR-007)', async () => {
    const companyId = randomUUID();
    await cleanup(companyId);
    const { useCase, probe } = useCaseWith({
      status: 'OPERATIONAL',
      authority: 'SVRS',
      authorityMessage: 'ok',
      expectedReturnAt: null,
    });

    const first = await useCase.execute({
      companyId,
      user: USER,
      models: ['NFCE'],
    });
    const second = await useCase.execute({
      companyId,
      user: USER,
      models: ['NFCE'],
    });

    // Um único contato real; a segunda serviu do cache.
    expect(probe.calls).toBe(1);
    expect(second.results[0].checkedAt.getTime()).toBe(
      first.results[0].checkedAt.getTime(),
    );
    expect(second.results[0].ageSeconds).toBeGreaterThanOrEqual(0);
    await cleanup(companyId);
  });
});
