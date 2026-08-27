"use client";
import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useLojaPedidosStream } from "@/hooks/loja-pedidos-stream";
import { lojaPedidos } from "@/services/api/loja-pedidos";

const brl = (n: number | string) =>
  Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pgto.",
  PAGAMENTO_CONFIRMADO: "Pago",
  NA_FILA: "Na fila",
  PROXIMO: "Próximo",
  EM_PREPARACAO: "Preparando",
  PRONTO: "Pronto",
  RETIRADO: "Concluída",
  CANCELADO: "Cancelada",
};

const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "hoje", label: "Hoje" },
  { id: "abertas", label: "Em aberto" },
  { id: "concluidas", label: "Concluídas" },
  { id: "canceladas", label: "Canceladas" },
] as const;
type FiltroId = (typeof FILTROS)[number]["id"];

export default function Vendas() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroId>("todas");

  const pedidos = useQuery({
    queryKey: ["loja-pedidos", "vendas"],
    queryFn: () => lojaPedidos(),
    refetchInterval: 8000,
  });
  useLojaPedidosStream(
    useCallback(() => qc.invalidateQueries({ queryKey: ["loja-pedidos"] }), [qc]),
  );

  const lista = useMemo(() => {
    let rows = [...(pedidos.data ?? [])].sort(
      (a, b) => +new Date(b.criadoEm) - +new Date(a.criadoEm),
    );
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);
    if (filtro === "hoje") rows = rows.filter((p) => +new Date(p.criadoEm) >= +inicioHoje);
    if (filtro === "abertas") rows = rows.filter((p) => !["RETIRADO", "CANCELADO"].includes(p.status));
    if (filtro === "concluidas") rows = rows.filter((p) => p.status === "RETIRADO");
    if (filtro === "canceladas") rows = rows.filter((p) => p.status === "CANCELADO");

    const q = busca.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (p) =>
          String(p.numero).includes(q) ||
          (p.clienteNome ?? "").toLowerCase().includes(q) ||
          p.itens.some((it) => it.descricao.toLowerCase().includes(q)),
      );
    }
    return rows;
  }, [pedidos.data, filtro, busca]);

  const totalFiltrado = useMemo(
    () => lista.filter((p) => p.status !== "CANCELADO").reduce((s, p) => s + Number(p.total), 0),
    [lista],
  );

  return (
    <>
      <div className="pm-busca">
        <Search />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nº, cliente ou produto…"
          inputMode="search"
        />
        {busca && (
          <button className="pm-busca-x" onClick={() => setBusca("")} aria-label="Limpar busca">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="pm-chips">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            className={`pm-chip ${filtro === f.id ? "on" : ""}`}
            onClick={() => setFiltro(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="pm-vendas-resumo">
        <span>{lista.length} venda{lista.length === 1 ? "" : "s"}</span>
        <b>{brl(totalFiltrado)}</b>
      </div>

      {pedidos.isLoading && <p className="pm-vazio">Carregando vendas…</p>}
      {pedidos.data && lista.length === 0 && <p className="pm-vazio">Nenhuma venda encontrada.</p>}

      {lista.map((p) => (
        <div key={p.id} className="pm-venda">
          <div className="pm-venda-topo">
            <b>#{p.numero}</b>
            <span className="pm-ped-canal">{p.canal === "PDV" ? "PDV" : "Cardápio"}</span>
            <span className={`pm-venda-status s-${p.status}`}>
              {STATUS_LABEL[p.status] ?? p.status}
            </span>
            <span className="pm-venda-hora">
              {new Date(p.criadoEm).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {p.clienteNome && <div className="pm-venda-cliente">{p.clienteNome}</div>}
          <div className="pm-ped-itens">
            {p.itens.map((it) => `${Number(it.quantidade)}× ${it.descricao}`).join(" · ")}
          </div>
          <div className="pm-venda-fim">
            {Number(p.desconto) > 0 && (
              <span className="pm-venda-desc">−{brl(p.desconto)}</span>
            )}
            <b>{brl(p.total)}</b>
          </div>
        </div>
      ))}
    </>
  );
}
