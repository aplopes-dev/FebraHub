import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';
import { PrismaStatusCheckRepository } from '../../src/modules/sefaz-status/infrastructure/prisma-status-check.repository';
import { CheckSefazStatusUseCase } from '../../src/modules/sefaz-status/application/use-cases/check-sefaz-status/check-sefaz-status.use-case';
import {
  StatusProbe,
  type ProbeResult,
} from '../../src/modules/sefaz-status/domain/status-probe';
import { NfseStatusProbe } from '../../src/modules/sefaz-status/infrastructure/nfse-status.probe';
import { AllowAllCompanyAccessPolicy } from '../../src/shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../src/shared/infra/http/auth/authenticated-user';

/// T028 (US3) — a serialização de FR-007b contra **Postgres real**.
///
/// ⚠️ **Esta suíte não é substituível por dublê em memória.** Ela prova a
/// propriedade que dá razão ao advisory lock: N consultas simultâneas com a
/// janela vencida resultam em **um** contato ao órgão, não N. Em memória o
/// caminho é sequencial por natureza e passa mesmo sem lock nenhum — foi
/// exatamente assim que a fila de contingência escondeu o bug uma vez. Só o
/// Postgres real, com transações concorrentes de verdade, pega a regressão.
///
/// ✅ **Mutation testing (T029), executado em 2026-08-12.** Neutralizado o
/// `pg_advisory_xact_lock` no repositório (trocado por `SELECT 1`), este teste
/// **falhou** como esperado: `probe.calls` foi 8 em vez de 1. Ou seja, o lock é
/// load-bearing e a asserção tem dentes — não passa por acaso. Lock restaurado
/// em seguida.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

const USER: AuthenticatedUser = {
  sub: randomUUID(),
  roles: ['platform_admin'],
};
const CONCURRENCY = 8;

/// Probe que conta contatos e demora um pouco — a demora abre a janela de
/// corrida em que duas transações poderiam contatar o órgão sem o lock.
class CountingSlowProbe extends StatusProbe {
  calls = 0;
  probe(): Promise<ProbeResult> {
    this.calls += 1;
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            status: 'OPERATIONAL',
            authority: 'SVRS',
            authorityMessage: 'ok',
            expectedReturnAt: null,
          }),
        50,
      ),
    );
  }
}

describeIfDb(
  'withWindowLock — serialização sob concorrência (Postgres real)',
  () => {
    const prisma = new PrismaService();
    const repository = new PrismaStatusCheckRepository(prisma);

    beforeAll(() => prisma.$connect());
    afterAll(() => prisma.$disconnect());

    it(`${CONCURRENCY} consultas simultâneas com janela vencida ⇒ 1 contato (FR-007b, SC-004)`, async () => {
      const companyId = randomUUID();
      await prisma.sefazStatusCheck.deleteMany({ where: { companyId } });

      const probe = new CountingSlowProbe();
      const useCase = new CheckSefazStatusUseCase(
        new AllowAllCompanyAccessPolicy(),
        repository,
        probe as never,
        new NfseStatusProbe(),
      );

      // Todas contra a MESMA chave (companyId, NFCE, HOMOLOGATION), disparadas
      // juntas — sem cache prévio, a janela está vencida para todas.
      const responses = await Promise.all(
        Array.from({ length: CONCURRENCY }, () =>
          useCase.execute({ companyId, user: USER, models: ['NFCE'] }),
        ),
      );

      // O que importa: UM contato real, não CONCURRENCY.
      expect(probe.calls).toBe(1);

      // Todas viram o mesmo resultado (o do único contato).
      for (const response of responses) {
        expect(response.results[0].status).toBe('OPERATIONAL');
      }

      // E o banco tem UMA linha, não oito — a tabela é a auditoria (FR-013).
      const rows = await prisma.sefazStatusCheck.count({
        where: { companyId },
      });
      expect(rows).toBe(1);

      await prisma.sefazStatusCheck.deleteMany({ where: { companyId } });
    });
  },
);
