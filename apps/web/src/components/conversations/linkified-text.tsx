"use client";

import { Fragment, type ReactNode } from "react";
import { Link as MuiLink } from "@mui/material";

/** http(s) e www. — pontuação final comum fica fora do href. */
const URL_RE = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

function trimTrailingPunctuation(raw: string): {
  hrefPart: string;
  trailing: string;
} {
  const match = raw.match(/^(.*?)([.,;:!?)]*)$/);
  if (!match) return { hrefPart: raw, trailing: "" };
  return { hrefPart: match[1] ?? raw, trailing: match[2] ?? "" };
}

function normalizeHref(raw: string): string {
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return raw;
}

function isInternalHref(href: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

type LinkifiedTextProps = {
  text: string;
  linkColor?: string;
};

/**
 * Renderiza URLs do texto como hiperlinks.
 * Mesma origem → mesma aba; externo → nova aba.
 */
export default function LinkifiedText({ text, linkColor }: LinkifiedTextProps) {
  if (!text) return null;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(URL_RE.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    const raw = match[0] ?? "";
    const { hrefPart, trailing } = trimTrailingPunctuation(raw);
    const href = normalizeHref(hrefPart);
    const internal = isInternalHref(href);

    nodes.push(
      <MuiLink
        key={`${start}-${hrefPart}`}
        href={href}
        target={internal ? undefined : "_blank"}
        rel={internal ? undefined : "noopener noreferrer"}
        underline="hover"
        sx={{
          color: linkColor ?? "inherit",
          fontWeight: 500,
          wordBreak: "break-all",
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        {hrefPart}
      </MuiLink>,
    );
    if (trailing) nodes.push(trailing);
    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return (
    <Fragment>
      {nodes.map((node, index) => (
        <Fragment key={index}>{node}</Fragment>
      ))}
    </Fragment>
  );
}
