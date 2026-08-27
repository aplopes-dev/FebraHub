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

// Só os status "ativos" aparecem na fila. A ORDEM define a posição na lista
// única (mais adiantado no fluxo primeiro) e o "peso" p/ ordenar.
const ATIVOS: LojaPedidoStatus[] = ["PRONTO", "PROXIMO", "EM_PREPARACAO", "NA_FILA", "AGUARDANDO_PAGAMENTO"];
const PESO: Record<string, number> = {
  PRONTO: 0, PROXIMO: 1, EM_PREPARACAO: 2, NA_FILA: 3, AGUARDANDO_PAGAMENTO: 4,
};
const STATUS_ROTULO: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PROXIMO: "Próximo",
  NA_FILA: "Na fila",
  EM_PREPARACAO: "Em preparação",
  PRONTO: "Pronto",
};

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

  // Lista ÚNICA: só ativos, ordenados pelo estágio do fluxo (prontos no topo),
  // desempate por senha/nº (mais antigo primeiro).
  const lista = useMemo(() => {
    return (pedidos.data ?? [])
      .filter((p) => ATIVOS.includes(p.status))
      .sort((a, b) => {
        const d = (PESO[a.status] ?? 9) - (PESO[b.status] ?? 9);
        if (d !== 0) return d;
        return (a.senhaFila ?? a.numero) - (b.senhaFila ?? b.numero);
      });
  }, [pedidos.data]);

  return (
    <>
      {erro && <div className="pm-erro" style={{ marginBottom: 12 }}>{erro}</div>}
      {pedidos.data && lista.length === 0 && <p className="pm-vazio">Nenhum pedido ativo agora.</p>}

      <div className="pm-fila-lista">
        {lista.map((p: LojaPedido) => (
          <div key={p.id} className={`pm-ped ${p.status === "PROXIMO" ? "proximo" : ""} ${p.status === "PRONTO" ? "pronto" : ""}`}>
            <div className="pm-ped-topo">
              <b>#{p.numero}</b>
              <span className={`pm-ped-estado s-${p.status.toLowerCase()}`}>{STATUS_ROTULO[p.status] ?? p.status}</span>
              <span className="pm-ped-canal">{p.canal === "PDV" ? "PDV" : "Cardápio"}</span>
            </div>
            {p.clienteNome && <div className="pm-ped-cliente">{p.clienteNome}</div>}
            <div className="pm-ped-itens">
              {p.itens.map((it) => `${Number(it.quantidade)}× ${it.descricao}`).join(" · ")}
            </div>
            <div className="pm-ped-acoes">
              {p.status === "AGUARDANDO_PAGAMENTO" && (
                <button className="pm-btn ouro" disabled={acao.isPending} onClick={rodar(() => confirmarPagamento(p.id))}><CheckCircle2 size={16} /> Confirmar pagamento</button>
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
                <button className="pm-btn ouro" disabled={acao.isPending} onClick={rodar(() => marcarPronto(p.id))}><PackageCheck size={16} /> Marcar pronto</button>
              )}
              {p.status === "PRONTO" && (
                <button className="pm-btn verde" disabled={acao.isPending} onClick={rodar(() => confirmarRetirada(p.id))}><CheckCircle2 size={16} /> Entregar</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
