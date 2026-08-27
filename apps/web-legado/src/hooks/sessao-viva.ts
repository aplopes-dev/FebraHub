"use client";

import { useEffect } from "react";
import { renovarSessaoProativa } from "@/services/api/client";

/* ============ RENOVAÇÃO PROATIVA DA SESSÃO ============
   Renova o acesso ANTES de expirar, em vez de esperar o primeiro 401. Roda
   só com a aba visível e reage ao `visibilitychange`: uma aba suspensa pelo
   browser atrasa timers sem dó — quem garante a renovação ao voltar é o
   evento, não o intervalo (por isso os dois juntos). A decisão de "está na
   hora?" e a trava entre abas vivem no client HTTP; aqui é só o relógio. */

export function useSessaoViva(): void {
  useEffect(() => {
    const manter = () => {
      if (document.visibilityState !== "visible") return;
      void renovarSessaoProativa();
    };
    manter();
    const intervalo = window.setInterval(manter, 60_000);
    document.addEventListener("visibilitychange", manter);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", manter);
    };
  }, []);
}
