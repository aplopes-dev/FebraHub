import { createParamDecorator } from '@nestjs/common';
import {
  getRequestActor,
  getTenantContext,
  type RequestActor,
  type TenantContext,
} from '../../tenancy/tenant-context';

/**
 * Id da organização ativa da requisição.
 *
 * Não lê o header direto: lê o contexto que o `TenantContextGuard` já validou.
 * Um header cru diria só o que o cliente pediu; isto diz o que ele pode.
 */
export const OrganizationId = createParamDecorator(
  (): string => getTenantContext().organizationId,
);

/** Filial ativa (`X-Branch-Id`), já validada contra o acesso do membro. */
export const BranchId = createParamDecorator(
  (): string | null => getTenantContext().branchId,
);

/** Contexto completo — papel, filiais acessíveis e organização. */
export const Tenant = createParamDecorator(
  (): TenantContext => getTenantContext(),
);

/** Usuário local do ERP (id, `sub` do Keycloak, e-mail). */
export const Actor = createParamDecorator(
  (): RequestActor => getRequestActor(),
);
