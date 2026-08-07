"use client";

import { useMemo } from "react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { Kpi } from "@/components/ui/Kpi";
import { Lista } from "@/components/ui/Lista";
import { RodapeIntegracoes } from "@/components/ui/RodapeIntegracoes";
import { useEventosDesempenho } from "@/hooks/hubs";
import { moeda, numero } from "@/lib/formato";
import { C } from "@/lib/tema";
import type { LinhaRotulada } from "@/lib/dados";

export function HubEventos() {
  const ev = useEventosDesempenho();
  const t = useMemo(() => {
    const d = ev.data ?? [];
    return {
      ingressos: d.reduce((s, e) => s + Number(e.ingressos ?? 0), 0),
      check: d.reduce((s, e) => s + Number(e.compareceram ?? 0), 0),
      bruta: d.reduce((s, e) => s + Number(e.receita_bruta ?? 0), 0),
      liquida: d.reduce((s, e) => s + Number(e.receita_liquida ?? 0), 0),
    };
  }, [ev.data]);
  const top = useMemo<LinhaRotulada[]>(
    () => [...(ev.data ?? [])]
      .sort((a, b) => Number(b.receita_liquida ?? 0) - Number(a.receita_liquida ?? 0))
      .slice(0, 10)
      .map((e) => ({ rotulo: String(e.nome_evento ?? "—"), valor: Number(e.receita_liquida ?? 0) })),
    [ev.data]
  );
  const comp = t.ingressos ? ((t.check / t.ingressos) * 100).toFixed(1) : null;

  return (
    <>
      <Estado carregando={ev.isLoading} erro={ev.error} vazio={!ev.data?.length}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 26 }}>
          <Kpi label="Receita líquida" valor={moeda(t.liquida)} nota="já sem a taxa" />
          <Kpi label="Taxa Sympla" valor={moeda(t.bruta - t.liquida)} nota="retido na fonte" destaque={C.warn} />
          <Kpi label="Ingressos" valor={numero(t.ingressos)} nota="acumulado" />
          <Kpi label="Comparecimento" valor={comp ?? "—"} unidade="%" nota="check-in / ingresso" />
        </div>
        <Bloco titulo="Eventos por receita líquida" canto="acumulado" sem>
          <Lista linhas={top} total={t.liquida} />
        </Bloco>
      </Estado>
      <RodapeIntegracoes fontes={["sympla"]} />
    </>
  );
}
