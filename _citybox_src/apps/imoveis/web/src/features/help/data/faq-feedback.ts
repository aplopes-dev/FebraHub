export type FaqFeedbackVote = 'up' | 'down';

export const FAQ_FEEDBACK_STORAGE_KEY = 'imoveis.help.faq-feedback';

export function parseFaqFeedbackMap(
  raw: string | null,
): Record<string, FaqFeedbackVote> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const next: Record<string, FaqFeedbackVote> = {};
    for (const [id, vote] of Object.entries(parsed)) {
      if (vote === 'up' || vote === 'down') next[id] = vote;
    }
    return next;
  } catch {
    return {};
  }
}

export function withFaqFeedbackVote(
  current: Record<string, FaqFeedbackVote>,
  id: string,
  vote: FaqFeedbackVote,
): Record<string, FaqFeedbackVote> {
  return { ...current, [id]: vote };
}
