import { SetMetadata } from '@nestjs/common';

export const SKIP_IMOVEIS_SCOPE_KEY = 'citybox:skip-imoveis-scope';

/** Rotas sem escopo de loja (ex.: GET /v1/members/me). */
export const SkipImoveisScope = () => SetMetadata(SKIP_IMOVEIS_SCOPE_KEY, true);
