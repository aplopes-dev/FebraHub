"use client";

/* BORDA (FebraHub) — mesmo contrato do hook original (payload TeamsEventPayload,
   `useTeamsEvents(onEvent, onFallbackPoll)`), assinando o SSE do FebraHub:
   GET /api/agentes/eventos com eventos `{ tipo: 'mensagem' | 'conversa' |
   'ping', conversaId }`. A tradução: 'mensagem' → message.created e
   'conversa' → task.updated — os consumidores copiados tratam qualquer
   evento não-connection como "recarrega tasks" e message.created também
   recarrega o histórico da conversa aberta. */

import { useEffect, useRef, useState } from "react";

const EVENTS_URL = "/api/agentes/eventos";
const POLL_INTERVAL_MS = 30_000;

export type TeamsEventPayload = {
  type:
    | "message.created"
    | "task.updated"
    | "inbox.unread"
    | "connection.updated"
    | "conversation.read"
    | "ping";
  conversationId?: string;
  taskId?: string;
};

type EventoAgentes = { tipo?: string; conversaId?: string };

function traduzir(evento: EventoAgentes): TeamsEventPayload | null {
  if (evento.tipo === "ping") return null;
  if (evento.tipo === "mensagem") {
    return { type: "message.created", conversationId: evento.conversaId };
  }
  return { type: "task.updated", conversationId: evento.conversaId };
}

/**
 * Canal primário de atualização é SSE; se a conexão cair, cai para polling
 * curto até o EventSource reconectar. Reconciliação "de verdade" é
 * responsabilidade do backend.
 */
export function useTeamsEvents(
  onEvent: (payload: TeamsEventPayload) => void,
  onFallbackPoll: () => void,
) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  const onFallbackPollRef = useRef(onFallbackPoll);
  useEffect(() => {
    onEventRef.current = onEvent;
    onFallbackPollRef.current = onFallbackPoll;
  });

  useEffect(() => {
    let pollTimer: number | undefined;

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = window.setInterval(() => onFallbackPollRef.current(), POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (pollTimer === undefined) return;
      window.clearInterval(pollTimer);
      pollTimer = undefined;
    };

    const source = new EventSource(EVENTS_URL, { withCredentials: true });
    source.onopen = () => {
      setConnected(true);
      stopPolling();
    };
    source.onmessage = (event) => {
      try {
        const payload = traduzir(JSON.parse(event.data as string) as EventoAgentes);
        // heartbeat do servidor: só mantém a conexão viva, não interessa aos consumidores
        if (!payload) return;
        onEventRef.current(payload);
      } catch {
        return;
      }
    };
    source.onerror = () => {
      setConnected(false);
      startPolling();
    };

    return () => {
      source.close();
      stopPolling();
    };
  }, []);

  return { connected };
}
