import { DomainError } from '../../../core/errors/domain.error';

/// Enviar payload vazio ao ambiente nacional consumiria uma tentativa e
/// voltaria como rejeição genérica de área de dados (`E1226`), que não diz
/// nada sobre a causa. Falhar aqui aponta o problema onde ele está.
export class EmptyDpsPayloadError extends DomainError {
  constructor(context: string) {
    super({
      internalMessage: 'DPS vazia — nada a compactar para transmissão',
      externalMessage:
        'Documento fiscal sem conteúdo para transmissão ao órgão fiscal.',
      context,
    });
  }
}
