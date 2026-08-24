import { MunicipalParameters } from '../entities/municipal-parameters.entity';

const build = (parameters: Record<string, unknown>, fetchedAt = new Date()) =>
  MunicipalParameters.create({
    cityCodeIbge: '2913606',
    parameters,
    fetchedAt,
  });

describe('MunicipalParameters', () => {
  describe('validade do cache', () => {
    it('is fresh right after being fetched', () => {
      expect(build({}).isStale()).toBe(false);
    });

    it('goes stale after a day — parametrização muda por decreto, não por minuto', () => {
      const ontem = new Date(Date.now() - 25 * 60 * 60 * 1000);

      expect(build({}, ontem).isStale()).toBe(true);
    });
  });

  describe('prazo de cancelamento (FR-012)', () => {
    it('reads the deadline from the municipal payload', () => {
      expect(build({ prazoCancelamento: 30 }).cancelDeadlineDays).toBe(30);
    });

    it('accepts the numeric value as a string', () => {
      // Payload municipal não garante tipo — ler "30" como ausente faria o
      // caso de uso encaminhar para análise fiscal sem necessidade.
      expect(build({ prazoCancelamento: '15' }).cancelDeadlineDays).toBe(15);
    });

    /// O caminho conservador importa: sem prazo parametrizado, o caso de uso
    /// deve encaminhar para análise fiscal em vez de assumir um número. Um
    /// default silencioso aqui cancelaria notas fora do prazo legal.
    it('returns null when the municipality did not parameterise a deadline', () => {
      expect(build({}).cancelDeadlineDays).toBeNull();
      expect(
        build({ prazoCancelamento: 'texto' }).cancelDeadlineDays,
      ).toBeNull();
    });

    it('recognises the alternative spellings the payload may use', () => {
      expect(build({ diasCancelamento: 7 }).cancelDeadlineDays).toBe(7);
      expect(build({ prazoCancelamentoDias: 10 }).cancelDeadlineDays).toBe(10);
    });
  });

  describe('substituição', () => {
    it('reads its own deadline, independent of the cancel one', () => {
      const p = build({ prazoCancelamento: 30, prazoSubstituicao: 5 });

      expect(p.substitutionDeadlineDays).toBe(5);
      expect(p.cancelDeadlineDays).toBe(30);
    });

    it('defaults to not requiring the customer when the municipality is silent', () => {
      expect(build({}).requiresCustomerForSubstitution).toBe(false);
    });

    it('understands boolean-ish values in Portuguese', () => {
      expect(
        build({ exigeTomadorSubstituicao: true })
          .requiresCustomerForSubstitution,
      ).toBe(true);
      expect(
        build({ exigeTomadorSubstituicao: 'sim' })
          .requiresCustomerForSubstitution,
      ).toBe(true);
      expect(
        build({ exigeTomadorSubstituicao: 'não' })
          .requiresCustomerForSubstitution,
      ).toBe(false);
    });
  });
});
