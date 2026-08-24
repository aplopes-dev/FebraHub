import { MunicipalParameters } from '../entities/municipal-parameters.entity';
import { resolveSubstitutionBlocker } from './nfse-substitution-eligibility';

const AUTHORIZED_AT = new Date('2026-08-01T10:00:00-03:00');
const INSIDE_WINDOW = new Date('2026-08-03T10:00:00-03:00'); // 2 dias depois

function parametersWith(
  parameters: Record<string, unknown>,
): MunicipalParameters {
  return MunicipalParameters.create({
    cityCodeIbge: '2913606',
    parameters,
    fetchedAt: new Date(),
  });
}

const eligible = {
  authorizedAt: AUTHORIZED_AT,
  now: INSIDE_WINDOW,
  parameters: parametersWith({ prazoSubstituicao: 5 }),
  hasCustomerIdentification: true,
  hasPendingFiscalAnalysis: false,
  hasOfficialBlock: false,
};

/// FR-013/T029: as quatro recusas da substituição.
describe('resolveSubstitutionBlocker', () => {
  it('allows substitution inside the published window with nothing pending', () => {
    expect(resolveSubstitutionBlocker(eligible)).toBeNull();
  });

  it('blocks once the published substitution window has passed', () => {
    expect(
      resolveSubstitutionBlocker({
        ...eligible,
        now: new Date('2026-08-09T10:00:00-03:00'), // 8 dias depois
      }),
    ).toBe('DEADLINE_EXPIRED');
  });

  /// ⚠️ Regra REVISADA em 2026-08-07, por decisão de negócio.
  ///
  /// Antes bloqueava sem prazo publicado. Mas a parametrização REAL de Ilhéus
  /// (`/convenio`) não publica prazo nenhum — o efeito era substituição
  /// permanentemente indisponível, não um bloqueio conservador.
  ///
  /// Agora quem decide é o **Sefin**: ele conhece a janela e recusa o evento
  /// `e105102` se estiver fora dela. O risco assumido (nota nova emitida e
  /// evento recusado) é tratado no caso de uso com cancelamento compensatório.
  it('lets the tax authority decide when the municipality publishes no deadline', () => {
    expect(
      resolveSubstitutionBlocker({
        ...eligible,
        parameters: parametersWith({}),
      }),
    ).toBeNull();
  });

  it('lets the tax authority decide when parameters could not be resolved', () => {
    expect(
      resolveSubstitutionBlocker({ ...eligible, parameters: null }),
    ).toBeNull();
  });

  /// Prazo PUBLICADO e vencido continua bloqueando localmente: aí não é falta
  /// de informação, é informação dizendo que não pode. Transmitir seria gastar
  /// uma numeração para receber uma recusa previsível.
  it('still blocks when a published deadline has actually passed', () => {
    expect(
      resolveSubstitutionBlocker({
        ...eligible,
        now: new Date('2026-08-09T10:00:00-03:00'),
        parameters: parametersWith({ prazoSubstituicao: 5 }),
      }),
    ).toBe('DEADLINE_EXPIRED');
  });

  it('requires customer identification only when the municipality demands it', () => {
    const withoutCustomer = {
      ...eligible,
      hasCustomerIdentification: false,
    };

    // Município não exige — segue.
    expect(resolveSubstitutionBlocker(withoutCustomer)).toBeNull();

    // Município exige — bloqueia.
    expect(
      resolveSubstitutionBlocker({
        ...withoutCustomer,
        parameters: parametersWith({
          prazoSubstituicao: 5,
          exigeTomadorSubstituicao: true,
        }),
      }),
    ).toBe('CUSTOMER_REQUIRED');
  });

  it('blocks while a fiscal-analysis request is still awaiting judgement', () => {
    expect(
      resolveSubstitutionBlocker({
        ...eligible,
        hasPendingFiscalAnalysis: true,
      }),
    ).toBe('FISCAL_ANALYSIS_PENDING');
  });

  it('blocks when the municipality placed an official hold on the note', () => {
    expect(
      resolveSubstitutionBlocker({ ...eligible, hasOfficialBlock: true }),
    ).toBe('OFFICIAL_BLOCK');
  });

  /// A ordem importa para o operador, não para a máquina: bloqueios que ele não
  /// resolve sozinho vêm primeiro. Reportar "informe o tomador" para uma nota
  /// sob bloqueio de ofício o faria preencher dados e tentar de novo para nada.
  it('reports the blocker the operator cannot resolve before the one they can', () => {
    expect(
      resolveSubstitutionBlocker({
        ...eligible,
        hasOfficialBlock: true,
        hasPendingFiscalAnalysis: true,
        hasCustomerIdentification: false,
        parameters: parametersWith({ exigeTomadorSubstituicao: true }),
        now: new Date('2026-09-01T10:00:00-03:00'),
      }),
    ).toBe('OFFICIAL_BLOCK');
  });
});
