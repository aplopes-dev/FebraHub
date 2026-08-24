function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filterQuestionsByText<T extends { text: string }>(
  questions: T[],
  query: string,
): T[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return questions;
  }

  return questions.filter((question) =>
    normalizeSearchText(question.text).includes(normalizedQuery),
  );
}
