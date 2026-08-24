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

/// T030 (US3) — o cache respeita a janela e **sobrevive a reinício** (FR-007,
/// SC-005). Sobrevivência ao restart é implícita mas real: o dado vive no
/// Postgres, não em memória de processo. Aqui o provamos criando um segundo
/// caso de uso com um probe NOVO (como se o processo tivesse reiniciado): ele
/// ainda serve do cache sem contatar o órgão.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

const USER: AuthenticatedUser = {
  sub: randomUUID(),
  roles: ['platform_admin'],
};

class CountingProbe extends StatusProbe {
  calls = 0;
  probe(): Promise<ProbeResult> {
    this.calls += 1;
    return Promise.resolve({
      status: 'OPERATIONAL',
      authority: 'SVRS',
      authorityMessage: 'ok',
      expectedReturnAt: null,
    });
  }
}

describeIfDb(
  'window cache — dentro da janela e através de restart (Postgres real)',
  () => {
    const prisma = new PrismaService();
    const repository = new PrismaStatusCheckRepository(prisma);

    beforeAll(() => prisma.$connect());
    afterAll(() => prisma.$disconnect());

    function newUseCase(probe: StatusProbe): CheckSefazStatusUseCase {
      return new CheckSefazStatusUseCase(
        new AllowAllCompanyAccessPolicy(),
        repository,
        probe as never,
        new NfseStatusProbe(),
      );
    }

    it('segunda consulta na janela serve do cache; zero contato novo (FR-007, SC-005)', async () => {
      const companyId = randomUUID();
      await prisma.sefazStatusCheck.deleteMany({ where: { companyId } });

      const probe = new CountingProbe();
      const useCase = newUseCase(probe);

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

      expect(probe.calls).toBe(1);
      expect(second.results[0].checkedAt.getTime()).toBe(
        first.results[0].checkedAt.getTime(),
      );
      // A idade cresce; a resposta declara há quanto tempo o dado foi obtido.
      expect(second.results[0].ageSeconds).toBeGreaterThanOrEqual(0);
      // E há uma próxima verificação agendada (fim da janela).
      expect(second.results[0].nextCheckAt).not.toBeNull();

      await prisma.sefazStatusCheck.deleteMany({ where: { companyId } });
    });

    it('após "restart" (novo caso de uso, novo probe) o cache persiste — dado está no Postgres, não em memória', async () => {
      const companyId = randomUUID();
      await prisma.sefazStatusCheck.deleteMany({ where: { companyId } });

      // Processo 1: primeira verificação, um contato.
      const probe1 = new CountingProbe();
      await newUseCase(probe1).execute({
        companyId,
        user: USER,
        models: ['NFCE'],
      });
      expect(probe1.calls).toBe(1);

      // Processo 2 (simula restart): estado zerado em memória, probe novo.
      const probe2 = new CountingProbe();
      const afterRestart = await newUseCase(probe2).execute({
        companyId,
        user: USER,
        models: ['NFCE'],
      });

      // Nenhum contato novo — a janela veio do Postgres, não da memória perdida.
      expect(probe2.calls).toBe(0);
      expect(afterRestart.results[0].status).toBe('OPERATIONAL');

      await prisma.sefazStatusCheck.deleteMany({ where: { companyId } });
    });
  },
);
