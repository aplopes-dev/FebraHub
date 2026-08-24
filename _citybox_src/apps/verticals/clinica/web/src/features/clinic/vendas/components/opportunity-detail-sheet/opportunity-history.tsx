"use client";

import { Bot, MessageSquare, User, ChevronDown } from "lucide-react";

import { Button } from "@citybox/ui/atoms";
import { Popover, PopoverContent, PopoverTrigger } from "@citybox/ui/atoms";

import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDescription,
  TimelineDot,
  TimelineHeader,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "../_timeline";
import type {
  HistoryChangedField,
  HistoryItem,
  HistoryActionType,
} from "../../types";

interface OpportunityHistoryProps {
  items: HistoryItem[];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "agora mesmo";
  if (diffMinutes < 60)
    return `há ${diffMinutes} minuto${diffMinutes > 1 ? "s" : ""}`;
  if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
  if (diffDays === 1) return "há 1 dia";
  if (diffDays < 30) return `há ${diffDays} dias`;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

const FIELD_NAMES: Record<string, string> = {
  title: "título",
  description: "descrição",
  phone: "telefone",
  origin: "origem",
  nextContact: "próximo contato",
  patientId: "paciente",
  stageId: "etapa",
};

function getActionText(
  type: HistoryActionType,
  metadata?: HistoryItem["metadata"],
): string {
  switch (type) {
    case "created":
      return "Criou esta oportunidade";
    case "moved":
      return `Moveu de "${metadata?.fromColumn}" para "${metadata?.toColumn}"`;
    case "comment":
      return "Comentou";
    case "label_changed": {
      const fromLabel = metadata?.fromLabel || "(sem rótulo)";
      const toLabel = metadata?.toLabel || "(sem rótulo)";
      return `Alterou o rótulo de "${fromLabel}" para "${toLabel}"`;
    }
    case "contact_scheduled":
      return "Agendou um contato";
    case "updated": {
      const changedFields = metadata?.changedFields;
      if (changedFields && changedFields.length > 0) {
        const fieldsChanged = changedFields
          .map((cf) => FIELD_NAMES[cf.field] || cf.field)
          .join(", ");
        return `Alterou ${fieldsChanged}`;
      }
      return "Editou a oportunidade";
    }
    default:
      return "Realizou uma ação";
  }
}

function formatFieldValue(value: unknown, field: string): string {
  if (value === null || value === undefined || value === "") return "(vazio)";

  if (field === "nextContact" && value) {
    const date =
      value instanceof Date ? value : new Date(value as string | number);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    }
  }

  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const ORIGIN_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  whatsapp: "WhatsApp",
  site: "Site",
  campaign: "Campanha",
  budget: "Orçamento",
  indicacao: "Indicação",
  retorno: "Retorno",
  outro: "Outro",
};

const CHANGE_FIELD_LABELS: Record<string, string> = {
  title: "Título",
  description: "Descrição",
  phone: "Telefone",
  origin: "Origem",
  nextContact: "Próximo contato",
  patientId: "Paciente",
  stageId: "Etapa",
};

function ChangesPopover({ metadata }: { metadata?: HistoryItem["metadata"] }) {
  const changedFields = metadata?.changedFields;
  if (!changedFields || changedFields.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 max-w-40 justify-start text-muted-foreground hover:text-foreground"
        >
          Ver mudanças
          <ChevronDown className="ml-1 size-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="mb-3 text-sm font-medium">
              Detalhes das alterações
            </h4>
            <div className="space-y-3">
              {changedFields.map((change: HistoryChangedField, index) => {
                const fieldName = CHANGE_FIELD_LABELS[change.field] || change.field;
                let oldValue = formatFieldValue(change.oldValue, change.field);
                let newValue = formatFieldValue(change.newValue, change.field);

                if (change.field === "origin") {
                  const oldKey = change.oldValue as string;
                  const newKey = change.newValue as string;
                  if (oldKey && ORIGIN_LABELS[oldKey]) oldValue = ORIGIN_LABELS[oldKey];
                  if (newKey && ORIGIN_LABELS[newKey]) newValue = ORIGIN_LABELS[newKey];
                }

                return (
                  <div key={index} className="space-y-1">
                    <p className="text-sm font-medium">{fieldName}</p>
                    <div className="space-y-1 border-l-2 border-muted pl-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Antes:</p>
                        <p className="break-words text-sm">{oldValue}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Depois:</p>
                        <p className="break-words text-sm">{newValue}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function getHistoryIcon(item: HistoryItem) {
  if (item.type === "comment") return MessageSquare;
  if (item.isSystemAction) return Bot;
  return User;
}

export function OpportunityHistory({ items }: OpportunityHistoryProps) {
  const sortedItems = [...items].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  if (sortedItems.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Nenhum histórico disponível
      </p>
    );
  }

  return (
    <Timeline className="[--timeline-dot-size:2rem]">
      {sortedItems.map((item) => {
        const Icon = getHistoryIcon(item);
        const isComment = item.type === "comment";

        return (
          <TimelineItem key={item.id}>
            <TimelineDot className="self-start bg-muted">
              <Icon className="size-4 shrink-0" />
            </TimelineDot>
            <TimelineConnector />
            <TimelineContent>
              <TimelineHeader>
                <TimelineTime dateTime={item.createdAt.toISOString()}>
                  {formatRelativeTime(item.createdAt)}
                </TimelineTime>
                <TimelineTitle className="text-sm">
                  {item.isSystemAction && item.systemName
                    ? item.systemName
                    : item.user?.name || "Sistema"}
                </TimelineTitle>
              </TimelineHeader>
              <TimelineDescription>
                <div className="flex flex-col gap-1">
                  <span>{getActionText(item.type, item.metadata)}</span>
                  {item.type === "updated" && item.metadata?.changedFields && (
                    <ChangesPopover metadata={item.metadata} />
                  )}
                </div>
              </TimelineDescription>

              {isComment && item.content && (
                <div className="mt-2 rounded-md bg-muted p-3">
                  <p className="whitespace-pre-wrap text-sm">{item.content}</p>
                </div>
              )}
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
