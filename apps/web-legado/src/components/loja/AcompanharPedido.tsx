"use client";
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { acompanharPedido, comprovantePedido } from "@/services/api/loja-pedidos";
import { useLojaPedidosStream } from "@/hooks/loja-pedidos-stream";
import type { LojaPedidoStatus } from "@/types/loja-pedidos";
import "@/app/fila.css";
import "@/app/comprovante.css";

const brl = (n: number | string) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

  const acomp = useQuery({
    queryKey: ["acompanhar", id],
    queryFn: () => acompanharPedido(id),
    refetchInterval: 5000,
  });
  const comp = useQuery({
    queryKey: ["comprovante", id],
    queryFn: () => comprovantePedido(id),
    refetchInterval: (q) => (q.state.data?.retirado ? false : 8000),
  });

  useLojaPedidosStream(useCallback(() => {
    qc.invalidateQueries({ queryKey: ["acompanhar", id] });
    qc.invalidateQueries({ queryKey: ["comprovante", id] });
  }, [qc, id]));

  const p = acomp.data;
  const c = comp.data;

  if (acomp.isLoading) return <div className="acomp-page"><p>Carregando…</p></div>;
  if (!p) return <div className="acomp-page"><p>Pedido não encontrado.</p></div>;

  const nivel = ORDEM[p.status] ?? 0;
  const retirado = p.status === "RETIRADO";

  return (
    <div className="acomp-page">
      <div className="acomp-card">
        {/* Informação operacional PRINCIPAL = SENHA da fila (PRD §39). O número
            do pedido aparece como referência secundária. */}
        {p.senha != null ? (
          <>
            <p style={{ color: "#9a9aa2", fontSize: 12, letterSpacing: ".18em", fontWeight: 800, textTransform: "uppercase", margin: "0 0 2px" }}>Senha</p>
            <h1 style={{ fontSize: 64 }}>{String(p.senha).padStart(2, "0")}</h1>
            <p style={{ color: "#6f6f78", fontSize: 12, margin: "0 0 6px" }}>Pedido #{p.numero}</p>
          </>
        ) : (
          <h1>#{p.numero}</h1>
        )}
        <p className="st">{ROTULO[p.status] ?? p.status}</p>

        {(p.status === "NA_FILA" || p.status === "EM_PREPARACAO") && p.posicao != null && (
          <>
            <div className="acomp-pos">{p.posicao}</div>
            <p style={{ color: "#9a9aa2", fontSize: 13, margin: 0 }}>posição atual na fila</p>
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

      {/* Comprovante com QR de retirada — só quando pago e ainda não retirado. */}
      {c && c.pago && !c.cancelado && (
        <div className={`cmp-card ${retirado ? "retirado" : ""}`}>
          <div className="cmp-head">
            <div>
              <span className="cmp-badge">{retirado ? "✔ Retirado" : "✔ Pago"}</span>
              <h2>Comprovante de compra</h2>
              <p className="cmp-op">{c.operacao}</p>
            </div>
            <div className="cmp-num">#{c.numero}</div>
          </div>

          {!retirado && c.codigo != null && (
            <div className="cmp-codigo">
              <p className="cmp-codigo-legenda">Seu código de retirada</p>
              <div className="cmp-codigo-num">{String(c.codigo).padStart(3, "0")}</div>
              <p className="cmp-codigo-dica">Informe este código ao vendedor no balcão.</p>
            </div>
          )}

          {!retirado && c.qrPngDataUrl && (
            <div className="cmp-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.qrPngDataUrl} alt={`QR de retirada do pedido ${c.numero}`} width={220} height={220} />
              <p className="cmp-qr-legenda">Ou mostre este QR no balcão para retirar</p>
              {c.token && <p className="cmp-token">Código: <b>{c.token.slice(0, 8).toUpperCase()}</b></p>}
            </div>
          )}
          {retirado && (
            <div className="cmp-retirado">
              <div className="cmp-retirado-icone">🎉</div>
              <p>Pedido retirado com sucesso.</p>
              {c.retiradoEm && <small>{new Date(c.retiradoEm).toLocaleString("pt-BR")}</small>}
            </div>
          )}

          <ul className="cmp-itens">
            {c.itens.map((it) => (
              <li key={it.id}>
                <span className="cmp-q">{Number(it.quantidade)}×</span>
                <span className="cmp-d">{it.descricao}</span>
                <span className="cmp-v">{brl(it.total)}</span>
              </li>
            ))}
          </ul>

          <div className="cmp-totais">
            {Number(c.desconto) > 0 && (
              <div className="cmp-linha"><span>Desconto</span><span>− {brl(c.desconto)}</span></div>
            )}
            <div className="cmp-linha total"><span>Total</span><span>{brl(c.total)}</span></div>
            {c.formaPagamento && <div className="cmp-linha sub"><span>Forma</span><span>{c.formaPagamento}</span></div>}
          </div>

          {!retirado && (
            <button className="cmp-print" onClick={() => window.print()}>Salvar / imprimir comprovante</button>
          )}
          <p className="cmp-rodape">Guarde este comprovante até a retirada. Loja FEBRACIS.</p>
        </div>
      )}
    </div>
  );
}
