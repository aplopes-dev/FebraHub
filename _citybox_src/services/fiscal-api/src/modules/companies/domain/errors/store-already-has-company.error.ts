import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Relação 1:1 Loja ↔ Emitente (spec.md, Key Entities, resolvido em clarificação).
/// Nome inclui "AlreadyExists" para casar com o mapeamento de status 409 do
/// AppExceptionFilter (shared/infra/http/filters/app-exception.filter.ts).
export class CompanyAlreadyExistsForStoreError extends DomainError {
  constructor(context: string, storeId: string) {
    super({
      internalMessage: `Store "${storeId}" already has a fiscal Company registered`,
      externalMessage: 'Esta loja já possui um emitente fiscal cadastrado',
      context,
    });
  }
}
