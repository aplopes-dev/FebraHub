"use client";
import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Clock, CreditCard, Package, Store, TrendingUp } from "lucide-react";
import { lojaOperacoes, lojaPedidosDashboard, lojaPedidosIndicadores } from "@/services/api/loja-pedidos";
import { useLojaPedidosStream } from "@/hooks/loja-pedidos-stream";
import { Select } from "@/components/ui/Select";
import "@/app/loja.css";
import "@/app/fila.css";

const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const FORMA_ROTULO: Record<string, string> = {
  PIX: "PIX", CARTAO_CREDITO: "Crédito", CARTAO_DEBITO: "Débito", DINHEIRO: "Dinheiro",
};

export function DashboardLoja() {
  const qc = useQueryClient();
  const [operacaoId, setOperacaoId] = useState<string>("");

  const operacoes = useQuery({ queryKey: ["loja-operacoes"], queryFn: () => lojaOperacoes() });
  const ind = useQuery({
    queryKey: ["loja-pedidos", "indicadores", operacaoId],
    queryFn: () => lojaPedidosIndicadores(operacaoId || undefined),
    refetchInterval: 10000,
  });
  const dash = useQuery({
    queryKey: ["loja-pedidos", "dashboard", operacaoId],
    queryFn: () => lojaPedidosDashboard(operacaoId || undefined),
    refetchInterval: 15000,
  });

  useLojaPedidosStream(useCallback(() => {
    qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
  }, [qc]));

  const i = ind.data;
  const d = dash.data;
  const maxVend = Math.max(1, ...(d?.maisVendidos.map((m) => m.quantidade) ?? [1]));
  const totalFormas = Math.max(1, (d?.formas ?? []).reduce((s, f) => s + f.valor, 0));

  return (
    <div className="loja-page">
      <header className="loja-hero">
        <div>
          <span className="tag">LOJA · DASHBOARD</span>
          <h1>Indicadores da operação</h1>
          <p>Faturamento, ranking de produtos, formas de pagamento, canais e tempos — em tempo real.</p>
        </div>
        <Select aria-label="Operação" value={operacaoId} onChange={setOperacaoId} style={{ minWidth: 190 }}
          options={[{ value: "", label: "Todas as operações" }, ...(operacoes.data ?? []).map((o) => ({ value: o.id, label: o.nome }))]} />
      </header>

      {/* KPIs operacionais */}
      {i && (
        <section className="loja-kpis">
          <article><small>Faturamento hoje</small><b>{brl(i.faturamentoHoje)}</b><span>{i.pedidosHoje} pedidos hoje</span></article>
          <article><small>Faturamento total</small><b>{brl(i.faturamento)}</b><span>{i.pedidos} pedidos</span></article>
          <article><small>Ticket médio</small><b>{brl(i.ticketMedio)}</b><span>por pedido pago</span></article>
          <article><small>Na fila</small><b>{i.aguardandoFila}</b><span>aguardando preparo</span></article>
          <article><small>Em preparação</small><b>{i.emPreparacao}</b><span>sendo montados</span></article>
          <article><small>Prontos</small><b className="warn">{i.prontos}</b><span>aguardando retirada</span></article>
        </section>
      )}

      <section className="dash-grid">
        {/* Mais vendidos */}
        <div className="loja-card">
          <h3 className="dash-titulo"><Package size={15} /> Produtos mais vendidos</h3>
          {d?.maisVendidos.length ? d.maisVendidos.map((m) => (
            <div key={m.descricao} className="dash-barra">
              <div className="dash-barra-topo"><span>{m.descricao}</span><b>{m.quantidade}</b></div>
              <div className="dash-barra-trilha"><div className="dash-barra-fill" style={{ width: `${(m.quantidade / maxVend) * 100}%` }} /></div>
              <small>{brl(m.total)}</small>
            </div>
          )) : <p className="fila-vazio">Sem vendas ainda.</p>}
        </div>

        {/* Formas de pagamento */}
        <div className="loja-card">
          <h3 className="dash-titulo"><CreditCard size={15} /> Formas de pagamento</h3>
          {d?.formas.length ? d.formas.map((f) => (
            <div key={f.forma} className="dash-linha">
              <span>{FORMA_ROTULO[f.forma] ?? f.forma}</span>
              <div className="dash-linha-dir">
                <b>{brl(f.valor)}</b>
                <small>{Math.round((f.valor / totalFormas) * 100)}% · {f.transacoes}×</small>
              </div>
            </div>
          )) : <p className="fila-vazio">—</p>}
        </div>

        {/* Canais */}
        <div className="loja-card">
          <h3 className="dash-titulo"><Store size={15} /> Cardápio × PDV</h3>
          {d?.canais.length ? d.canais.map((c) => (
            <div key={c.canal} className="dash-linha">
              <span>{c.canal === "PDV" ? "Balcão (PDV)" : "Cardápio Digital"}</span>
              <div className="dash-linha-dir"><b>{brl(c.valor)}</b><small>{c.pedidos} pedidos</small></div>
            </div>
          )) : <p className="fila-vazio">—</p>}
        </div>

        {/* Tempos */}
        <div className="loja-card">
          <h3 className="dash-titulo"><Clock size={15} /> Tempos médios</h3>
          <div className="dash-tempo"><TrendingUp size={18} /><div><b>{d?.tempoMedioPreparacaoMin ?? 0} min</b><small>preparação (pagamento → pronto)</small></div></div>
          <div className="dash-tempo"><Clock size={18} /><div><b>{d?.tempoMedioEsperaMin ?? 0} min</b><small>espera total (pagamento → retirada)</small></div></div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}><BarChart3 size={11} style={{ verticalAlign: -1 }} /> Média dos últimos pedidos concluídos.</p>
        </div>
      </section>
    </div>
  );
}
