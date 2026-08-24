import { DomainError } from '../../../../shared/core/errors/domain.error';

/// Toda a consulta falhou por causa **local** — tipicamente certificado
/// ausente/vencido, que impede contatar qualquer órgão (FR-010). Mapeia para
/// 422 (DomainError genérico no filtro HTTP): é erro do lado de cá, não
/// indisponibilidade do órgão.
///
/// Só é lançado quando **todos** os modelos pedidos deram `LOCAL_ERROR`. Se
/// apenas parte deu, a consulta responde 200 e cada modelo reporta sua
/// situação — um problema local em um modelo não esconde a resposta dos outros.
export class StatusLocalFailureError extends DomainError {
  constructor(context: string, detail: string) {
    super({
      internalMessage: `Status check failed locally for all requested models: ${detail}`,
      externalMessage:
        'Não foi possível consultar o status: verifique o certificado digital do emitente.',
      externalCode: 'STATUS_LOCAL_FAILURE',
      context,
    });
  }
}
