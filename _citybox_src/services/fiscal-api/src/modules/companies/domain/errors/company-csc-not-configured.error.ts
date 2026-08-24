import { DomainError } from '../../../../shared/core/errors/domain.error';

/// CSC (Código de Segurança do Contribuinte) ausente ou em branco.
///
/// **Por que é recusa e não valor padrão**: sem CSC o hash do QR Code sairia
/// calculado sobre string vazia. O resultado é um QR Code *sintaticamente
/// perfeito* e semanticamente lixo — a SEFAZ autoriza o cupom, o PDF imprime, e
/// a falha só aparece quando o consumidor aponta o celular e a consulta não
/// acha nada. Recusar na emissão é a única forma de essa falha ser visível
/// enquanto ainda dá para corrigir.
///
/// Mapeia para **424** por conter `NotConfigured` no nome (ver
/// `app-exception.filter.ts`): não é dado inválido do pedido — é dependência de
/// cadastro que falta, e o passo de correção é administrativo (obter o CSC
/// junto à SEFAZ), não editar o payload.
///
/// ⚠️ Nem a mensagem interna nem a externa carregam o token, nem parte dele. O
/// CSC é segredo compartilhado com o órgão, e esta mensagem vai para log e para
/// o cliente.
export class CompanyCscNotConfiguredError extends DomainError {
  constructor(context: string, companyId?: string) {
    super({
      internalMessage: companyId
        ? `Company "${companyId}" has no CSC configured`
        : 'CSC is missing or blank',
      externalMessage:
        'Emitente sem CSC cadastrado. Obtenha o Código de Segurança do Contribuinte junto à SEFAZ e cadastre-o antes de emitir cupom fiscal.',
      externalCode: 'CSC_NOT_CONFIGURED',
      context,
    });
  }
}
