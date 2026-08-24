import type {
  MatchSuggestionResult,
  ScoredMatchCandidate,
} from '../../../../domain/services/match-suggester';

export class MatchSuggestionPresenter {
  static toHttp(result: MatchSuggestionResult) {
    return {
      kind: result.kind,
      candidates: result.candidates.map((candidate: ScoredMatchCandidate) => ({
        financialEntryId: candidate.financialEntryId,
        openBalanceCents: candidate.openBalanceCents,
        dueDate: candidate.dueDate.toISOString().slice(0, 10),
        description: candidate.description,
        confidence: Math.round(candidate.confidence * 100) / 100,
      })),
    };
  }
}
