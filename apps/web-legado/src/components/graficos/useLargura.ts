"use client";

import { useEffect, useRef, useState } from "react";

/* ============ LARGURA REAL PARA GRÁFICOS SVG ============
   Os gráficos desenhavam num viewBox fixo (ex.: 720) esticado para 100% do
   card — no desktop largo isso escala TUDO ~2×, e os "11px" dos eixos viram
   23px na tela (a reclamação de "fontes gigantes nos gráficos"). Medindo o
   container e usando a largura REAL no viewBox, 1 unidade = 1 pixel e a
   tipografia fica no tamanho que o número diz. O default de 720 mantém o
   SSR/hidratação estáveis; o ResizeObserver ajusta no primeiro paint. */

export function useLarguraGrafico(padrao = 720, min = 320, max = 1600) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [largura, setLargura] = useState(padrao);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const w = el.clientWidth;
      if (w > 0) setLargura(Math.round(Math.min(max, Math.max(min, w))));
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [min, max]);

  return { ref, largura };
}
