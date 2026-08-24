"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Receipt, TrendingUp, Wallet } from "lucide-react";
import { pdvIndicadores, pdvVendas } from "@/services/api/pdv";
import "@/app/pdv.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ResumoPdv() {
  const ind = useQuery({ queryKey: ["pdv", "indicadores"], queryFn: pdvIndicadores });
  const recentes = useQuery({ queryKey: ["pdv", "vendas", "recentes"], queryFn: () => pdvVendas() });
  const i = ind.data;
  return (
    <main className="pdv-page">
      <header className="pdv-hero">
        <div>
          <span className="tag">PDV · PONTO DE VENDA</span>
          <h1>Ponto de venda</h1>
          <p>Frente de caixa interna — a venda baixa o estoque e gera o recebível no financeiro, sem serviço externo.</p>
        </div>
        <Link href="/pdv/caixa" className="pdv-btn ouro"><Receipt size={15} /> Abrir frente de caixa <ArrowRight size={15} /></Link>
      </header>

      <section className="pdv-kpis">
        <article><small>FATURAMENTO</small><b>{brl(i?.faturamento ?? 0)}</b><span>vendas fechadas</span></article>
        <article><small>VENDAS</small><b>{(i?.vendas ?? 0).toLocaleString("pt-BR")}</b><span>cupons</span></article>
        <article><small>TICKET MÉDIO</small><b>{brl(i?.ticketMedio ?? 0)}</b><span>por venda</span></article>
        <article><small>HOJE</small><b>{brl(i?.faturamentoHoje ?? 0)}</b><span>{(i?.vendasHoje ?? 0)} vendas</span></article>
      </section>

      <div className="pdv-grid">
        <section className="pdv-card">
          <header><h2>Vendas recentes</h2><Link href="/pdv/vendas" className="pdv-btn" style={{ padding: "6px 10px" }}>Ver todas</Link></header>
          <table className="pdv-table">
            <thead><tr><th>Nº</th><th>Cliente</th><th>Data</th><th className="num">Total</th><th></th></tr></thead>
            <tbody>
              {(recentes.data ?? []).slice(0, 10).map((v) => (
                <tr key={v.id}>
                  <td><b>{v.numero}</b></td>
                  <td>{v.clienteNome || "Consumidor"}</td>
                  <td>{new Date(v.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="num">{brl(Number(v.total))}</td>
                  <td><span className={`pdv-badge ${v.situacao === "fechada" ? "ok" : "off"}`}>{v.situacao}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!recentes.isLoading && !(recentes.data ?? []).length && <p className="pdv-empty">Nenhuma venda ainda.</p>}
        </section>

        <aside className="pdv-card">
          <header><h2><Wallet size={15} style={{ verticalAlign: "-2px" }} /> Por forma de pagamento</h2></header>
          {(i?.formas ?? []).map((f) => (
            <div key={f.forma} className="pdv-tot"><span>{f.forma}</span><b>{brl(f.valor)}</b></div>
          ))}
          {!(i?.formas ?? []).length && <p className="pdv-empty">Sem pagamentos ainda.</p>}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--hair)", fontSize: 11.5, color: "var(--muted)", display: "flex", gap: 8, alignItems: "center" }}>
            <TrendingUp size={14} style={{ color: "var(--gold)" }} /> Cada venda gera um lançamento no Financeiro ERP.
          </div>
        </aside>
      </div>
    </main>
  );
}
