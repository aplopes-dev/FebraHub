/**
 * Aleatoriedade determinística e relógio fixo do banco de demonstração.
 *
 * Duas regras que valem para todo o `mock-db`:
 *
 * 1. **Nada de `Math.random()`.** O Next renderiza a página no servidor e
 *    de novo no cliente; dois sorteios diferentes produzem HTML diferente e o
 *    React acusa erro de hidratação. O gerador abaixo é um LCG com semente
 *    fixa: mesma semente, mesma sequência, nos dois lados.
 * 2. **Nada de `new Date()` na geração.** O dataset é ancorado em
 *    `MOCK_NOW_ISO`; "hoje" para o comercial de demonstração é essa data.
 *    Mudar a âncora reposiciona o dataset inteiro no tempo, sem tocar em mais
 *    nada — as datas são todas derivadas dela.
 */

/** "Hoje" do banco de demonstração. Âncora única de todas as datas. */
export const MOCK_NOW_ISO = "2026-08-27T15:00:00.000Z";

export function mockNow(): Date {
  return new Date(MOCK_NOW_ISO);
}

/** ISO de `days` dias (e `hours` horas) a partir da âncora. Negativo = passado. */
export function isoFromNow(days: number, hours = 0): string {
  const base = mockNow().getTime();
  return new Date(base + days * 86_400_000 + hours * 3_600_000).toISOString();
}

/** Dias inteiros entre um ISO e a âncora (positivo = no passado). */
export function daysSince(iso: string): number {
  return Math.floor((mockNow().getTime() - new Date(iso).getTime()) / 86_400_000);
}

/** `true` se o ISO já venceu em relação à âncora. */
export function isOverdue(iso: string): boolean {
  return new Date(iso).getTime() < mockNow().getTime();
}

/**
 * Linear congruential generator (numerical Recipes). Suficiente para espalhar
 * dados de demonstração e barato o bastante para rodar no import.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  function next(): number {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  }

  return {
    /** Float em [0, 1). */
    next,
    /** Inteiro em [min, max]. */
    int(min: number, max: number): number {
      return min + Math.floor(next() * (max - min + 1));
    },
    /** Um item do array (nunca `undefined`: o array precisa ter itens). */
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(next() * items.length)] as T;
    },
    /** `true` com a probabilidade dada (0 a 1). */
    chance(probability: number): boolean {
      return next() < probability;
    },
    /** Cópia embaralhada (Fisher–Yates com o mesmo LCG). */
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
      }
      return copy;
    },
  };
}

export type Random = ReturnType<typeof createRandom>;

/** `id("opp", 7)` → `"opp-007"`. Ids legíveis ajudam a depurar a tela. */
export function seqId(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}
