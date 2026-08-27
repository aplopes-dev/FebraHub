"use client";

import { C } from "@/lib/tema";

export interface DeltaProps {
  delta?: string | null;
  up?: boolean;
  sufixo?: string;
}

export function Delta({ delta, up, sufixo }: DeltaProps) {
  if (delta == null) return <span style={{ fontSize: 12, color: C.faint }}>—</span>;
  const cor = up ? C.up : C.down;
  return (
    <span style={{ fontSize: 12, fontWeight: 800, color: cor }}>
      {up ? "▲" : "▼"} {String(delta).replace(/[+-]/, "")} {sufixo}
    </span>
  );
}
