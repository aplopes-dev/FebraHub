"use client";
import { useEffect } from "react";

/**
 * Assina o stream SSE público dos pedidos da Loja e chama `onEvento` a cada
 * evento real (ignora o heartbeat `ping`). É complementar ao polling do
 * react-query: quando o SSE está vivo, a tela reage na hora; se cair, o
 * polling continua cobrindo. Reconecta sozinho (comportamento nativo do
 * EventSource).
 */
export function useLojaPedidosStream(onEvento: () => void, ativo = true) {
  useEffect(() => {
    if (!ativo || typeof window === "undefined" || typeof EventSource === "undefined") return;
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "/api").replace(/\/$/, "");
    let fonte: EventSource | null = null;
    try {
      fonte = new EventSource(`${base}/loja-pedidos/publico/eventos`, { withCredentials: true });
    } catch {
      return;
    }
    const aoReceber = (ev: MessageEvent) => {
      try {
        const dado = JSON.parse(ev.data) as { tipo?: string };
        if (dado?.tipo && dado.tipo !== "ping") onEvento();
      } catch {
        /* payload ilegível: ignora */
      }
    };
    fonte.onmessage = aoReceber;
    // O EventSource já tenta reconectar sozinho; um erro só é log.
    fonte.onerror = () => { /* fallback é o polling do react-query */ };
    return () => fonte?.close();
  }, [onEvento, ativo]);
}
