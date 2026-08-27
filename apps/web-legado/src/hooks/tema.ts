"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

/* ============ TEMA CLARO / ESCURO ============
   A escolha vive em duas camadas:

   1. `data-tema` no <html> — é o que o CSS lê. Quem aplica PRIMEIRO é o
      script bloqueante do layout.tsx, antes da primeira pintura. Sem ele o
      painel pisca escuro→claro a cada navegação.
   2. localStorage — só a memória entre sessões. Sem nada salvo, vale o
      `prefers-color-scheme` do sistema.

   PEGADINHA: o React APAGA o `data-tema` do <html> na hidratação. O atributo
   não existe no HTML do servidor (que não tem como saber o tema), então o
   commit de hidratação limpa o "extra" — `suppressHydrationWarning` cala o
   aviso, não impede a limpeza. Por isso `useAplicarTema` reescreve o atributo
   num LAYOUT effect na raiz: layout effect roda no fim do MESMO commit em que
   o React apagou, antes do browser pintar — o usuário não vê nada piscar.
   Depois da hidratação o atributo é estável (o toggle não sofre disso). */

export const CHAVE_TEMA = "febrahub:tema";

export type Tema = "claro" | "escuro";

/** A escolha salva; sem nada salvo, o que o sistema pede. Mesma decisão do
 *  script inline de layout.tsx — os dois PRECISAM concordar. */
function temaDesejado(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    if (salvo === "claro" || salvo === "escuro") return salvo;
  }
  catch { /* modo privado: cai no sistema */ }
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "escuro" : "claro";
}

/** O tema em vigor, direto do <html>. No servidor não existe DOM: cai no
 *  escuro, que é o tema histórico do painel. */
export function temaAplicado(): Tema {
  if (typeof document === "undefined") return "escuro";
  return document.documentElement.dataset.tema === "claro" ? "claro" : "escuro";
}

// useLayoutEffect não existe no servidor; o useEffect ali é só pra calar o
// aviso — no servidor nenhum dos dois roda de verdade.
const useEfeitoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Devolve o `data-tema` ao <html> depois que a hidratação o apagou. Vai UMA
 *  vez, na raiz da árvore (Providers), pra valer em toda página. */
export function useAplicarTema() {
  useEfeitoLayout(() => {
    const alvo = temaDesejado();
    if (document.documentElement.dataset.tema !== alvo) {
      document.documentElement.setAttribute("data-tema", alvo);
    }
  }, []);
}

export function useTema() {
  const [tema, setTema] = useState<Tema>("escuro");

  // Só depois da hidratação — antes disso o servidor e o cliente têm que
  // renderizar a mesma coisa. Roda depois do layout effect da raiz, então já
  // lê o atributo restaurado.
  useEffect(() => { setTema(temaAplicado()); }, []);

  const alternar = useCallback(() => {
    const novo: Tema = temaAplicado() === "escuro" ? "claro" : "escuro";
    document.documentElement.setAttribute("data-tema", novo);
    // Modo privado de alguns browsers estoura no setItem; a troca vale
    // mesmo assim, só não sobrevive ao refresh.
    try { localStorage.setItem(CHAVE_TEMA, novo); } catch { /* sem persistência */ }
    setTema(novo);
  }, []);

  return { tema, alternar };
}
