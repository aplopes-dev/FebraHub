"use client";

import type { KanbanCard } from "../../types";

/** Mapeamento de valores de origem para labels em português. */
const ORIGIN_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  whatsapp: "WhatsApp",
  site: "Site",
  indicacao: "Indicação",
  retorno: "Retorno",
  campaign: "Campanha",
  budget: "Orçamento",
  outro: "Outro",
};

/** Formata número de telefone (apenas dígitos) para exibição com máscara. */
function formatPhone(phone: string | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dateObj.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(dateObj);
}

interface SalesKanbanCardProps {
  card: KanbanCard;
  onClick?: (card: KanbanCard) => void;
  isDraggable?: boolean;
}

export function SalesKanbanCard({ card, onClick }: SalesKanbanCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(card);
  };

  return (
    <div
      className="relative rounded-md border bg-background shadow-sm"
      onClick={handleClick}
    >
      <div className="flex flex-col">
        <div className="flex min-h-[110px] flex-col p-3">
          {/* Header: Rótulo + Título */}
          <div className="mb-3 flex items-center gap-2">
            {card.label && (
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: card.label.color }}
                title={card.label.name}
              />
            )}
            <p className="text-sm font-medium leading-tight">{card.title}</p>
          </div>

          {card.patientName && (
            <p className="mt-1.5 text-xs text-foreground">{card.patientName}</p>
          )}

          {card.phone && (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPhone(card.phone)}
            </p>
          )}

          {card.origin && (
            <p className="mt-1 text-xs text-muted-foreground">
              Origem: {ORIGIN_LABELS[card.origin] ?? card.origin}
            </p>
          )}

          {card.lastInteraction && (
            <p className="mt-1 text-xs text-muted-foreground">
              Última interação: {formatDate(card.lastInteraction)}
            </p>
          )}
        </div>

        {card.nextContact && (
          <div className="border-t bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              📅 Próximo contato: {formatDate(card.nextContact)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
