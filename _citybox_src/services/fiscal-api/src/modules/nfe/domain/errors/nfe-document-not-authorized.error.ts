import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Cancelamento/carta de correção só se aplicam a uma NF-e com status
/// `AUTHORIZED` (US4 — não há o que cancelar/corrigir em um documento ainda
/// não autorizado, rejeitado, ou já cancelado). Distinto do `409 Conflict`
/// documentado para "fora do prazo legal" (contracts/nfe-api.md) — esse é um
/// caso de estado incompatível com a operação, não de prazo; mapeia para
/// `422` (default do `AppExceptionFilter` para `DomainError` sem substring
/// especial), consistente com os demais erros de pré-condição de negócio.
export class NfeDocumentNotAuthorizedError extends DomainError {
  constructor(
    context: string,
    fiscalDocumentId: string,
    currentStatus: string,
    operation: string,
  ) {
    super({
      internalMessage: `NF-e "${fiscalDocumentId}" is "${currentStatus}", cannot ${operation} (requires AUTHORIZED)`,
      externalMessage: `Documento fiscal não está autorizado (status atual: ${currentStatus})`,
      context,
    });
  }
}
