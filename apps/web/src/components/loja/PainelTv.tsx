"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cardapioPublico, painelPublico } from "@/services/api/loja-pedidos";
import { useLojaPedidosStream } from "@/hooks/loja-pedidos-stream";
import "@/app/painel.css";

/**
 * Painel de senhas / TV — estilo QSR (McDonald's/BK): duas colunas grandes,
 * PREPARANDO | PRONTO, com a última senha pronta em destaque (o "chamado").
 * Só NÚMERO + STATUS, nunca dado pessoal (regra 35 do PRD). Legível à
 * distância; atualiza sozinho por SSE + polling.
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

  // Relógio ao vivo (data + hora), para dar "vida" à tela.
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Detecta qual senha ACABOU de ficar pronta para pulsar (o "chamado").
  const prontosVistos = useRef<Set<number>>(new Set());
  const [novoPronto, setNovoPronto] = useState<number | null>(null);
  useEffect(() => {
    const atuais = p.prontos ?? [];
    const novos = atuais.filter((n) => !prontosVistos.current.has(n));
    prontosVistos.current = new Set(atuais);
    if (novos.length) {
      setNovoPronto(novos[novos.length - 1]);
      const t = setTimeout(() => setNovoPronto(null), 20000);
      return () => clearTimeout(t);
    }
  }, [p.prontos]);

  // Coluna "preparando" agrupa fila + em preparação (ordenado).
  const preparando = useMemo(
    () => Array.from(new Set([...(p.naFila ?? []), ...(p.emPreparacao ?? [])])).sort((a, b) => a - b),
    [p.naFila, p.emPreparacao],
  );
  const prontos = useMemo(() => [...(p.prontos ?? [])].sort((a, b) => a - b), [p.prontos]);
  const proximo = p.proximo ?? [];

  return (
    <div className="tv">
      {/* ---- CABEÇALHO ---- */}
      <header className="tv-top">
        <div className="tv-brand">
          <div className="tv-logo">🛍️</div>
          <div className="tv-brand-txt">
            <small>Loja FEBRACIS</small>
            <b>{op.data?.operacao.nome ?? "Retirada de pedidos"}</b>
          </div>
        </div>
        <div className="tv-clock">
          <b>{agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</b>
          <small>{agora.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</small>
        </div>
      </header>

      {/* ---- BOARD ---- */}
      <div className="tv-board">
        {/* PREPARANDO */}
        <section className="tv-col preparando">
          <div className="tv-col-head">
            <span className="dot" />Preparando
            <span className="cnt">{preparando.length}</span>
          </div>

          {proximo.length > 0 && (
            <div className="tv-proximo">
              <span className="lbl">Prepare-se · próximo</span>
              <span className="val">
                {proximo.map((n) => <span key={n}>{n}</span>)}
              </span>
            </div>
          )}

          {preparando.length > 0 ? (
            <div className="tv-nums">
              {preparando.map((n) => <span key={n} className="tv-num">{n}</span>)}
            </div>
          ) : (
            <div className="tv-empty"><span>⏳</span>Nenhum pedido em preparo</div>
          )}
        </section>

        {/* PRONTO */}
        <section className="tv-col pronto">
          <div className="tv-col-head">
            <span className="dot" />Pronto · pode retirar
            <span className="cnt">{prontos.length}</span>
          </div>

          {prontos.length > 0 ? (
            <div className="tv-nums">
              {prontos.map((n) => (
                <span key={n} className={`tv-num ${n === novoPronto ? "novo" : ""}`}>{n}</span>
              ))}
            </div>
          ) : (
            <div className="tv-empty"><span>🔔</span>Aguardando os primeiros pedidos</div>
          )}
        </section>
      </div>

      <div className="tv-foot">
        <span className="live"><span className="dot" />AO VIVO</span>
        · Retire seu pedido no balcão quando sua senha aparecer em verde
      </div>
    </div>
  );
}
