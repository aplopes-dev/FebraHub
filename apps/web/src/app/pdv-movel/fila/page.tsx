"use client";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, ChefHat, PackageCheck, CheckCircle2 } from "lucide-react";
import { useLojaPedidosStream } from "@/hooks/loja-pedidos-stream";
import {
  confirmarPagamento, confirmarRetirada, iniciarPreparacao,
  lojaPedidos, marcarProximo, marcarPronto,
} from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import type { LojaPedido, LojaPedidoStatus } from "@/types/loja-pedidos";

const GRUPOS: { status: LojaPedidoStatus; titulo: string }[] = [
  { status: "AGUARDANDO_PAGAMENTO", titulo: "Aguardando pagamento" },
  { status: "PROXIMO", titulo: "Próximo" },
  { status: "NA_FILA", titulo: "Na fila" },
  { status: "EM_PREPARACAO", titulo: "Em preparação" },
  { status: "PRONTO", titulo: "Prontos" },
];

export default function Fila() {
  const qc = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);

  const pedidos = useQuery({ queryKey: ["loja-pedidos", "fila"], queryFn: () => lojaPedidos(), refetchInterval: 5000 });
  useLojaPedidosStream(useCallback(() => qc.invalidateQueries({ queryKey: ["loja-pedidos"] }), [qc]));

  const acao = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => { setErro(null); qc.invalidateQueries({ queryKey: ["loja-pedidos"] }); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha na operação."),
  });
  const rodar = (fn: () => Promise<unknown>) => () => acao.mutate(fn);

  const porStatus = useMemo(() => {
    const map: Record<string, LojaPedido[]> = {};
    for (const g of GRUPOS) map[g.status] = [];
    for (const p of pedidos.data ?? []) if (map[p.status]) map[p.status].push(p);
    return map;
  }, [pedidos.data]);

  const vazio = (pedidos.data ?? []).filter((p) => GRUPOS.some((g) => g.status === p.status)).length === 0;

  return (
    <>
      {erro && <div className="pm-erro" style={{ marginBottom: 12 }}>{erro}</div>}
      {vazio && <p className="pm-vazio">Nenhum pedido ativo agora.</p>}

      {GRUPOS.map((g) => {
        const lista = porStatus[g.status] ?? [];
        if (lista.length === 0) return null;
        return (
          <div key={g.status} className="pm-fila-grupo">
            <h3>{g.titulo} <span className="n">{lista.length}</span></h3>
            {lista.map((p) => (
              <div key={p.id} className={`pm-ped ${p.status === "PROXIMO" ? "proximo" : ""}`}>
                <div className="pm-ped-topo">
                  <b>#{p.numero}</b>
                  <span className="pm-ped-canal">{p.canal === "PDV" ? "PDV" : "Cardápio"}</span>
                </div>
                <div className="pm-ped-itens">
                  {p.itens.map((it) => `${Number(it.quantidade)}× ${it.descricao}`).join(" · ")}
                </div>
                <div className="pm-ped-acoes">
                  {p.status === "AGUARDANDO_PAGAMENTO" && (
                    <button className="pm-btn ouro" disabled={acao.isPending} onClick={rodar(() => confirmarPagamento(p.id))}><CheckCircle2 size={16} /> Pagou</button>
                  )}
                  {p.status === "NA_FILA" && (
                    <>
                      <button className="pm-btn" disabled={acao.isPending} onClick={rodar(() => marcarProximo(p.id))}><Bell size={16} /> Chamar</button>
                      <button className="pm-btn ouro" disabled={acao.isPending} onClick={rodar(() => iniciarPreparacao(p.id))}><ChefHat size={16} /> Preparar</button>
                    </>
                  )}
                  {p.status === "PROXIMO" && (
                    <button className="pm-btn ouro" disabled={acao.isPending} onClick={rodar(() => iniciarPreparacao(p.id))}><ChefHat size={16} /> Preparar</button>
                  )}
                  {p.status === "EM_PREPARACAO" && (
                    <button className="pm-btn ouro" disabled={acao.isPending} onClick={rodar(() => marcarPronto(p.id))}><PackageCheck size={16} /> Pronto</button>
                  )}
                  {p.status === "PRONTO" && (
                    <button className="pm-btn verde" disabled={acao.isPending} onClick={rodar(() => confirmarRetirada(p.id))}><CheckCircle2 size={16} /> Retirar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
