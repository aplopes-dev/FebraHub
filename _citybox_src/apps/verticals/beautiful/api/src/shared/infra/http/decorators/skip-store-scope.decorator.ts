import { SetMetadata } from '@nestjs/common';

export const SKIP_STORE_SCOPE_KEY = 'citybox:skip-store-scope';

/**
 * Dispensa a checagem de escopo de loja.
 * Usar só em rotas que não operam sobre uma loja (ex.: GET /v1/members/me).
 */
export const SkipStoreScope = () => SetMetadata(SKIP_STORE_SCOPE_KEY, true);
