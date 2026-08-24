/**
 * Ambientes em que o bypass de autenticação pode existir. Allow-list, e não
 * `!== 'production'`: em produção o `NODE_ENV` pode simplesmente não estar
 * definido (bare `node dist/main`, PaaS que não injeta a variável), e aí um
 * teste de negação liberaria o bypass justamente onde ele é mais perigoso.
 */
const DEV_ENVIRONMENTS = ['development', 'test', 'local'] as const;

export const DEV_BYPASS_TOKEN = 'dev-admin';

export function isDevBypassEnabled(): boolean {
  if (process.env.AUTH_DEV_BYPASS !== 'true') return false;
  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  return (
    nodeEnv !== undefined &&
    (DEV_ENVIRONMENTS as readonly string[]).includes(nodeEnv)
  );
}

/**
 * Falha no boot em vez de subir com uma porta dos fundos aberta.
 *
 * O token de bypass é fixo e concede `platform.admin` — que entra em qualquer
 * organização. Um `.env` de dev copiado para o servidor não pode virar chave
 * mestra silenciosa.
 */
export function assertDevBypassIsSafe(): void {
  if (process.env.AUTH_DEV_BYPASS !== 'true') return;

  const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase();
  if (nodeEnv === undefined) {
    throw new Error(
      'AUTH_DEV_BYPASS=true exige NODE_ENV explícito (development, test ou local). ' +
        'Sem NODE_ENV definido o bypass fica desligado por segurança — defina NODE_ENV ou remova AUTH_DEV_BYPASS.',
    );
  }
  if (!(DEV_ENVIRONMENTS as readonly string[]).includes(nodeEnv)) {
    throw new Error(
      `AUTH_DEV_BYPASS=true é proibido com NODE_ENV=${nodeEnv}. ` +
        'O token de bypass é fixo e dá acesso a qualquer organização.',
    );
  }
}
