import { MunicipalParameters } from '../entities/municipal-parameters.entity';
import { resolveCancelPath } from './nfse-cancel-path';

const AUTHORIZED_AT = new Date('2026-08-01T10:00:00-03:00');

function parametersWith(
  parameters: Record<string, unknown>,
): MunicipalParameters {
  return MunicipalParameters.create({
    cityCodeIbge: '2913606',
    parameters,
    fetchedAt: new Date(),
  });
}

/// FR-012/T026: o município decide o prazo de cancelamento direto; fora dele o
/// pedido vira solicitação de análise fiscal em vez de ser recusado. O operador
/// não precisa saber a diferença — ele pede cancelamento, o sistema escolhe.
describe('resolveCancelPath', () => {
  it('cancels directly while inside the deadline the municipality published', () => {
    const path = resolveCancelPath({
      authorizedAt: AUTHORIZED_AT,
      now: new Date('2026-08-03T10:00:00-03:00'), // 2 dias depois
      parameters: parametersWith({ prazoCancelamento: 5 }),
    });

    expect(path).toBe('DIRECT');
  });

  it('routes to fiscal analysis once the published deadline has passed', () => {
    const path = resolveCancelPath({
      authorizedAt: AUTHORIZED_AT,
      now: new Date('2026-08-09T10:00:00-03:00'), // 8 dias depois
      parameters: parametersWith({ prazoCancelamento: 5 }),
    });

    expect(path).toBe('FISCAL_ANALYSIS');
  });

  /// O prazo sai do município, não de constante nossa. Dois municípios com
  /// prazos diferentes precisam divergir para o mesmo intervalo de tempo — é o
  /// que prova que não há valor embutido no código.
  it('follows each municipality’s own deadline for the same elapsed time', () => {
    const now = new Date('2026-08-05T10:00:00-03:00'); // 4 dias depois

    expect(
      resolveCancelPath({
        authorizedAt: AUTHORIZED_AT,
        now,
        parameters: parametersWith({ prazoCancelamento: 10 }),
      }),
    ).toBe('DIRECT');

    expect(
      resolveCancelPath({
        authorizedAt: AUTHORIZED_AT,
        now,
        parameters: parametersWith({ prazoCancelamento: 2 }),
      }),
    ).toBe('FISCAL_ANALYSIS');
  });

  /// Sem parametrização não se inventa prazo. Assumir um valor arriscaria pedir
  /// cancelamento direto fora do prazo — que o município recusa. Análise fiscal
  /// é o caminho que sempre existe.
  it('routes to fiscal analysis when the municipality has not published a deadline', () => {
    expect(
      resolveCancelPath({
        authorizedAt: AUTHORIZED_AT,
        now: new Date('2026-08-01T11:00:00-03:00'), // 1 hora depois
        parameters: parametersWith({}),
      }),
    ).toBe('FISCAL_ANALYSIS');
  });

  it('routes to fiscal analysis when the parameters could not be resolved at all', () => {
    expect(
      resolveCancelPath({
        authorizedAt: AUTHORIZED_AT,
        now: new Date('2026-08-01T11:00:00-03:00'),
        parameters: null,
      }),
    ).toBe('FISCAL_ANALYSIS');
  });

  /// O limite é o fim do último dia do prazo, não o instante exato da emissão
  /// somado a N×24h — prazo fiscal se conta em dias.
  it('treats the last day of the window as still inside it', () => {
    expect(
      resolveCancelPath({
        authorizedAt: AUTHORIZED_AT,
        now: new Date('2026-08-06T23:00:00-03:00'), // 5º dia, à noite
        parameters: parametersWith({ prazoCancelamento: 5 }),
      }),
    ).toBe('DIRECT');

    expect(
      resolveCancelPath({
        authorizedAt: AUTHORIZED_AT,
        now: new Date('2026-08-07T00:30:00-03:00'), // 6º dia
        parameters: parametersWith({ prazoCancelamento: 5 }),
      }),
    ).toBe('FISCAL_ANALYSIS');
  });
});
