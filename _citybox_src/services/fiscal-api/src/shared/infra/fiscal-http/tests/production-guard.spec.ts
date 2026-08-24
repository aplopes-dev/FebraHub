/// Emitir em produção cria documento com **valor legal e obrigação
/// tributária** — é decisão de negócio, não flag de configuração. As duas
/// configs abaixo recusam PRODUCTION quando a variável não está definida, e
/// nenhuma delas tem valor padrão.
///
/// Este teste existe porque a recusa é *estrutural*: alguém adicionando um
/// default "para facilitar o desenvolvimento" removeria a proteção sem que
/// nada mais quebrasse. Aqui quebra.
///
/// As configs resolvem a env **a cada chamada** (não no load do módulo), o que
/// as torna testáveis por import direto — e faz a env valer mesmo quando
/// definida depois do import, que é o comportamento certo em deploy também.
import { resolveSefinEndpoint } from '../sefin-nacional-config';
import { resolveMunicipalParametersEndpoint } from '../municipal-parameters-config';
import { SefinEnvironmentNotConfiguredError } from '../errors/sefin-environment-not-configured.error';

describe('recusa estrutural de PRODUCTION', () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('refuses the Sefin production endpoint when it is not configured', () => {
    delete process.env.SEFIN_NACIONAL_PRODUCTION_ENDPOINT;
    expect(() => resolveSefinEndpoint('nfse', 'PRODUCTION')).toThrow(
      SefinEnvironmentNotConfiguredError,
    );
  });

  it('refuses the parameters production endpoint when it is not configured', () => {
    delete process.env.NFSE_PARAMETRIZACAO_PRODUCTION_ENDPOINT;
    expect(() =>
      resolveMunicipalParametersEndpoint('2913606/convenio', 'PRODUCTION'),
    ).toThrow(SefinEnvironmentNotConfiguredError);
  });

  /// Homologação **não** depende de configuração: tem default, e é onde se
  /// testa. Se este caso quebrasse, a recusa de produção estaria valendo para
  /// os dois ambientes e ninguém conseguiria emitir nada.
  it('resolves homologation without any environment variable', () => {
    delete process.env.SEFIN_NACIONAL_HOMOLOGATION_ENDPOINT;
    expect(resolveSefinEndpoint('nfse', 'HOMOLOGATION')).toContain('nfse');
  });

  /// A recusa é por ausência de configuração, não por proibição do ambiente:
  /// quando a organização decidir emitir em produção, define a variável e o
  /// caminho abre — sem alterar código.
  it('resolves production once the endpoint is explicitly configured', () => {
    process.env.SEFIN_NACIONAL_PRODUCTION_ENDPOINT =
      'https://sefin.nfse.gov.br/SefinNacional';
    expect(resolveSefinEndpoint('nfse', 'PRODUCTION')).toBe(
      'https://sefin.nfse.gov.br/SefinNacional/nfse',
    );
  });

  /// Barra final duplicada quebraria o path silenciosamente — o órgão
  /// responderia 404 e o diagnóstico seria "o serviço está fora do ar".
  it('normalises a trailing slash in the configured base URL', () => {
    process.env.SEFIN_NACIONAL_PRODUCTION_ENDPOINT =
      'https://sefin.nfse.gov.br/SefinNacional/';
    expect(resolveSefinEndpoint('/nfse', 'PRODUCTION')).toBe(
      'https://sefin.nfse.gov.br/SefinNacional/nfse',
    );
  });
});
