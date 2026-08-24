import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import type { SubstitutionBlocker } from '../rules/nfse-substitution-eligibility';

/// Mensagem por impedimento. Cada uma diz **o que fazer**, não só o que houve:
/// "prazo expirado" sem alternativa deixa o operador sem próximo passo, e o
/// cancelamento continua disponível nesse caso.
const MESSAGE: Record<
  SubstitutionBlocker | 'MISSING_ACCESS_KEY' | 'VALUE_MISMATCH',
  string
> = {
  DEADLINE_EXPIRED:
    'Prazo de substituição encerrado ou não publicado pelo município. Solicite o cancelamento da nota.',
  CUSTOMER_REQUIRED:
    'O município exige identificação do tomador (CPF/CNPJ) para substituir a nota. Informe o tomador na nota original.',
  FISCAL_ANALYSIS_PENDING:
    'Existe pedido de análise fiscal em julgamento para esta nota. Aguarde a decisão do município.',
  OFFICIAL_BLOCK:
    'A nota está sob bloqueio de ofício do município. Procure a administração tributária.',
  VALUE_MISMATCH:
    'A nota substituta deve ter o MESMO valor total, tomador e competência da original. A substituição corrige outros dados, não o valor — para alterar o valor, cancele e emita uma nota nova.',
  MISSING_ACCESS_KEY:
    'A nota original não possui chave de acesso da NFS-e. Só é possível substituir uma nota efetivamente autorizada pelo órgão.',
};

/// Mapeia para 422 (FR-013). O código externo carrega o impedimento para que o
/// ERP possa reagir de forma diferente a cada um — a mensagem é para a pessoa,
/// o código é para o sistema.
export class NfseSubstitutionNotAllowedError extends ValidatorDomainError {
  constructor(
    context: string,
    fiscalDocumentId: string,
    public readonly blocker:
      | SubstitutionBlocker
      | 'MISSING_ACCESS_KEY'
      | 'VALUE_MISMATCH',
  ) {
    super({
      internalMessage: `Substitution blocked for document ${fiscalDocumentId}: ${blocker}`,
      externalMessage: MESSAGE[blocker],
      externalCode: `NFSE_SUBSTITUTION_${blocker}`,
      context,
    });
  }
}
