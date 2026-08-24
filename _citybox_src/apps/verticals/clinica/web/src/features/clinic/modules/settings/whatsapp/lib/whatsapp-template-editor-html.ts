import {
  findWhatsappVariableByKey,
  WHATSAPP_VARIABLE_CATALOG,
} from '../data/whatsapp-variable-catalog';

const TOKEN_PATTERN = /\{([a-z_]+)\}/g;

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function variableChipHtml(token: string, label: string): string {
  return `<span data-variable="${escapeHtml(token)}" data-label="${escapeHtml(label)}">${escapeHtml(label)}</span>`;
}

/**
 * Converte o body plain da API (`{nome_paciente}`) em HTML do RichTextEditor
 * com chips de variável (rótulo sem chaves).
 */
export function whatsappBodyToEditorHtml(body: string): string {
  if (!body.trim()) {
    return '<p></p>';
  }

  const lines = body.split(/\r?\n/);
  const paragraphs = lines.map((line) => {
    if (line.length === 0) {
      return '<p></p>';
    }

    const withChips = line.replace(TOKEN_PATTERN, (match, key: string) => {
      const variable = findWhatsappVariableByKey(key);
      if (!variable) {
        return escapeHtml(match);
      }
      return variableChipHtml(variable.token, variable.label);
    });

    return `<p>${withChips}</p>`;
  });

  return paragraphs.join('');
}

/**
 * Serializa o HTML do editor de volta ao body plain da API (tokens `{var}`).
 */
export function editorHtmlToWhatsappBody(html: string): string {
  if (!html.trim()) {
    return '';
  }

  let working = html;

  for (const variable of WHATSAPP_VARIABLE_CATALOG) {
    const chipPattern = new RegExp(
      `<span[^>]*data-variable="${escapeRegExp(variable.token)}"[^>]*>[^<]*</span>`,
      'gi',
    );
    working = working.replace(chipPattern, variable.token);
  }

  // Chips desconhecidos / legado: usa o valor de data-variable se for `{token}`.
  working = working.replace(
    /<span[^>]*data-variable="(\{[^"]+\})"[^>]*>[^<]*<\/span>/gi,
    '$1',
  );

  working = working
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?p[^>]*>/gi, '')
    .replace(/<\/?div[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Remove tags residuais (negrito etc.) mantendo o texto.
  working = working.replace(/<[^>]+>/g, '');

  return working.replace(/\u00a0/g, ' ').trimEnd();
}
