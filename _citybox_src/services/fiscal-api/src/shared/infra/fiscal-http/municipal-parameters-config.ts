import { SefinEnvironmentNotConfiguredError } from './errors/sefin-environment-not-configured.error';

/// API de Parametrização do Sistema Nacional — hospedada no ADN, separada do
/// SEFIN. Endpoints confirmados no OpenAPI oficial (lido em 2026-08-06):
///
/// | Caminho | Uso |
/// |---|---|
/// | `/{municipio}/convenio` | dados do convênio do município |
/// | `/{municipio}/{servico}/{competencia}/aliquota` | alíquota vigente |
/// | `/{municipio}/{servico}/historicoaliquotas` | histórico |
/// | `/{municipio}/{competencia}/retencoes` | retenções obrigatórias |
/// | `/{municipio}/{servico}/{competencia}/regimes_especiais` | regimes especiais |
/// | `/{municipio}/{beneficio}/{competencia}/beneficio` | benefícios |
/// Resolvidas a cada chamada — ver `sefin-nacional-config.ts`.
function homologationBaseUrl(): string {
  return (
    process.env.NFSE_PARAMETRIZACAO_HOMOLOGATION_ENDPOINT ??
    'https://adn.producaorestrita.nfse.gov.br/parametrizacao'
  );
}

/// ⚠️ Sem default, mesma razão de `sefin-nacional-config.ts`: consultar
/// parametrização de produção é o primeiro passo de um fluxo que termina em
/// documento com valor legal.
function productionBaseUrl(): string | undefined {
  return process.env.NFSE_PARAMETRIZACAO_PRODUCTION_ENDPOINT;
}

export function resolveMunicipalParametersEndpoint(
  path: string,
  environment: 'HOMOLOGATION' | 'PRODUCTION',
): string {
  const baseUrl =
    environment === 'PRODUCTION' ? productionBaseUrl() : homologationBaseUrl();

  if (!baseUrl) {
    throw new SefinEnvironmentNotConfiguredError(
      'resolveMunicipalParametersEndpoint',
      environment,
    );
  }

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/// Competência no formato `AAAA-MM` exigido pelos endpoints datados.
export function toCompetencia(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
