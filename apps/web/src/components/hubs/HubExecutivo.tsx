"use client";

import { useMemo, type ReactNode } from "react";
import { Bloco } from "@/components/ui/Bloco";
import { Estado } from "@/components/ui/Estado";
import { Historia } from "@/components/ui/Historia";
import { Kpi } from "@/components/ui/Kpi";
import { Lista } from "@/components/ui/Lista";
import {
  useDiretoriaConsol, useEventosDesempenho, useFinanceiroQualid, useFinanceiroReceita,
} from "@/hooks/hubs";
import { agrupar, type LinhaRotulada } from "@/lib/dados";
import { moeda, porMes, variacao } from "@/lib/formato";
import { C } from "@/lib/tema";

/* ============ HUB EXECUTIVO ============ */

export function HubExecutivo() {
  const cons = useDiretoriaConsol();
  const rec = useFinanceiroReceita();
  const qual = useFinanceiroQualid();
  const ev = useEventosDesempenho();

  const cursos = useMemo(
    () => porMes((cons.data ?? []).filter((r) => r.unidade_negocio === "cursos"), "mes", "receita_liquida"),
    [cons.data]
  );
  const eventos = useMemo(
    () => porMes((cons.data ?? []).filter((r) => r.unidade_negocio === "eventos"), "mes", "receita_liquida"),
    [cons.data]
  );
  const vc = variacao(cursos), ve = variacao(eventos);

  const vendas = useMemo(() => (rec.data ?? []).filter((r) => r.natureza === "venda"), [rec.data]);

  const porCurso = useMemo<LinhaRotulada[]>(() => {
    const g = agrupar(vendas, "curso", "valor").slice(0, 6);
    return g.map((l) => l.rotulo === "nao_determinado"
      ? { ...l, rotulo: "Sem curso vinculado", orfa: true } : l);
  }, [vendas]);

  const taxaSympla = useMemo(() => {
    const d = ev.data ?? [];
    const b = d.reduce((s, e) => s + Number(e.receita_bruta ?? 0), 0);
    const l = d.reduce((s, e) => s + Number(e.receita_liquida ?? 0), 0);
    return { retido: b - l, pct: b ? ((b - l) / b) * 100 : 0 };
  }, [ev.data]);

  const q = qual.data?.[0];

  const historia = useMemo<ReactNode>(() => {
    if (!vc.atual) return "Aguardando dados.";
    const lider = porCurso.find((c) => !c.orfa);
    const ref = vc.mes
      ? new Date(vc.mes + "T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : "";
    return (
      <>
        Em <b style={{ color: C.text }}>{ref}</b>, o último mês fechado, a receita de cursos foi de{" "}
        <b style={{ color: C.text }}>{moeda(vc.atual)}</b>
        {vc.delta && (
          <>, {vc.up ? "acima" : "abaixo"} do mês anterior em{" "}
            <b style={{ color: vc.up ? C.up : C.down }}>{String(vc.delta).replace(/[+-]/, "")}</b></>
        )}.
        {lider && <> O produto que mais pesou foi <b style={{ color: C.text }}>{lider.rotulo}</b>, com {moeda(lider.valor)}.</>}
        {" "}Os eventos entraram com <b style={{ color: C.text }}>{moeda(ve.atual)}</b> líquidos —{" "}
        <b style={{ color: C.warn }}>{moeda(taxaSympla.retido)}</b> ficaram retidos como taxa da plataforma
        ({taxaSympla.pct.toFixed(1)}%).
      </>
    );
  }, [vc, ve, porCurso, taxaSympla]);

  const cobertura = q
    ? `84% da receita tem curso vinculado · ${q.pct_sem_status}% dos pagamentos sem status, então inadimplência ainda não é confiável · Loja e Estoque sem fonte conectada.`
    : null;

  return (
    <Estado carregando={cons.isLoading} erro={cons.error} vazio={!cons.data?.length}>
      <Historia frases={historia} cobertura={cobertura} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: C.bright }}>Indicadores-chave</h2>
        <span style={{ fontSize: 11.5, color: C.faint }}>último mês fechado · cursos e eventos nunca somados</span>
      </div>

      {/* R$ 6.138 e R$ 46 não são a mesma unidade de negócio.
          Um total conjunto não significaria nada. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 30 }}>
        <Kpi label="Receita · cursos" valor={moeda(vc.atual)} delta={vc.delta} up={vc.up}
             serie={vc.serie} parcial={vc.parcial != null ? moeda(vc.parcial) : null} />
        <Kpi label="Receita · eventos" valor={moeda(ve.atual)} delta={ve.delta} up={ve.up}
             serie={ve.serie} parcial={ve.parcial != null ? moeda(ve.parcial) : null} />
        <Kpi label="Taxa retida (Sympla)" valor={moeda(taxaSympla.retido)} nota={`${taxaSympla.pct.toFixed(1)}% do bruto`} destaque={C.warn} />
        <Kpi label="Pagamentos sem status" valor={q ? q.pct_sem_status : "—"} unidade="%" nota="risco de KPI" destaque={C.warn} />
      </div>

      <Bloco titulo="Receita por curso" canto="venda · acumulado" sem>
        <Estado carregando={rec.isLoading} erro={rec.error} vazio={!porCurso.length}>
          <Lista linhas={porCurso} total={porCurso.reduce((s, l) => s + l.valor, 0)} />
        </Estado>
      </Bloco>
    </Estado>
  );
}
