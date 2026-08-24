/**
 * Função pura — sem Prisma, sem NestJS (research.md D8). A elegibilidade
 * (mesma conta, sinal compatível, `status: 'pending'`, janela de data) já foi
 * aplicada pelo repositório antes de chegar aqui; esta função só classifica e
 * ordena os candidatos já elegíveis.
 */

/** ±N dias entre a data da transação e o vencimento do lançamento (Assumptions do spec). */
export const MATCH_DATE_WINDOW_DAYS = 3;

export type MatchCandidateInput = {
  financialEntryId: string;
  /** Saldo em aberto do lançamento (`amountCents - paidCents`) no momento da consulta. */
  openBalanceCents: number;
  dueDate: Date;
  description: string;
};

export type ScoredMatchCandidate = MatchCandidateInput & {
  /** 0–1, só para ordenação/exibição — nunca usado como condição de
   *  conciliar sozinho no backend (a ação do operador é sempre explícita). */
  confidence: number;
};

export type MatchSuggestionResult =
  | { kind: 'exact'; candidates: ScoredMatchCandidate[] }
  | { kind: 'value_divergence'; candidates: ScoredMatchCandidate[] }
  | { kind: 'none'; candidates: ScoredMatchCandidate[] };

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.abs(a.getTime() - b.getTime()) / MS_PER_DAY;
}

/** Similaridade Jaccard simples entre os conjuntos de palavras de dois textos. */
function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersectionSize = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersectionSize += 1;
  }
  const unionSize = wordsA.size + wordsB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function scoreCandidate(
  candidate: MatchCandidateInput,
  transactionPostedAt: Date,
  transactionMemo: string,
): ScoredMatchCandidate {
  const dateDiff = daysBetween(candidate.dueDate, transactionPostedAt);
  const dateScore = Math.max(0, 1 - dateDiff / MATCH_DATE_WINDOW_DAYS);
  const textScore = textSimilarity(candidate.description, transactionMemo);
  // Data pesa mais que texto — memo do banco raramente bate literalmente com
  // a descrição do lançamento, é só critério de desempate.
  const confidence = 0.8 * dateScore + 0.2 * textScore;
  return { ...candidate, confidence: Math.min(1, Math.max(0, confidence)) };
}

function sortByConfidenceDesc(
  candidates: ScoredMatchCandidate[],
): ScoredMatchCandidate[] {
  return [...candidates].sort((a, b) => b.confidence - a.confidence);
}

export function suggestMatches(
  transactionAmountCents: number,
  transactionPostedAt: Date,
  transactionMemo: string,
  candidates: readonly MatchCandidateInput[],
): MatchSuggestionResult {
  const scored = candidates.map((candidate) =>
    scoreCandidate(candidate, transactionPostedAt, transactionMemo),
  );

  const exact = scored.filter(
    (candidate) => candidate.openBalanceCents === transactionAmountCents,
  );
  if (exact.length > 0) {
    return { kind: 'exact', candidates: sortByConfidenceDesc(exact) };
  }

  const divergent = scored.filter(
    (candidate) => candidate.openBalanceCents !== transactionAmountCents,
  );
  if (divergent.length > 0) {
    return {
      kind: 'value_divergence',
      candidates: sortByConfidenceDesc(divergent),
    };
  }

  return { kind: 'none', candidates: [] };
}
