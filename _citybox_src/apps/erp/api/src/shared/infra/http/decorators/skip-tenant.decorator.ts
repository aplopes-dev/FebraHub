import { SetMetadata } from '@nestjs/common';

export const SKIP_TENANT_KEY = 'citybox:skip-tenant';

/**
 * Rota autenticada que NÃO exige `X-Organization-Id`.
 *
 * É o caso das rotas que existem antes de haver organização (criar a primeira)
 * ou que operam sobre o conjunto delas (listar as minhas). O
 * `TenantContextGuard` ainda resolve o `User` local — só não exige membership.
 */
export const SkipTenant = () => SetMetadata(SKIP_TENANT_KEY, true);
