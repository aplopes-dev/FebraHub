import { randomBytes } from 'node:crypto';
import * as QRCode from 'qrcode';

/**
 * Regras de RETIRADA e QR da Loja, isoladas do service.
 *  - Geração do token opaco (pura, exceto pela fonte de aleatoriedade).
 *  - Renderização do QR (I/O leve via lib `qrcode`, encapsulada aqui).
 *  - Veredito de retirada (PURO): decide, a partir do status/flags do pedido,
 *    se pode retirar e qual a mensagem de bloqueio. Testável sem DB.
 */

/** Token opaco do QR de retirada: 32 bytes aleatórios em base64url (~43 chars,
 *  256 bits de entropia — não adivinhável). Impresso no comprovante do cliente
 *  e escaneado pelo vendedor no balcão para resgatar a retirada. */
export const gerarTokenRetirada = (): string => randomBytes(32).toString('base64url');

/** Renderiza uma URL como QR em PNG (dataURL) e SVG, em paralelo. */
export async function renderizarQr(
  conteudo: string,
  opcoes: { width?: number; margin?: number } = {},
): Promise<{ pngDataUrl: string; svg: string }> {
  const cfg = { errorCorrectionLevel: 'M' as const, margin: opcoes.margin ?? 2, width: opcoes.width ?? 512 };
  const [pngDataUrl, svg] = await Promise.all([
    QRCode.toDataURL(conteudo, cfg),
    QRCode.toString(conteudo, { ...cfg, type: 'svg' }),
  ]);
  return { pngDataUrl, svg };
}

/** Deep-link da tela de retirada do vendedor a partir da base pública. Sem base,
 *  cai no próprio token (a UI ainda consegue colar/consultar). */
export const urlRetirada = (base: string, token: string): string =>
  base ? `${base.replace(/\/$/, '')}/loja/retirada/${token}` : token;

export interface EstadoPedidoRetirada {
  status: string;
  confirmadoEm: Date | null;
  retiradoPorNome?: string | null;
  retiradoEm?: Date | null;
}

export interface VeredictoRetirada {
  pago: boolean;
  retirado: boolean;
  cancelado: boolean;
  podeRetirar: boolean;
  /** Motivo legível quando NÃO pode retirar; null quando pode. */
  bloqueio: string | null;
}

/**
 * Decide o veredito de retirada a partir do estado do pedido — PURO.
 * `podeRetirar` é true só quando pago, não cancelado e ainda não retirado.
 */
export function avaliarRetirada(p: EstadoPedidoRetirada): VeredictoRetirada {
  const cancelado = p.status === 'CANCELADO';
  const retirado = p.status === 'RETIRADO';
  const pago = !!p.confirmadoEm && p.status !== 'AGUARDANDO_PAGAMENTO' && !cancelado;
  const podeRetirar = pago && !retirado && !cancelado;

  let bloqueio: string | null = null;
  if (!podeRetirar) {
    if (cancelado) bloqueio = 'Pedido cancelado.';
    else if (!pago) bloqueio = 'Pagamento ainda não confirmado.';
    else if (retirado) {
      const quem = p.retiradoPorNome ? ` por ${p.retiradoPorNome}` : '';
      const quando = p.retiradoEm ? ` em ${new Date(p.retiradoEm).toLocaleString('pt-BR')}` : '';
      bloqueio = `Já retirado${quem}${quando}.`;
    }
  }
  return { pago, retirado, cancelado, podeRetirar, bloqueio };
}
