/**
 * Regras de CÁLCULO puras da Loja (sem Prisma, sem I/O). Concentram a
 * aritmética de negócio que antes vivia solta dentro das transações do
 * service — agora testável e com uma única fonte de verdade. Trabalham com
 * `number` (reais) e arredondam a 2 casas; a conversão para Prisma.Decimal
 * continua no service.
 */

/** Arredonda para 2 casas (centavos), evitando ruído de ponto flutuante. */
export const round2 = (n: number): number => +n.toFixed(2);

/** Total de uma linha = preço unitário × quantidade, em centavos "limpos". */
export const totalLinha = (precoUnit: number, quantidade: number): number =>
  round2(precoUnit * quantidade);

/** Soma dos totais das linhas (subtotal do pedido). */
export const somarSubtotal = (linhas: { total: number }[]): number =>
  round2(linhas.reduce((s, l) => s + l.total, 0));

/** Desconto nunca ultrapassa o subtotal (não gera total negativo). */
export const descontoValido = (descontoSolicitado: number, subtotal: number): number =>
  Math.min(Math.max(0, descontoSolicitado), subtotal);

/** Total final = subtotal − desconto (desconto já saneado). */
export const totalComDesconto = (subtotal: number, desconto: number): number =>
  round2(subtotal - descontoValido(desconto, subtotal));

/**
 * Saldo DISPONÍVEL para venda = físico − reservado. Nunca negativo na leitura
 * pública (o cardápio mostra 0 em vez de número negativo).
 */
export const disponivel = (saldoFisico: number, reservado: number): number =>
  saldoFisico - reservado;

/** Verdadeiro quando a quantidade pedida excede o disponível. */
export const estoqueInsuficiente = (quantidade: number, disp: number): boolean =>
  quantidade > disp;

/**
 * Valida o SPLIT de pagamentos do PDV: a soma das formas precisa fechar com o
 * total da venda (tolerância de 1 centavo). Devolve o total pago (arredondado)
 * e se fecha — o service decide a exceção.
 */
export function conferirSplit(
  pagamentos: { valor: number }[],
  total: number,
): { pago: number; fecha: boolean } {
  const pago = round2(pagamentos.reduce((s, p) => s + p.valor, 0));
  return { pago, fecha: Math.abs(pago - total) <= 0.01 };
}

/** Faixa válida do código secreto de retirada (3 dígitos). */
export const CODIGO_MIN = 100;
export const CODIGO_MAX = 999;
export const CODIGO_CAPACIDADE = CODIGO_MAX - CODIGO_MIN + 1; // 900

/** Normaliza e valida o código digitado no balcão (aceita "042", "42 ", etc.). */
export function parseCodigoRetirada(bruto: string): number | null {
  const codigo = Number(String(bruto).replace(/\D/g, ''));
  if (!Number.isInteger(codigo) || codigo < CODIGO_MIN || codigo > CODIGO_MAX) return null;
  return codigo;
}

/**
 * Escolhe um código de retirada livre, dado o conjunto de ocupados. PURO: recebe
 * a fonte de aleatoriedade injetável (para teste determinístico). Sorteia com
 * retry e, se falhar, varre a faixa; devolve null se todos os 900 estão em uso.
 */
export function escolherCodigoRetirada(
  ocupados: Set<number>,
  rng: () => number = Math.random,
): number | null {
  if (ocupados.size >= CODIGO_CAPACIDADE) return null;
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    const c = CODIGO_MIN + Math.floor(rng() * CODIGO_CAPACIDADE);
    if (!ocupados.has(c)) return c;
  }
  for (let c = CODIGO_MIN; c <= CODIGO_MAX; c++) if (!ocupados.has(c)) return c;
  return null;
}

/** Média em minutos entre pares de datas válidos (ignora nulos e negativos).
 *  Arredonda a 1 casa (padrão dos tempos de preparação/espera do dashboard). */
export function mediaMinutos(pares: [Date | null, Date | null][]): number {
  const difs = pares
    .filter(([a, b]) => a && b)
    .map(([a, b]) => (b!.getTime() - a!.getTime()) / 60000)
    .filter((m) => m >= 0);
  return difs.length ? +(difs.reduce((s, m) => s + m, 0) / difs.length).toFixed(1) : 0;
}
