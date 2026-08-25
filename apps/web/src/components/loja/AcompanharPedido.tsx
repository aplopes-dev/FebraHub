"use client";
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { acompanharPedido } from "@/services/api/loja-pedidos";
import { useLojaPedidosStream } from "@/hooks/loja-pedidos-stream";
import type { LojaPedidoStatus } from "@/types/loja-pedidos";
import "@/app/fila.css";

const PASSOS: { status: LojaPedidoStatus; label: string }[] = [
  { status: "NA_FILA", label: "Na fila" },
  { status: "EM_PREPARACAO", label: "Em preparação" },
  { status: "PRONTO", label: "Pronto" },
  { status: "RETIRADO", label: "Retirado" },
];

const ORDEM: Record<string, number> = {
  AGUARDANDO_PAGAMENTO: 0, PAGAMENTO_CONFIRMADO: 1, NA_FILA: 1,
  PROXIMO: 1, EM_PREPARACAO: 2, PRONTO: 3, RETIRADO: 4, CANCELADO: -1,
};

const ROTULO: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGAMENTO_CONFIRMADO: "Pagamento confirmado",
  NA_FILA: "Na fila",
  PROXIMO: "Você é o próximo!",
  EM_PREPARACAO: "Em preparação",
  PRONTO: "Pronto para retirada",
  RETIRADO: "Pedido retirado",
  CANCELADO: "Pedido cancelado",
};

export function AcompanharPedido({ id }: { id: string }) {
  const qc = useQueryClient();
  const pedido = useQuery({
    queryKey: ["acompanhar", id],
    queryFn: () => acompanharPedido(id),
    refetchInterval: 5000,
  });

  useLojaPedidosStream(useCallback(() => {
    qc.invalidateQueries({ queryKey: ["acompanhar", id] });
  }, [qc, id]));

  const p = pedido.data;
  if (pedido.isLoading) return <div className="acomp-page"><p>Carregando…</p></div>;
  if (!p) return <div className="acomp-page"><p>Pedido não encontrado.</p></div>;

  const nivel = ORDEM[p.status] ?? 0;

  return (
    <div className="acomp-page">
      <div className="acomp-card">
        <h1>#{p.numero}</h1>
        <p className="st">{ROTULO[p.status] ?? p.status}</p>

        {p.status === "NA_FILA" && p.posicao != null && (
          <>
            <div className="acomp-pos">{p.posicao}</div>
            <p style={{ color: "#9a9aa2", fontSize: 13, margin: 0 }}>posição na fila</p>
          </>
        )}
        {p.status === "PROXIMO" && (
          <div className="acomp-pos" style={{ color: "#e9b949", fontSize: 30, letterSpacing: ".05em" }}>
            Dirija-se ao balcão 🔔
          </div>
        )}
        {p.status === "PRONTO" && (
          <div className="acomp-pos" style={{ color: "#5ac37a", fontSize: 30 }}>Pode retirar 🎉</div>
        )}

        {p.status !== "CANCELADO" && (
          <div className="acomp-passos">
            {PASSOS.map((passo) => (
              <div key={passo.status} className={`acomp-passo ${nivel >= ORDEM[passo.status] ? "ok" : ""}`}>
                <span className="bola" /> {passo.label}
              </div>
            ))}
          </div>
        )}
        {p.status === "CANCELADO" && (
          <p style={{ color: "#e06c75", marginTop: 20 }}>Este pedido foi cancelado.</p>
        )}
      </div>
    </div>
  );
}
