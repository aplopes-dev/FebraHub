"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { finContasSaldo, finDre } from "@/services/api/financeiro-erp";
import "@/app/financeiro-erp.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const anoAtual = new Date().getFullYear();

export function DreFinanceiro() {
  const [de, setDe] = useState(`${anoAtual}-01-01`);
  const [ate, setAte] = useState(new Date().toISOString().slice(0, 10));
  const dre = useQuery({ queryKey: ["fin", "dre", de, ate], queryFn: () => finDre(de, ate) });
  const contas = useQuery({ queryKey: ["fin", "contas-saldo"], queryFn: finContasSaldo });
  const d = dre.data;

  return (
    <main className="fin-page">
      <header className="fin-hero">
        <div><span className="tag">FINANCEIRO ERP · DRE</span><h1>Demonstrativo de resultado</h1><p>Receitas e despesas por grupo e conta contábil, no período de competência.</p></div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input className="fin-input" style={{ width: "auto" }} type="date" value={de} onChange={(e) => setDe(e.target.value)} />
          <span style={{ color: "var(--muted)" }}>até</span>
          <input className="fin-input" style={{ width: "auto" }} type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </div>
      </header>

      <section className="fin-kpis">
        <article><small>RECEITAS</small><b className="up">{brl(d?.receitas ?? 0)}</b><span>no período</span></article>
        <article><small>DESPESAS</small><b className="down">{brl(Math.abs(d?.despesas ?? 0))}</b><span>no período</span></article>
        <article><small>RESULTADO</small><b className={(d?.resultado ?? 0) >= 0 ? "up" : "down"}>{brl(d?.resultado ?? 0)}</b><span>receitas − despesas</span></article>
        <article><small>MARGEM</small><b>{d && d.receitas ? `${((d.resultado / d.receitas) * 100).toFixed(1)}%` : "—"}</b><span>resultado / receita</span></article>
      </section>

      <div className="fin-grid">
        <section className="fin-card fin-dre">
          <header><h2>Resultado por grupo</h2></header>
          {(d?.linhas ?? []).map((g) => (
            <div key={g.grupo}>
              <div className="grupo"><span>{g.grupo}</span><span className={g.total >= 0 ? "fin-pos" : "fin-neg"}>{brl(g.total)}</span></div>
              {g.contas.map((c) => <div key={c.conta} className="conta"><span>{c.conta}</span><span>{brl(c.valor)}</span></div>)}
            </div>
          ))}
          {!dre.isLoading && !(d?.linhas ?? []).length && <p className="fin-empty">Nenhum lançamento classificado por conta neste período.</p>}
          {d && (d.linhas.length > 0) && <div className="resultado"><span>Resultado do período</span><span className={d.resultado >= 0 ? "fin-pos" : "fin-neg"}>{brl(d.resultado)}</span></div>}
        </section>

        <aside className="fin-card">
          <header><h2>Contas bancárias</h2></header>
          {(contas.data ?? []).map((c) => (
            <div key={c.id} className="fin-linha-tot"><span>{c.nome}{c.banco ? ` · ${c.banco}` : ""}</span><b>{brl(c.saldoAtual)}</b></div>
          ))}
          {!contas.isLoading && !(contas.data ?? []).length && <p className="fin-empty">Nenhuma conta cadastrada.</p>}
        </aside>
      </div>
    </main>
  );
}
