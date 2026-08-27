"use client";

/* Ritmo da meta — wrapper do gráfico interativo (Recharts). */

import type { RitmoMeta as Dados, Unidade } from "@/types/executivo";
import { GraficoRitmoMeta } from "./graficos/GraficoRitmoMeta";

export function RitmoMeta({ dados, unidade }: { dados: Dados; unidade: Unidade }) {
  return <GraficoRitmoMeta dados={dados} unidade={unidade} />;
}
