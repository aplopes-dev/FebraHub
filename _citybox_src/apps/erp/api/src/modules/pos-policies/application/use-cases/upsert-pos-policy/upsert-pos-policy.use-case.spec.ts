import { UpsertPosPolicyUseCase } from './upsert-pos-policy.use-case';
import { GetPosPolicyUseCase } from '../get-pos-policy/get-pos-policy.use-case';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ORGANIZATION_ID } from '../../../../tenancy/tests/tenancy-test-factory';
import { InMemoryPosPolicyRepository } from '../../../tests/in-memory-pos-policy.repository';

describe('PosPolicy — alçadas do PDV', () => {
  function setup() {
    const repository = new InMemoryPosPolicyRepository();
    return {
      repository,
      get: new GetPosPolicyUseCase(repository),
      upsert: new UpsertPosPolicyUseCase(repository),
    };
  }

  describe('leitura', () => {
    it('organização nova nasce restritiva', async () => {
      const { get } = setup();

      const policy = await get.execute({ organizationId: ORGANIZATION_ID });

      // Nascer permissivo seria uma loja sem alçada sem ninguém ter decidido.
      expect(policy.cancellationRequiresSupervisor).toBe(true);
      expect(policy.refundRequiresSupervisor).toBe(true);
      expect(policy.discountSupervisorAbovePercent).toBe(10);
    });

    it('não devolve 404: cria e persiste na primeira leitura', async () => {
      const { get, repository } = setup();

      await get.execute({ organizationId: ORGANIZATION_ID });

      // Se respondesse 404, tela do ERP e PDV inventariam cada um o seu
      // fallback — e inventariam diferente.
      expect(
        await repository.findByOrganization(ORGANIZATION_ID),
      ).not.toBeNull();
    });

    it('a segunda leitura devolve a mesma política', async () => {
      const { get } = setup();

      const first = await get.execute({ organizationId: ORGANIZATION_ID });
      const second = await get.execute({ organizationId: ORGANIZATION_ID });

      expect(second.id).toBe(first.id);
    });
  });

  describe('gravação', () => {
    it('cria com defaults quando ainda não existe', async () => {
      const { upsert } = setup();

      const policy = await upsert.execute({
        organizationId: ORGANIZATION_ID,
        discountSupervisorAbovePercent: 25,
      });

      expect(policy.discountSupervisorAbovePercent).toBe(25);
      // O que não veio no corpo continua no default.
      expect(policy.cancellationRequiresSupervisor).toBe(true);
    });

    it('campo ausente não muda', async () => {
      const { upsert } = setup();
      await upsert.execute({
        organizationId: ORGANIZATION_ID,
        discountSupervisorAbovePercent: 25,
        refundRequiresSupervisor: false,
      });

      const updated = await upsert.execute({
        organizationId: ORGANIZATION_ID,
        withdrawalSupervisorAboveCents: 100_000,
      });

      expect(updated.discountSupervisorAbovePercent).toBe(25);
      expect(updated.refundRequiresSupervisor).toBe(false);
      expect(updated.withdrawalSupervisorAboveCents).toBe(100_000);
    });

    it('recusa percentual fora de 0–100', async () => {
      const { upsert } = setup();

      for (const percent of [-1, 101]) {
        await expect(
          upsert.execute({
            organizationId: ORGANIZATION_ID,
            discountSupervisorAbovePercent: percent,
          }),
        ).rejects.toBeInstanceOf(ValidatorDomainError);
      }
    });

    it('recusa limite de sangria negativo', async () => {
      const { upsert } = setup();

      await expect(
        upsert.execute({
          organizationId: ORGANIZATION_ID,
          withdrawalSupervisorAboveCents: -1,
        }),
      ).rejects.toBeInstanceOf(ValidatorDomainError);
    });
  });

  describe('a regra de alçada mora na entidade', () => {
    it('o limite é exclusivo: exatamente no teto passa sem supervisor', async () => {
      const { upsert } = setup();
      const policy = await upsert.execute({
        organizationId: ORGANIZATION_ID,
        discountSupervisorAbovePercent: 10,
        withdrawalSupervisorAboveCents: 50_000,
      });

      // "Até 10%" é como o lojista lê o campo — 10% tem que passar.
      expect(policy.requiresSupervisorForDiscount(10)).toBe(false);
      expect(policy.requiresSupervisorForDiscount(11)).toBe(true);
      expect(policy.requiresSupervisorForWithdrawal(50_000)).toBe(false);
      expect(policy.requiresSupervisorForWithdrawal(50_001)).toBe(true);
    });

    it('100% desliga a exigência de desconto; 0 liga sempre a de sangria', async () => {
      const { upsert } = setup();
      const policy = await upsert.execute({
        organizationId: ORGANIZATION_ID,
        discountSupervisorAbovePercent: 100,
        withdrawalSupervisorAboveCents: 0,
      });

      expect(policy.requiresSupervisorForDiscount(100)).toBe(false);
      expect(policy.requiresSupervisorForWithdrawal(1)).toBe(true);
    });
  });
});
