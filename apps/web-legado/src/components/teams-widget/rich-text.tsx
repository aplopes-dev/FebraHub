import { Fragment, type ReactNode } from "react";

/**
 * Renderiza o texto das mensagens do chat interpretando um markdown mínimo e
 * SEGURO (sem HTML bruto — nada de dangerouslySetInnerHTML): **negrito**,
 * *itálico* / _itálico_, `código` e URLs viram hiperlink. As quebras de linha
 * são preservadas pelo container (whiteSpace: pre-wrap), então trechos de
 * texto puro mantêm os "\n".
 *
 * Link do PRÓPRIO sistema abre na MESMA aba; link externo abre em NOVA aba
 * (com rel="noopener noreferrer"). O casamento de URL e de negrito vem ANTES do
 * itálico para não confundir `**x**` / `http://…` com itálico.
 */
const INLINE_PATTERN =
  /(https?:\/\/[^\s<>()]+|\*\*[^\n]+?\*\*|__[^\n]+?__|`[^`\n]+?`|\*(?!\s)[^*\n]+?\*|_(?!\s)[^_\n]+?_)/g;

/** URL do próprio sistema (mesma origem) → mesma aba; caso contrário → nova aba. */
function isInternalUrl(href: string): boolean {
  try {
    const parsed = new URL(href);
    if (typeof window !== "undefined") {
      return parsed.host === window.location.host;
    }
    return false;
  } catch {
    return false;
  }
}

function renderLink(rawUrl: string, key: number, fromUser: boolean): ReactNode[] {
  // Pontuação final costuma ser da frase, não da URL ("veja aqui: http://x." → o
  // ponto fica fora do link). Também não engole um ")" solto de "(veja http://x)".
  const trailingMatch = rawUrl.match(/[.,;:!?)]+$/);
  const trailing = trailingMatch ? trailingMatch[0] : "";
  const href = trailing ? rawUrl.slice(0, rawUrl.length - trailing.length) : rawUrl;
  const internal = isInternalUrl(href);

  const link = (
    <a
      key={`a${key}`}
      href={href}
      target={internal ? "_self" : "_blank"}
      rel={internal ? undefined : "noopener noreferrer"}
      // No balão do usuário (fundo primary/azul) o azul do link some — usa branco.
      // No balão do agente (fundo claro) mantém o azul (primary), legível.
      style={{
        wordBreak: "break-all",
        textDecoration: "underline",
        textUnderlineOffset: 2,
        color: fromUser ? "var(--mui-palette-primary-contrastText)" : "var(--mui-palette-primary-main)",
      }}
    >
      {href}
    </a>
  );
  return trailing ? [link, <Fragment key={`t${key}`}>{trailing}</Fragment>] : [link];
}

function renderInline(text: string, fromUser: boolean): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    const token = match[0];
    if (token.startsWith("http://") || token.startsWith("https://")) {
      nodes.push(...renderLink(token, key++, fromUser));
    } else if (token.startsWith("**") || token.startsWith("__")) {
      nodes.push(<strong key={key++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={key++}
          style={{
            borderRadius: 4,
            padding: "1px 4px",
            fontSize: "0.9em",
            backgroundColor: "color-mix(in srgb, currentColor 10%, transparent)",
          }}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    lastIndex = INLINE_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}

export function RichText({ content, fromUser = false }: { content: string; fromUser?: boolean }) {
  return <>{renderInline(content, fromUser)}</>;
}
