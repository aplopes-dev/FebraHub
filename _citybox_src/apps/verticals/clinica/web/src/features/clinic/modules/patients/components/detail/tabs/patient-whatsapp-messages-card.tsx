"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Check, MessageSquare } from "lucide-react";
import { Button } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import {
  PREVIEW_PER_PAGE,
  usePatientWhatsappMessagesQuery,
} from "../../../hooks/use-patient-whatsapp-messages";
import type { PatientWhatsappMessage } from "../../../services/patient-whatsapp-messages.service";

const ABOUT_PANEL_CLASS = "rounded-2xl border border-border/60 bg-card p-5";

/** Dois checks sobrepostos no estilo WhatsApp (o segundo fica por cima, inteiro). */
function WhatsappDoubleCheck({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative inline-block h-3.5 w-[1.05rem] shrink-0", className)}
      aria-label="Enviada"
    >
      {/* Check de trás (parcialmente tapado) */}
      <Check
        className="absolute top-0 left-0 size-3.5"
        strokeWidth={2.75}
        aria-hidden
      />
      {/* Máscara na cor da bolha — “apaga” o trecho sobreposto do primeiro */}
      <Check
        className="absolute top-0 left-[5px] size-3.5 text-green-200"
        strokeWidth={5}
        aria-hidden
      />
      {/* Check da frente, inteiro */}
      <Check
        className="absolute top-0 left-[5px] size-3.5"
        strokeWidth={2.75}
        aria-hidden
      />
    </span>
  );
}

type PatientWhatsappMessagesCardProps = {
  patientId: string;
  className?: string;
};

function formatMessageDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pickLatestMessages(
  items: PatientWhatsappMessage[],
  limit: number,
): PatientWhatsappMessage[] {
  return [...items]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, limit);
}

function groupByDay(
  items: PatientWhatsappMessage[],
): Array<{ day: string; messages: PatientWhatsappMessage[] }> {
  const map = new Map<string, PatientWhatsappMessage[]>();
  const chronological = [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  for (const msg of chronological) {
    const day = formatMessageDay(msg.createdAt);
    const list = map.get(day) ?? [];
    list.push(msg);
    map.set(day, list);
  }
  return Array.from(map.entries()).map(([day, messages]) => ({
    day,
    messages,
  }));
}

export function PatientWhatsappMessagesCard({
  patientId,
  className,
}: PatientWhatsappMessagesCardProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [lockedHeightPx, setLockedHeightPx] = useState<number | null>(null);

  const { data, isLoading, isError, isFetching } =
    usePatientWhatsappMessagesQuery(patientId, { expanded });

  const total = data?.meta.total ?? 0;
  const hasMore = total > PREVIEW_PER_PAGE;
  const visibleItems = expanded
    ? (data?.items ?? [])
    : pickLatestMessages(data?.items ?? [], PREVIEW_PER_PAGE);
  const groups = groupByDay(visibleItems);

  const handleExpand = () => {
    const height = sectionRef.current?.offsetHeight;
    if (height != null && height > 0) {
      setLockedHeightPx(height);
    }
    setExpanded(true);
  };

  // Mantém a vista nas mensagens recentes (fim da lista) ao expandir / carregar histórico.
  useLayoutEffect(() => {
    if (!expanded) return;
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [expanded, groups]);

  return (
    <section
      ref={sectionRef}
      style={
        lockedHeightPx != null ? { height: lockedHeightPx } : undefined
      }
      className={cn(
        ABOUT_PANEL_CLASS,
        "flex flex-col",
        expanded && "overflow-hidden",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground"
          aria-hidden
        >
          <MessageSquare className="size-4" />
        </div>
        <h3 className="text-base font-semibold text-foreground">Mensagens</h3>
      </div>

      <div
        className={cn(
          "mt-3 flex flex-col gap-2",
          expanded && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        {hasMore && !expanded ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-primary"
              onClick={handleExpand}
            >
              Mostrar mais
            </Button>
          </div>
        ) : null}

        <div
          ref={messagesRef}
          className={cn(
            "space-y-3",
            expanded && "min-h-0 flex-1 overflow-y-auto pr-1",
          )}
        >
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              Carregando mensagens…
            </p>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Não foi possível carregar as mensagens.
            </p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma mensagem recente.
            </p>
          ) : (
            <>
              {expanded && isFetching ? (
                <p className="text-center text-xs text-muted-foreground">
                  Carregando histórico…
                </p>
              ) : null}
              {groups.map((group) => (
                <div key={group.day} className="space-y-2">
                  <p className="text-center text-xs text-muted-foreground">
                    {group.day}
                  </p>
                  {group.messages.map((msg) => {
                    const isClinic = msg.direction === "outbound";
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          isClinic ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                            isClinic
                              ? "rounded-br-md bg-green-200 text-foreground"
                              : "rounded-bl-md bg-muted text-foreground",
                          )}
                        >
                          <p>{msg.body}</p>
                          <div
                            className={cn(
                              "mt-1 flex items-center justify-end gap-1 text-[10px]",
                              isClinic
                                ? "text-green-800/55"
                                : "text-muted-foreground",
                            )}
                          >
                            {isClinic && msg.status === "failed" ? (
                              <span>falha no envio</span>
                            ) : null}
                            <time dateTime={msg.createdAt}>
                              {formatMessageTime(msg.createdAt)}
                            </time>
                            {isClinic && msg.status !== "failed" ? (
                              <WhatsappDoubleCheck className="text-current" />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
