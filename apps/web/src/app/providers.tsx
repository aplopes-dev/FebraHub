"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CHAVE_SESSAO } from "@/hooks/auth";
import { useAplicarTema } from "@/hooks/tema";
import { CHAVE_DESLOGADO, EVENTO_LOGOUT } from "@/services/api/client";

/* QueryClient com as mesmas opções do protótipo: uma tentativa extra (as
   views pesadas estouram o timeout na primeira execução fria e passam na
   segunda), sem refetch ao focar a janela (o painel fica aberto na TV o dia
   inteiro) e 5 min de staleTime — dado de BI não muda a cada segundo. */
export function Providers({ children }: { children: ReactNode }) {
  /* Devolve o `data-tema` que a hidratação apaga do <html>. Fica aqui, e não
     no Shell, porque a raiz é a única coisa que existe em TODA página — o
     login também precisa abrir no tema salvo. Ver src/hooks/tema.ts. */
  useAplicarTema();

  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5 * 60 * 1000 },
    },
  }));

  /* Sessão expirada (401 que o refresh não salvou): o client dispara o
     evento, aqui o cache da sessão vira `null` e as views saem do cache.
     Zerar as views é o que impede o próximo login de ver, por um instante,
     o dado do usuário anterior. */
  useEffect(() => {
    const aoDeslogar = () => {
      qc.setQueryData(CHAVE_SESSAO, null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] === "view" });
    };
    // Logout em OUTRA aba chega pelo evento storage: esta aba limpa o cache
    // na hora, em vez de descobrir no próximo 401 (e de disparar um refresh
    // que, com a sessão revogada, contaria como reuso).
    const aoStorage = (e: StorageEvent) => {
      if (e.key === CHAVE_DESLOGADO) aoDeslogar();
    };
    window.addEventListener(EVENTO_LOGOUT, aoDeslogar);
    window.addEventListener("storage", aoStorage);
    return () => {
      window.removeEventListener(EVENTO_LOGOUT, aoDeslogar);
      window.removeEventListener("storage", aoStorage);
    };
  }, [qc]);

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
