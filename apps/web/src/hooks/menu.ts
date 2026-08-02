"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Estado da gaveta de navegação (só existe abaixo de 1100px).
 *
 * O estado real mora em `data-menu` no <html>, não aqui: o backdrop, a
 * transição da gaveta e o travamento do scroll do body são CSS, e todos os
 * três precisam reagir juntos. Passar isso por prop até cada um seria três
 * lugares para dessincronizar.
 */
export function useMenu() {
  const [aberto, setAberto] = useState(false);

  const fechar = useCallback(() => setAberto(false), []);
  const alternar = useCallback(() => setAberto((v) => !v), []);

  useEffect(() => {
    const raiz = document.documentElement;
    if (aberto) raiz.setAttribute("data-menu", "aberto");
    else raiz.removeAttribute("data-menu");
    return () => raiz.removeAttribute("data-menu");
  }, [aberto]);

  // Esc fecha — a gaveta é modal enquanto está aberta, e sair dela não pode
  // depender de acertar o backdrop com o dedo.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  // Voltar ao desktop com a gaveta aberta deixaria o backdrop preso por cima
  // do painel, e o CSS que o esconde não desfaz o overflow travado do body.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1100px)");
    const aoMudar = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setAberto(false);
    };
    aoMudar(mq);
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, []);

  return { aberto, fechar, alternar };
}
