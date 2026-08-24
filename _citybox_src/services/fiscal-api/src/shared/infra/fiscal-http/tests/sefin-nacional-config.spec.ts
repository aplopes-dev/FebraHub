import { resolveSefinEndpoint, resolveTpAmb } from '../sefin-nacional-config';
import { SefinEnvironmentNotConfiguredError } from '../errors/sefin-environment-not-configured.error';

describe('sefin-nacional-config', () => {
  afterEach(() => {
    delete process.env.SEFIN_NACIONAL_PRODUCTION_ENDPOINT;
  });

  it('resolves the restricted-production (homologation) endpoint by default', () => {
    const url = resolveSefinEndpoint('nfse', 'HOMOLOGATION');

    expect(url).toBe(
      'https://sefin.producaorestrita.nfse.gov.br/SefinNacional/nfse',
    );
  });

  /// Guarda deliberada: emitir em produção cria documento com valor legal e
  /// obrigação tributária. Sem a variável definida explicitamente, a
  /// tentativa morre aqui — antes de assinar, numerar ou contatar o órgão.
  it('refuses PRODUCTION while no production endpoint is explicitly configured', () => {
    expect(() => resolveSefinEndpoint('nfse', 'PRODUCTION')).toThrow(
      SefinEnvironmentNotConfiguredError,
    );
  });

  it('maps environment to the tpAmb of the national layout', () => {
    expect(resolveTpAmb('HOMOLOGATION')).toBe('2');
    expect(resolveTpAmb('PRODUCTION')).toBe('1');
  });

  it('joins base and path without duplicating slashes', () => {
    expect(resolveSefinEndpoint('/dps/123', 'HOMOLOGATION')).toContain(
      '/SefinNacional/dps/123',
    );
    expect(resolveSefinEndpoint('/dps/123', 'HOMOLOGATION')).not.toContain(
      '//dps',
    );
  });
});
