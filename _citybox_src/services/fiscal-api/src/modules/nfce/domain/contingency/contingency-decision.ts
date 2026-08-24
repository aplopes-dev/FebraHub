/// Desfecho da tentativa de transmissão, do ponto de vista de quem decide se
/// cabe contingência.
export type TransmissionOutcome =
  | { kind: 'ANSWERED'; status: 'AUTHORIZED' | 'REJECTED' }
  /// Enviamos e **não sabemos** se chegou: timeout depois do envio, resposta
  /// ilegível, `cStat` que não sabemos interpretar.
  | { kind: 'UNKNOWN' }
  /// O envio **não aconteceu**: falha de transporte antes de a requisição
  /// partir, ou recusa de conexão. A SEFAZ não viu nada.
  | { kind: 'UNREACHABLE' };

export type ContingencyDecision =
  /// Emitir em contingência offline (`tpEmis=9`) e enfileirar.
  | { action: 'CONTINGENCY' }
  /// Aceitar o desfecho como final — autorizado ou rejeitado.
  | { action: 'ACCEPT' }
  /// Marcar para consulta posterior. **Não** emitir nada novo.
  | { action: 'CONSULT'; reason: string };

/// FR-010 — decide se a falha de transmissão vira contingência.
///
/// ⚠️ **A distinção que este módulo existe para proteger.**
///
/// Contingência não é "tentar de novo diferente": o cupom de contingência tem
/// `tpEmis=9`, e o tipo de emissão ocupa o **dígito 35 da chave de acesso**.
/// Ou seja, emitir em contingência produz um documento fiscal **diferente**,
/// com chave diferente, para a mesma venda.
///
/// Daí a regra:
///
/// - **Rejeitado** é resposta do órgão. A venda não tem documento válido, e o
///   caminho é corrigir e reemitir — nunca contingência. Transformar rejeição
///   em contingência entregaria ao consumidor um papel que a SEFAZ já recusou.
///
/// - **Autorizado** é desfecho final. Óbvio, mas explícito aqui para o `Record`
///   ficar total.
///
/// - **Não alcançável** é o único caso de contingência. A SEFAZ não viu nada,
///   então não existe documento do lado dela, e emitir com chave nova é
///   seguro.
///
/// - **Desconhecido** é o caso perigoso, e por isso NÃO vira contingência.
///   Se a requisição chegou e foi autorizada, emitir uma segunda via em
///   contingência criaria **dois documentos fiscais para uma venda** — os dois
///   válidos, um deles impossível de justificar numa fiscalização. O caminho é
///   consultar a SEFAZ pela chave e só então decidir. É mais lento, e é o
///   único correto.
///
/// A tentação aqui é tratar `UNKNOWN` como `UNREACHABLE` — "a SEFAZ está fora
/// de qualquer jeito, e o caixa precisa vender". O custo aparece semanas
/// depois, na conciliação, quando dois cupons com chaves diferentes descrevem a
/// mesma venda e ninguém sabe qual cancelar.
export function decideContingency(
  outcome: TransmissionOutcome,
): ContingencyDecision {
  switch (outcome.kind) {
    case 'ANSWERED':
      return { action: 'ACCEPT' };

    case 'UNREACHABLE':
      return { action: 'CONTINGENCY' };

    case 'UNKNOWN':
      return {
        action: 'CONSULT',
        reason:
          'A transmissão pode ter chegado à SEFAZ. Consulte a chave de acesso antes de reemitir — emitir em contingência aqui criaria um segundo documento fiscal para a mesma venda.',
      };
  }
}
