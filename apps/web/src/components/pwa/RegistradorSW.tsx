"use client";
import { useEffect } from "react";

/** Registra o service worker (PWA) uma vez, no cliente. Silencioso: qualquer
 *  falha não afeta a aplicação. Escopo raiz (/) — o sw.js vive em /public. */
export function RegistradorSW() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Evita ruído em dev; em produção o SW dá o comportamento instalável/offline.
    if (process.env.NODE_ENV !== "production") return;
    const registrar = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    };
    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
  }, []);
  return null;
}
