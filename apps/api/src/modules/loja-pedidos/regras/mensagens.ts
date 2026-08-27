/**
 * Regras PURAS de texto da Loja (sem I/O, sem Prisma). Extraídas do
 * LojaPedidosService para poderem ser testadas isoladamente e reutilizadas.
 * Nada aqui toca banco, rede ou relógio — só formata strings a partir dos
 * dados que recebe.
 */

/** Senha da fila formatada com no mínimo 2 dígitos (PRD §4,§13): 01,02…09,10…99,100. */
export const fmtSenha = (s: number | null | undefined): string =>
  s == null ? '—' : String(s).padStart(2, '0');

export type EventoRegua = 'confirmado' | 'proximo' | 'preparacao' | 'pronto';

/**
 * Régua de WhatsApp da Loja (PRD §38). A chamada operacional usa a SENHA da
 * fila (não o número do pedido). O número do pedido aparece como referência
 * secundária. `posicao` só entra na confirmação.
 */
export function mensagemRegua(
  evento: EventoRegua,
  senha: number | null,
  numeroPedido: number,
  posicao?: number | null,
): string {
  const S = fmtSenha(senha);
  const ref = `\n\n_Pedido #${numeroPedido}_`;
  switch (evento) {
    case 'confirmado':
      return `✅ Pagamento confirmado!\n\nSua senha é *${S}*.` +
        (posicao ? `\nPosição atual na fila: *${posicao}*.` : '') +
        `\n\nAvisaremos quando estiver chegando sua vez.` + ref;
    case 'proximo':
      return `🔔 VOCÊ É O PRÓXIMO!\n\nSenha *${S}*.\n\nDirija-se ao balcão da Loja FEBRACIS.` + ref;
    case 'preparacao':
      return `🛍️ Senha *${S}* em preparação.\n\nNossa equipe já está preparando seu pedido.` + ref;
    case 'pronto':
      return `🎉 PEDIDO PRONTO!\n\nSenha *${S}*.\n\nSeu pedido está disponível para retirada no balcão da Loja FEBRACIS.` + ref;
  }
}

/** Lembrete de pedido pronto não retirado (PRD §32). */
export const mensagemLembretePronto = (numeroPedido: number): string =>
  `⏰ Pedido #${numeroPedido} continua pronto para retirada no balcão da Loja FEBRACIS. Passe aqui quando puder!`;
