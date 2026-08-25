"use client";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ChefHat, CheckCircle2, Clock, PackageCheck, Ban, RefreshCw } from "lucide-react";
import { useLojaPedidosStream } from "@/hooks/loja-pedidos-stream";
import {
  cancelarPedido, confirmarPagamento, confirmarRetirada, iniciarPreparacao,
  lojaPedidos, lojaPedidosDashboard, lojaPedidosIndicadores, marcarProximo, marcarPronto,
} from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import type { LojaPedido, LojaPedidoStatus } from "@/types/loja-pedidos";
import "@/app/loja.css";
import "@/app/fila.css";

const brl = (n: number | string) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLUNAS: { status: LojaPedidoStatus; titulo: string; Icone: typeof Clock }[] = [
  { status: "AGUARDANDO_PAGAMENTO", titulo: "Aguardando pagamento", Icone: Clock },
  { status: "NA_FILA", titulo: "Na fila", Icone: Bell },
  { status: "EM_PREPARACAO", titulo: "Em preparação", Icone: ChefHat },
  { status: "PRONTO", titulo: "Prontos", Icone: PackageCheck },
];

function minutosDe(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

export function FilaLoja() {
  const qc = useQueryClient();
  const podeOperar = pode(usePerfil(useSessao()).data, "loja.pedidos.operar");
  const [erro, setErro] = useState<string | null>(null);
  const [verDash, setVerDash] = useState(false);

  const indicadores = useQuery({
    queryKey: ["loja-pedidos", "indicadores"],
    queryFn: () => lojaPedidosIndicadores(),
    refetchInterval: 8000,
  });
  const pedidos = useQuery({
    queryKey: ["loja-pedidos", "fila"],
    queryFn: () => lojaPedidos(),
    refetchInterval: 5000,
  });

  // SSE: reage na hora a novos pedidos/transições; o polling acima é o fallback.
  useLojaPedidosStream(useCallback(() => {
    qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
  }, [qc]));

  const dashboard = useQuery({
    queryKey: ["loja-pedidos", "dashboard"],
    queryFn: () => lojaPedidosDashboard(),
    refetchInterval: 15000,
    enabled: verDash,
  });

  const porStatus = useMemo(() => {
    const map: Record<string, LojaPedido[]> = {};
    for (const c of COLUNAS) map[c.status] = [];
    for (const p of pedidos.data ?? []) {
      if (map[p.status]) map[p.status].push(p);
    }
    return map;
  }, [pedidos.data]);

  const acao = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      setErro(null);
      qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha na operação."),
  });

  const rodar = (fn: () => Promise<unknown>) => () => acao.mutate(fn);

  const i = indicadores.data;

  return (
    <div className="fila-page">
      <header className="fila-hero">
        <div>
          <span className="tag">LOJA · OPERAÇÃO</span>
          <h1>Fila de preparação</h1>
          <p>Pagamento → fila → preparação → pronto → retirada, em tempo real.</p>
        </div>
        <button className="loja-btn" onClick={() => qc.invalidateQueries({ queryKey: ["loja-pedidos"] })}>
          <RefreshCw /> Atualizar
        </button>
      </header>

      {i && (
        <section className="fila-kpis">
          <article><small>Faturamento hoje</small><b>{brl(i.faturamentoHoje)}</b><span>{i.pedidosHoje} pedidos</span></article>
          <article><small>Na fila</small><b>{i.aguardandoFila}</b><span>aguardando preparação</span></article>
          <article><small>Em preparação</small><b>{i.emPreparacao}</b><span>sendo montados</span></article>
          <article><small>Prontos</small><b className="warn">{i.prontos}</b><span>aguardando retirada</span></article>
        </section>
      )}

      {erro && <div className="fila-erro">{erro}</div>}

      <div>
        <button className="loja-btn mini" onClick={() => setVerDash((v) => !v)}>
          {verDash ? "Ocultar indicadores" : "Ver indicadores da operação"}
        </button>
      </div>

      {verDash && dashboard.data && (
        <section className="fila-dash">
          <div className="fila-dash-card">
            <h3>Mais vendidos</h3>
            {dashboard.data.maisVendidos.length === 0 && <p className="fila-vazio">Sem vendas ainda.</p>}
            {dashboard.data.maisVendidos.map((m) => (
              <div key={m.descricao} className="fila-dash-linha"><span>{m.descricao}</span><b>{m.quantidade}</b></div>
            ))}
          </div>
          <div className="fila-dash-card">
            <h3>Formas de pagamento</h3>
            {dashboard.data.formas.map((f) => (
              <div key={f.forma} className="fila-dash-linha"><span>{f.forma}</span><b>{brl(f.valor)}</b></div>
            ))}
          </div>
          <div className="fila-dash-card">
            <h3>Por canal</h3>
            {dashboard.data.canais.map((c) => (
              <div key={c.canal} className="fila-dash-linha"><span>{c.canal === "PDV" ? "PDV" : "Cardápio"}</span><b>{brl(c.valor)} · {c.pedidos}</b></div>
            ))}
            <div className="fila-dash-linha" style={{ marginTop: 8, borderTop: "1px solid var(--card-line)", paddingTop: 8 }}>
              <span>Tempo médio de preparação</span><b>{dashboard.data.tempoMedioPreparacaoMin} min</b>
            </div>
            <div className="fila-dash-linha"><span>Tempo médio de espera</span><b>{dashboard.data.tempoMedioEsperaMin} min</b></div>
          </div>
        </section>
      )}

      <section className="fila-board">
        {COLUNAS.map((col) => {
          const lista = porStatus[col.status] ?? [];
          return (
            <div key={col.status} className="fila-coluna">
              <header><col.Icone /> {col.titulo} <span>{lista.length}</span></header>
              <div className="fila-cards">
                {lista.length === 0 && <p className="fila-vazio">—</p>}
                {lista.map((p) => (
                  <article key={p.id} className={`fila-card ${p.status === "PROXIMO" ? "proximo" : ""}`}>
                    <div className="fila-card-topo">
                      <b>#{p.numero}</b>
                      <span className="fila-canal">{p.canal === "PDV" ? "PDV" : "Cardápio"}</span>
                    </div>
                    <div className="fila-itens">
                      {p.itens.map((it) => (
                        <span key={it.id}>{Number(it.quantidade)}× {it.descricao}</span>
                      ))}
                    </div>
                    <div className="fila-card-meta">
                      <span>{brl(p.total)}</span>
                      <span><Clock /> {minutosDe(p.criadoEm)} min</span>
                    </div>
                    {podeOperar && (
                      <div className="fila-acoes">
                        {p.status === "AGUARDANDO_PAGAMENTO" && (
                          <button className="loja-btn ouro mini" disabled={acao.isPending} onClick={rodar(() => confirmarPagamento(p.id))}>
                            <CheckCircle2 /> Confirmar pagamento
                          </button>
                        )}
                        {p.status === "NA_FILA" && (
                          <>
                            <button className="loja-btn mini" disabled={acao.isPending} onClick={rodar(() => marcarProximo(p.id))}><Bell /> Chamar</button>
                            <button className="loja-btn ouro mini" disabled={acao.isPending} onClick={rodar(() => iniciarPreparacao(p.id))}><ChefHat /> Preparar</button>
                          </>
                        )}
                        {p.status === "EM_PREPARACAO" && (
                          <button className="loja-btn ouro mini" disabled={acao.isPending} onClick={rodar(() => marcarPronto(p.id))}><PackageCheck /> Pronto</button>
                        )}
                        {p.status === "PRONTO" && (
                          <button className="loja-btn ouro mini" disabled={acao.isPending} onClick={rodar(() => confirmarRetirada(p.id))}><CheckCircle2 /> Retirar</button>
                        )}
                        {p.status !== "RETIRADO" && p.status !== "CANCELADO" && (
                          <button className="loja-btn perigo mini" disabled={acao.isPending} onClick={() => {
                            const motivo = window.prompt("Motivo do cancelamento?");
                            if (motivo) acao.mutate(() => cancelarPedido(p.id, motivo));
                          }}><Ban /></button>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
