/** Converte lista de diferenciais em texto para textarea (um item por linha). */
export function highlightsToText(highlights: readonly string[] | undefined): string {
  return (highlights ?? []).join('\n');
}

/** Parseia textarea de diferenciais — uma linha por item, ignora vazias. */
export function textToHighlights(text: string): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(trimmed);
  }
  return items;
}

type HighlightLineBreakResult = {
  text: string;
  cursor: number;
  preventDefault: boolean;
};

/**
 * Enter ou vírgula/ponto-e-vírgula com texto na linha atual → nova linha abaixo.
 * Enter em linha vazia é ignorado (evita linhas em branco extras).
 */
export function applyHighlightLineBreak(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  key: 'Enter' | ',' | ';',
): HighlightLineBreakResult | null {
  const before = text.slice(0, selectionStart);
  const after = text.slice(selectionEnd);
  const lineStart = before.lastIndexOf('\n') + 1;
  const currentLine = before.slice(lineStart);
  const trimmedLine = currentLine.trim();

  if (!trimmedLine) {
    return { text, cursor: selectionStart, preventDefault: true };
  }

  const linePrefix = before.slice(0, lineStart);
  const newText = `${linePrefix}${trimmedLine}\n${after.trimStart()}`;
  const cursor = linePrefix.length + trimmedLine.length + 1;

  return { text: newText, cursor, preventDefault: true };
}
