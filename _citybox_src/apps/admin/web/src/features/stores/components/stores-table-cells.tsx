"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { Badge } from "@citybox/ui/atoms";
import { VerticalBadge } from "@citybox/ui/molecules";
import { cn } from "@citybox/ui";
import type { Loja } from "../types";
import { lojaStatusConfig } from "../lib/store-status-config";

// ─── Célula: Loja ─────────────────────────────────────────────────────────────

export function LojaCell({ loja, href }: { loja: Loja; href?: string }) {
  const nameElement = href ? (
    <Link
      href={href}
      className="font-medium text-sm leading-snug truncate text-primary hover:underline"
    >
      {loja.tradeName}
    </Link>
  ) : (
    <span className="font-medium text-sm leading-snug truncate">{loja.tradeName}</span>
  );

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted",
          loja.status === "BLOCKED" && "opacity-60 grayscale",
        )}
      >
        <Store className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        {nameElement}
        <span className="text-xs text-muted-foreground font-mono">{loja.slug}</span>
      </div>
    </div>
  );
}

// ─── Célula: Vertical ─────────────────────────────────────────────────────────

export function VerticalCell({ vertical }: { vertical: Loja["vertical"] }) {
  return <VerticalBadge vertical={vertical} />;
}

// ─── Célula: Cliente (Grupo) ──────────────────────────────────────────────────

export function ClientGroupCell({ clientName }: { clientName: string }) {
  // A rota /clientes foi removida (PLAT-001/T031) e o `Client` deixou de existir na Fase
  // 10 — este valor é o nome da própria loja e nunca vira link.
  return <span className="text-sm text-muted-foreground">{clientName}</span>;
}

// ─── Célula: Status da Loja ───────────────────────────────────────────────────

export function LojaStatusCell({ status }: { status: Loja["status"] }) {
  const { label, className } = lojaStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("w-fit text-xs font-medium", className)}>
      {label}
    </Badge>
  );
}

// ─── Célula: Criada em ────────────────────────────────────────────────────────

export function CreatedAtCell({ dateIso }: { dateIso: string }) {
  const [year, month, day] = dateIso.split("-");
  const formatted = `${day}/${month}/${year}`;
  return <span className="text-sm tabular-nums">{formatted}</span>;
}
