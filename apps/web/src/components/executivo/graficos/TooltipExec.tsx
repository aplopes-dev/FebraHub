"use client";

import type { ReactNode } from "react";

export function TooltipExec({
  active,
  label,
  children,
}: {
  active?: boolean;
  label?: ReactNode;
  children?: ReactNode;
}) {
  if (!active || !children) return null;
  return (
    <div className="fh-exec-tip">
      {label != null && <div className="fh-exec-tip-label">{label}</div>}
      <div className="fh-exec-tip-corpo">{children}</div>
    </div>
  );
}

export function TipLinha({
  cor,
  nome,
  valor,
}: {
  cor: string;
  nome: string;
  valor: string;
}) {
  return (
    <div className="fh-exec-tip-linha">
      <span className="fh-exec-tip-dot" style={{ background: cor }} />
      <span className="fh-exec-tip-nome">{nome}</span>
      <b>{valor}</b>
    </div>
  );
}
