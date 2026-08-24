export type FaqAnswerBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: readonly string[] };

/**
 * Converte a resposta do FAQ (parágrafos + linhas `- `) em blocos de UI.
 * Não é um parser Markdown completo.
 */
export function parseFaqAnswer(answer: string): FaqAnswerBlock[] {
  const lines = answer.split('\n');
  const blocks: FaqAnswerBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  function flushParagraph() {
    const text = paragraph.join(' ').trim();
    paragraph = [];
    if (text) blocks.push({ type: 'paragraph', text });
  }

  function flushList() {
    if (list.length === 0) return;
    blocks.push({ type: 'list', items: list });
    list = [];
  }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushParagraph();
      continue;
    }
    if (line.startsWith('- ')) {
      flushParagraph();
      list = [...list, line.slice(2).trim()];
      continue;
    }
    flushList();
    paragraph = [...paragraph, line];
  }

  flushList();
  flushParagraph();
  return blocks;
}
