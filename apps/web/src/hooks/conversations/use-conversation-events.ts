"use client";

/* BORDA (FebraHub) — mesma interface do hook original (`{ connected }`,
   fallback de polling por conta do chamador), mas assinando o SSE do
   FebraHub: GET /api/whatsapp/eventos com eventos
   `{ tipo: 'mensagem' | 'conversa' | 'ping', conversaId }`.

   O stream do FebraHub não carrega o DTO da mensagem, então em vez de
   upsert direto no cache (como a origem fazia), invalidamos as MESMAS
   queries que o hook original mantinha em dia: lista de conversas, thread
   da conversa do evento e contador de não lidas. Reconexão com backoff
   exponencial até 30s, idêntica à origem. */

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { conversationMessagesKey } from "@/hooks/conversations/use-conversation-messages";
import { conversationsListPrefix } from "@/hooks/conversations/use-conversations";
import { conversationsUnreadCountQueryKey } from "@/hooks/conversations/use-conversations-unread-count";

const EVENTS_URL = "/api/whatsapp/eventos";
const MAX_RETRY_DELAY_MS = 30_000;

type EventoWa = { tipo?: string; conversaId?: string };

export function useConversationEvents(): { connected: boolean } {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || !("EventSource" in window)) return;
    let source: EventSource | null = null;
    let retryTimer: number | null = null;
    let disposed = false;

    const invalidateAll = (conversaId?: string) => {
      void queryClient.invalidateQueries({ queryKey: conversationsListPrefix });
      void queryClient.invalidateQueries({
        queryKey: conversationsUnreadCountQueryKey,
      });
      if (conversaId) {
        void queryClient.invalidateQueries({
          queryKey: conversationMessagesKey(conversaId),
        });
      }
    };

    const connect = () => {
      if (disposed) return;
      source = new EventSource(EVENTS_URL, { withCredentials: true });

      source.onopen = () => {
        const isReconnect = retryCountRef.current > 0;
        retryCountRef.current = 0;
        setConnected(true);
        if (isReconnect) {
          // Recupera qualquer evento perdido enquanto o stream esteve caído.
          invalidateAll();
          void queryClient.invalidateQueries({
            queryKey: ["conversations", "messages"],
          });
        }
      };

      source.onmessage = (raw) => {
        if (!raw.data) return;
        try {
          const evento = JSON.parse(raw.data as string) as EventoWa;
          if (evento.tipo === "ping") return;
          invalidateAll(evento.conversaId);
        } catch (error) {
          console.error("[conversas][sse] evento inválido", error);
        }
      };

      source.onerror = () => {
        setConnected(false);
        source?.close();
        source = null;
        if (disposed) return;
        const delay = Math.min(
          MAX_RETRY_DELAY_MS,
          1000 * 2 ** retryCountRef.current,
        );
        retryCountRef.current += 1;
        retryTimer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      source?.close();
      if (retryTimer !== null) window.clearTimeout(retryTimer);
    };
  }, [queryClient]);

  return { connected };
}
