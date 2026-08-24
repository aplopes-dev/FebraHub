import { InfrastructureError } from '../../core/errors/infrastructure.error';

/**
 * Uma query em model tenant-scoped rodou dentro de uma requisição que nunca
 * estabeleceu contexto de organização.
 *
 * Falha alto de propósito: sem recorte, a query devolveria linhas de todas as
 * empresas. Se a consulta é cross-tenant por natureza (ex.: "as organizações
 * deste usuário"), declare a intenção com `runWithoutTenantScope`.
 */
export class TenantScopeMissingError extends InfrastructureError {
  constructor(model: string, operation: string) {
    super({
      internalMessage: `Query ${model}.${operation} sem contexto de tenant: rota sem TenantContextGuard ou consulta cross-tenant não declarada`,
      externalMessage: 'Erro interno ao consultar os dados da organização',
      context: TenantScopeMissingError.name,
    });
  }
}
