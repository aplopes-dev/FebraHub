import { InfrastructureError } from '../../../../shared/core/errors/infrastructure.error';

/// XML de modelo diferente do que o renderizador atende.
///
/// Existe porque a biblioteca de PDF **não** reclama: ela despacha por
/// `ide.mod` e produziria um DANFE A4 para um pedido de cupom, sem erro. O
/// operador pediria cupom, receberia nota, e nada registraria o desvio.
///
/// 500 (`InfrastructureError` sem palavra-chave no nome), e isso é
/// deliberado: não é dado inválido do cliente nem dependência ausente — é
/// **defeito de roteamento interno**, e merece aparecer no alarme de erro em
/// vez de virar um 4xx que alguém trata como esperado.
export class WrongFiscalModelError extends InfrastructureError {
  constructor(context: string, expected: string, received: string | undefined) {
    super({
      internalMessage: `Renderer expects fiscal model ${expected} but the XML declares ${received ?? 'none'}`,
      externalMessage:
        'Falha ao gerar o documento auxiliar: o documento não é do tipo esperado por este formato.',
      context,
    });
  }
}
