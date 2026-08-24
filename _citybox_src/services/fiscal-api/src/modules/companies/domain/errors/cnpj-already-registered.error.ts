import { DomainError } from '../../../../shared/core/errors/domain.error';

/// CNPJ é único entre Emitentes — a constraint existe no banco desde sempre,
/// mas sem esta checagem no caso de uso a violação estourava como
/// `500 Internal server error`, que não diz nada a quem integra e parece falha
/// da API em vez de dado repetido.
///
/// "AlreadyExists" no nome casa com o mapeamento para 409 do
/// `AppExceptionFilter`, mesmo padrão de `CompanyAlreadyExistsForStoreError`.
export class CompanyAlreadyExistsForCnpjError extends DomainError {
  constructor(context: string, cnpj: string) {
    super({
      internalMessage: `CNPJ "${cnpj}" is already registered for another Company`,
      externalMessage: 'Já existe um emitente fiscal cadastrado com este CNPJ',
      context,
    });
  }
}
