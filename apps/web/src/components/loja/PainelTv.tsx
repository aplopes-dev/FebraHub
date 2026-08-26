"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRinging, Broadcast } from "@phosphor-icons/react";
import { cardapioPublico, painelPublico } from "@/services/api/loja-pedidos";
import { useLojaPedidosStream } from "@/hooks/loja-pedidos-stream";
import type { PainelTvPreparando, PainelTvPronto } from "@/types/loja-pedidos";
import "@/app/painel.css";

/** Senha com no mínimo 2 dígitos (PRD §4,§13): 01, 02 … 09, 10 … 99, 100. */
const fmtSenha = (s: number | null) => (s == null ? "—" : String(s).padStart(2, "0"));

/** Nº de itens → densidade dos cards (PRD §30). g=grande, m=médio, p=compacto. */
function densidade(n: number): "g" | "m" | "p" {
  if (n <= 5) return "g";
  if (n <= 10) return "m";
  return "p";
}
/** Quantos cards cabem por página conforme a densidade (PRD §30-31). */
function capacidade(dens: "g" | "m" | "p"): number {
  return dens === "g" ? 5 : dens === "m" ? 10 : 15;
}

/**
 * Painel público / TV — TOUR CRESCIMENTO EMPRESARIAL (PRD §21-34).
 * 3 colunas: CARTAZ | EM PREPARAÇÃO | PRONTO PARA RETIRADA.
 * - Cada senha vertical, uma embaixo da outra; nunca invade outra coluna.
 * - EM PREPARAÇÃO mostra SENHA + POSIÇÃO dinâmica; PRONTO só a senha (destaque).
 * - Densidade adaptativa + paginação automática por coluna (independente).
 * - Realtime via SSE + polling; nunca exige F5. Sem dado pessoal (§28).
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

  const preparando: PainelTvPreparando[] = useMemo(() => painel.data?.preparando ?? [], [painel.data]);
  const prontos: PainelTvPronto[] = useMemo(() => painel.data?.prontos ?? [], [painel.data]);
  const nomeEvento = painel.data?.operacao?.nome ?? op.data?.operacao.nome ?? "Tour Crescimento Empresarial";
  const cartazUrl = painel.data?.operacao?.cartazUrl ?? "/tour-crescimento-empresarial.jpg";

  // Relógio ao vivo.
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Detecta a senha que ACABOU de ficar pronta para destacar (o "chamado").
  const prontosVistos = useRef<Set<number>>(new Set());
  const [novoPronto, setNovoPronto] = useState<number | null>(null);
  useEffect(() => {
    const atuais = prontos.map((p) => p.senha ?? -1).filter((s) => s >= 0);
    const novos = atuais.filter((n) => !prontosVistos.current.has(n));
    prontosVistos.current = new Set(atuais);
    if (novos.length) {
      setNovoPronto(novos[novos.length - 1]);
      const t = setTimeout(() => setNovoPronto(null), 20000);
      return () => clearTimeout(t);
    }
  }, [prontos]);

  return (
    <div className="tv">
      <div className="tv-grid">
        {/* ---- COLUNA 1: CARTAZ DO EVENTO ---- */}
        <section className="tv-cartaz">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cartazUrl} alt={nomeEvento} onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} />
          <div className="tv-cartaz-fallback">
            <span className="tv-cartaz-tour">TOUR</span>
            <b>Crescimento Empresarial</b>
            <small>Lucro · Gestão · Inovação</small>
          </div>
        </section>

        {/* ---- COLUNA 2: EM PREPARAÇÃO ---- */}
        <ColunaFila className="preparando" titulo="Em preparação" vazio="Nenhum pedido em preparação" total={preparando.length}>
          {(inicio, fim) => (
            <div className={`tv-lista dens-${densidade(preparando.length)}`}>
              {preparando.slice(inicio, fim).map((p) => (
                <div key={p.numero} className={`tv-card ${p.estado === "PROXIMO" ? "proximo" : ""}`}>
                  <span className="tv-card-senha">{fmtSenha(p.senha)}</span>
                  <span className="tv-card-pos">Posição {p.posicao}</span>
                </div>
              ))}
            </div>
          )}
        </ColunaFila>

        {/* ---- COLUNA 3: PRONTO PARA RETIRADA ---- */}
        <ColunaFila className="pronto" titulo="Pronto para retirada" vazio="Aguardando os primeiros pedidos" total={prontos.length}>
          {(inicio, fim) => (
            <div className={`tv-lista dens-${densidade(prontos.length)}`}>
              {prontos.slice(inicio, fim).map((p) => (
                <div key={p.numero} className={`tv-card pronto ${p.senha === novoPronto ? "novo" : ""}`}>
                  {p.senha === novoPronto && <BellRinging weight="fill" className="tv-card-ic" />}
                  <span className="tv-card-senha">{fmtSenha(p.senha)}</span>
                </div>
              ))}
            </div>
          )}
        </ColunaFila>
      </div>

      {/* ---- RODAPÉ ---- */}
      <div className="tv-foot">
        <span className="tv-foot-evento">{nomeEvento}</span>
        <span className="tv-foot-live"><Broadcast weight="fill" className="ic" />AO VIVO</span>
        <span className="tv-foot-hora">{agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    </div>
  );
}

/**
 * Coluna da fila com CABEÇALHO + PAGINAÇÃO AUTOMÁTICA (PRD §31-32). Quando não
 * cabem todos legivelmente, divide em páginas que trocam sozinhas a cada ~6s.
 * Cada coluna pagina independente. Overflow oculto → nunca invade a vizinha.
 * `children(inicio, fim)` recebe a fatia [inicio, fim) da página atual.
 */
function ColunaFila({
  className, titulo, vazio, total, children,
}: {
  className: string;
  titulo: string;
  vazio: string;
  total: number;
  children: (inicio: number, fim: number) => React.ReactNode;
}) {
  const porPagina = capacidade(densidade(total));
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const [pagina, setPagina] = useState(0);

  // Mantém a página dentro do range quando o total muda (pedidos entram/saem).
  useEffect(() => { setPagina((p) => (p >= paginas ? 0 : p)); }, [paginas]);

  // Rotação automática entre páginas (só quando há mais de uma).
  useEffect(() => {
    if (paginas <= 1) { setPagina(0); return; }
    const t = setInterval(() => setPagina((p) => (p + 1) % paginas), 6000);
    return () => clearInterval(t);
  }, [paginas]);

  const inicio = Math.min(pagina, paginas - 1) * porPagina;

  return (
    <section className={`tv-col ${className}`}>
      <div className="tv-col-head">
        <span className="tv-col-titulo">{titulo}</span>
        <span className="tv-col-cnt">{total}</span>
      </div>
      {total > 0 ? (
        <div className="tv-col-body">
          {children(inicio, inicio + porPagina)}
          {paginas > 1 && (
            <div className="tv-pager">
              {Array.from({ length: paginas }).map((_, i) => (
                <span key={i} className={`tv-pager-dot ${i === Math.min(pagina, paginas - 1) ? "on" : ""}`} />
              ))}
              <span className="tv-pager-lbl">página {Math.min(pagina, paginas - 1) + 1}/{paginas}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="tv-empty">{vazio}</div>
      )}
    </section>
  );
}
