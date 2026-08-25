"use client";
import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cardapioPublico, painelPublico } from "@/services/api/loja-pedidos";
import { useLojaPedidosStream } from "@/hooks/loja-pedidos-stream";
import "@/app/fila.css";

/**
 * Painel público / TV — só NÚMERO + STATUS, nunca dado pessoal (regra 35 do PRD).
 * Legível à distância; atualiza sozinho.
 */
export function PainelTv({ slug }: { slug?: string }) {
  const qc = useQueryClient();
  useLojaPedidosStream(useCallback(() => {
    qc.invalidateQueries({ queryKey: ["tv-painel"] });
  }, [qc]));

  const op = useQuery({
    queryKey: ["tv-operacao", slug],
    queryFn: () => (slug ? cardapioPublico(slug) : Promise.resolve(null)),
    enabled: !!slug,
  });
  const operacaoId = op.data?.operacao.id;

  const painel = useQuery({
    queryKey: ["tv-painel", operacaoId ?? "todas"],
    queryFn: () => painelPublico(operacaoId),
    refetchInterval: 4000,
    enabled: !slug || !!operacaoId,
  });

  const p = painel.data ?? { naFila: [], proximo: [], emPreparacao: [], prontos: [] };
  const numeros = (arr: number[]) =>
    arr.length ? arr.map((n) => <span key={n} className="tv-num">{n}</span>) : <span className="tv-vazio">—</span>;

  return (
    <div className="tv-page">
      <header className="tv-head">
        <h1>Loja FEBRACIS</h1>
        <span>{op.data?.operacao.nome ?? "OPERAÇÃO"}</span>
      </header>
      <div className="tv-grid">
        <div className="tv-bloco destaque">
          <h2>VOCÊ É O PRÓXIMO</h2>
          <div className="tv-numeros">{numeros(p.proximo)}</div>
        </div>
        <div className="tv-bloco">
          <h2>NA FILA</h2>
          <div className="tv-numeros">{numeros(p.naFila)}</div>
        </div>
        <div className="tv-bloco">
          <h2>EM PREPARAÇÃO</h2>
          <div className="tv-numeros">{numeros(p.emPreparacao)}</div>
        </div>
        <div className="tv-bloco pronto">
          <h2>PRONTOS</h2>
          <div className="tv-numeros">{numeros(p.prontos)}</div>
        </div>
      </div>
    </div>
  );
}
