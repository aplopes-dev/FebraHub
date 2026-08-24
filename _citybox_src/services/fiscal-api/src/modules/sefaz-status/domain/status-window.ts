/// Regra da janela de contato com o órgão (FR-007, R3).
///
/// O intervalo mínimo existe porque o órgão trata consulta em excesso como uso
/// indevido e chega a **bloquear o CNPJ** — e um CNPJ bloqueado não emite. Por
/// isso **não há bypass** (FR-005a): nenhum parâmetro força um contato fora da
/// janela. A conciliação para quem diagnostica é transparência (idade do dado e
/// próxima verificação), não exceção.

const SECONDS = 1000;

/// Piso configurável (R3). Default 180s (3 min), conservador em relação ao
/// limite praticado pelos órgãos. Lido a cada chamada — a env pode ser definida
/// depois do import, mesmo padrão de `sefaz-ba-config.ts`.
///
/// 🚩 **Verificação pendente (não bloqueante, spec fiscal/001 R3):** confirmar o
/// piso real de consulta de status no manual vigente de cada órgão. Se o real
/// for maior que 180s, ajustar `SEFAZ_STATUS_MIN_INTERVAL_SECONDS` — exceder o
/// limite pode bloquear temporariamente o CNPJ (SC-004). Como é env com default
/// conservador, um valor diferente é ajuste de configuração, não de código.
export function minIntervalSeconds(): number {
  const raw = process.env.SEFAZ_STATUS_MIN_INTERVAL_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 180;
}

/// A última verificação ainda está dentro da janela? Se sim, serve do cache.
///
/// Comparação `<` (não `<=`): no instante exato do limite a janela venceu e um
/// novo contato é permitido — mais seguro servir dado levemente mais fresco que
/// mais velho, e evita um teste de igualdade de milissegundos frágil.
export function isFresh(
  lastCheckedAt: Date,
  now: Date,
  minIntervalSec = minIntervalSeconds(),
): boolean {
  return ageSeconds(lastCheckedAt, now) < minIntervalSec;
}

/// Idade do dado em segundos inteiros (FR-005). Nunca negativo — relógios podem
/// divergir levemente entre instâncias, e idade negativa não faz sentido para
/// quem lê.
export function ageSeconds(checkedAt: Date, now: Date): number {
  const diff = Math.floor((now.getTime() - checkedAt.getTime()) / SECONDS);
  return Math.max(0, diff);
}

/// Quando haverá nova verificação (FR-005): fim da janela atual.
export function nextCheckAt(
  checkedAt: Date,
  minIntervalSec = minIntervalSeconds(),
): Date {
  return new Date(checkedAt.getTime() + minIntervalSec * SECONDS);
}
