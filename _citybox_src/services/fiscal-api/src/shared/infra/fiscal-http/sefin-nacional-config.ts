import { SefinEnvironmentNotConfiguredError } from './errors/sefin-environment-not-configured.error';

/// Ambiente de produção restrita do Sistema Nacional da NFS-e. Endpoints
/// confirmados no portal oficial e no OpenAPI lido em 2026-08-06.
/// Resolvidas a cada chamada, nao no load do modulo — mesmo motivo de
/// `sefaz-ca-bundle.ts`: a env vale mesmo quando definida depois do import, e
/// a guarda de producao fica verificavel sem recarregar modulo.
function homologationBaseUrl(): string {
  return (
    process.env.SEFIN_NACIONAL_HOMOLOGATION_ENDPOINT ??
    'https://sefin.producaorestrita.nfse.gov.br/SefinNacional'
  );
}

/// ⚠️ Produção deliberadamente SEM default.
///
/// Emitir em produção gera documento fiscal com valor legal e obrigação
/// tributária — não é um flag de configuração, é uma decisão de negócio. Só
/// definir `SEFIN_NACIONAL_PRODUCTION_ENDPOINT` quando essa decisão for
/// tomada explicitamente. Sem a variável, `resolveSefinEndpoint` recusa
/// PRODUCTION em vez de cair em algum default — mesmo padrão já adotado para
/// a SEFAZ-BA em `sefaz-ba-config.ts`.
function productionBaseUrl(): string | undefined {
  return process.env.SEFIN_NACIONAL_PRODUCTION_ENDPOINT;
}

export type SefinOperation =
  | 'nfse'
  | 'nfse/{chaveAcesso}'
  | 'nfse/{chaveAcesso}/eventos'
  | 'dps/{id}';

export function resolveSefinEndpoint(
  path: string,
  environment: 'HOMOLOGATION' | 'PRODUCTION',
): string {
  const baseUrl =
    environment === 'PRODUCTION' ? productionBaseUrl() : homologationBaseUrl();

  if (!baseUrl) {
    throw new SefinEnvironmentNotConfiguredError(
      'resolveSefinEndpoint',
      environment,
    );
  }

  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

/// `tpAmb` do leiaute nacional: 1 = Produção, 2 = Homologação.
export function resolveTpAmb(
  environment: 'HOMOLOGATION' | 'PRODUCTION',
): '1' | '2' {
  return environment === 'PRODUCTION' ? '1' : '2';
}
