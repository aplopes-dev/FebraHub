"use client";

import { useCallback, useEffect, useState } from "react";

const CHAVE_RECOLHIDO = "febrahub:menu-recolhido";

/**
 * Estado do menu lateral, que tem DOIS comportamentos conforme a largura:
 *
 *   celular/tablet (< 1100px)  gaveta sobre o conteúdo, fechada por padrão
 *   desktop        (>= 1100px) coluna fixa, que pode ser recolhida a ícones
 *
 * São coisas diferentes e por isso são dois estados. Um só ("aberto") faria o
 * desktop nascer sem menu depois de alguém fechar a gaveta no celular — e o
 * contrário, a gaveta abrir sozinha ao girar o aparelho.
 *
 * O estado real mora em atributos no <html> (`data-menu`, `data-menu-recolhido`)
 * porque quem reage a ele é CSS: o backdrop, a transição, o travamento do
 * scroll e a largura da coluna. Passar isso por prop até cada um seria quatro
 * lugares para dessincronizar.
 */
export function useMenu() {
  const [aberto, setAberto] = useState(false);
  // Recolhido no desktop é preferência da pessoa e sobrevive ao F5.
  const [recolhido, setRecolhido] = useState(false);

  const fechar = useCallback(() => setAberto(false), []);
  const alternar = useCallback(() => setAberto((v) => !v), []);
  const alternarRecolhido = useCallback(() => {
    setRecolhido((v) => {
      const novo = !v;
      try {
        localStorage.setItem(CHAVE_RECOLHIDO, novo ? "1" : "0");
      } catch {
        // Modo privativo do Safari recusa escrita: a preferência dura a sessão.
      }
      return novo;
    });
  }, []);

  // Lê a preferência só depois de montar. Ler durante o render faria o HTML do
  // servidor (que não conhece o localStorage) divergir do cliente.
  useEffect(() => {
    try {
      setRecolhido(localStorage.getItem(CHAVE_RECOLHIDO) === "1");
    } catch {
      /* sem localStorage: segue expandido */
    }
  }, []);

  useEffect(() => {
    const raiz = document.documentElement;
    if (aberto) raiz.setAttribute("data-menu", "aberto");
    else raiz.removeAttribute("data-menu");
    return () => raiz.removeAttribute("data-menu");
  }, [aberto]);

  useEffect(() => {
    const raiz = document.documentElement;
    if (recolhido) raiz.setAttribute("data-menu-recolhido", "1");
    else raiz.removeAttribute("data-menu-recolhido");
  }, [recolhido]);

  // Esc fecha a gaveta — ela é modal enquanto aberta, e sair não pode depender
  // de acertar o backdrop com o dedo.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  // Voltar ao desktop com a gaveta aberta deixaria o backdrop preso sobre o
  // painel, e o CSS que o esconde não desfaz o overflow travado do body.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1100px)");
    const aoMudar = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setAberto(false);
    };
    aoMudar(mq);
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  return { aberto, fechar, alternar, recolhido, alternarRecolhido };
}
