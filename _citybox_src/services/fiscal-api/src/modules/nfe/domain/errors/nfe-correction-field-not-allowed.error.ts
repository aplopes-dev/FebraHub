import { DomainError } from '../../../../shared/core/errors/domain.error';

/// FR-005, spec.md Edge Cases ("Como o sistema trata uma solicitação de
/// carta de correção para um campo que a legislação não permite corrigir?").
/// contracts/nfe-api.md `POST /nfe/{id}/correction-letter` → `422`. Mapeia
/// para o default do `AppExceptionFilter` para `DomainError` (sem substring
/// especial), igual a outros erros de validação de negócio.
export class NfeCorrectionFieldNotAllowedError extends DomainError {
  constructor(context: string, matchedKeyword: string) {
    super({
      internalMessage: `Correction text references a non-correctable field ("${matchedKeyword}")`,
      externalMessage:
        'O texto da correção menciona um campo que a legislação não permite corrigir por carta de correção (ex.: valores, tributos, datas, quantidades, dados cadastrais das partes)',
      context,
    });
  }
}
