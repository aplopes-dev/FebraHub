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

/**
 * Densidade + paginação (PRD §30-31). Regra simples e previsível para NUNCA
 * espremer/cortar a senha: uma coluna de TV mostra no máximo POR_PAGINA cards
 * por página, com altura garantida. Se houver mais, PAGINA (troca sozinha).
 *   • ≤ 4 itens  → cards GRANDES (g), 1 página.
 *   • 5..8 itens → cards MÉDIOS  (m), 1 página.
 *   • > 8 itens  → cards MÉDIOS, paginado de 8 em 8.
 * Assim, com 10 itens: página 1 = 8 senhas, página 2 = 2 senhas — a senha 10
 * aparece na página 2, com posição, sem sumir nem virar texto. */
const POR_PAGINA = 8;
/** Número máximo de senhas da fila a mostrar individualmente antes do resumo */
const MAX_FILA_INDIVIDUAL = 5;

function densidade(n: number): "g" | "m" {
  return n <= 4 ? "g" : "m";
}

/**
 * Painel público / TV — TOUR CRESCIMENTO EMPRESARIAL (PRD §21-34).
 * 3 colunas: CARTAZ | FILA + EM PREPARAÇÃO | PRONTO PARA RETIRADA.
 * - A coluna do meio é dividida em duas sub-seções na MESMA COLUNA:
 *     • FILA (NA_FILA/PROXIMO): mostra as 5 primeiras senhas individualmente;
 *       a partir da 6ª, exibe um card resumo "De [senha 5] até [última]".
 *     • EM PREPARAÇÃO: todos os pedidos sendo montados.
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

  // Separar fila (NA_FILA + PROXIMO) de em preparação (EM_PREPARACAO)
  const naFila = useMemo(() => preparando.filter((p) => p.estado === "NA_FILA" || p.estado === "PROXIMO"), [preparando]);
  const emPreparacao = useMemo(() => preparando.filter((p) => p.estado === "EM_PREPARACAO"), [preparando]);

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

        {/* ---- COLUNA 2: FILA + EM PREPARAÇÃO (mesma coluna, 2 sub-seções) ---- */}
        <section className="tv-col preparando">
          {/* --- Sub-seção: FILA --- */}
          <div className="tv-col-head">
            <span className="tv-col-titulo">Fila</span>
            <span className="tv-col-cnt">{naFila.length}</span>
          </div>
          {naFila.length === 0 ? (
            <div className="tv-empty tv-empty-fila">Nenhum pedido na fila</div>
          ) : (
            <FilaComResumo itens={naFila} />
          )}

          {/* --- Divisória --- */}
          <div className="tv-col-divisoria" />

          {/* --- Sub-seção: EM PREPARAÇÃO --- */}
          <div className="tv-col-head">
            <span className="tv-col-titulo tv-col-titulo-prep">Em preparação</span>
            <span className="tv-col-cnt">{emPreparacao.length}</span>
          </div>
          {emPreparacao.length === 0 ? (
            <div className="tv-empty tv-empty-prep">Nenhum pedido em preparação</div>
          ) : (
            <ColunaInterna itens={emPreparacao} />
          )}
        </section>

        {/* ---- COLUNA 3: PRONTO PARA RETIRADA ---- */}
        <ColunaFila className="pronto" titulo="Pronto para retirada" vazio="Aguardando os primeiros pedidos" total={prontos.length}>
          {(inicio, fim) => (
            <div className={`tv-lista dens-${densidade(prontos.length)}`}>
              {prontos.slice(inicio, fim).map((p) => {
                const destaque = novoPronto != null && p.senha === novoPronto;
                return (
                  <div key={p.numero} className={`tv-card pronto ${destaque ? "novo" : ""}`}>
                    {destaque && <BellRinging weight="fill" className="tv-card-ic" />}
                    {/* Pedidos legados sem senha: mostra #pedido como fallback. */}
                    <span className="tv-card-senha">{p.senha != null ? fmtSenha(p.senha) : `#${p.numero}`}</span>
                  </div>
                );
              })}
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
 * Sub-seção FILA (dentro da coluna 2) com regra do resumo:
 * - Mostra as 5 primeiras senhas individualmente (cards normais).
 * - Se houver mais de 5, o 6º card exibe: "De [senha 5] até [senha do último]"
 */
function FilaComResumo({ itens }: { itens: PainelTvPreparando[] }) {
  const visiveis = itens.slice(0, MAX_FILA_INDIVIDUAL);
  const restantes = itens.slice(MAX_FILA_INDIVIDUAL); // da 6ª em diante
  const temResumo = restantes.length > 0;

  return (
    <div className={`tv-lista-fila dens-${densidade(Math.min(itens.length, MAX_FILA_INDIVIDUAL + (temResumo ? 1 : 0)))}`}>
      {visiveis.map((p) => (
        <div key={p.numero} className={`tv-card tv-card-fila ${p.estado === "PROXIMO" ? "proximo" : ""}`}>
          <span className="tv-card-senha">{p.senha != null ? fmtSenha(p.senha) : `#${p.numero}`}</span>
          <span className="tv-card-pos">Posição {p.posicao}</span>
        </div>
      ))}
      {temResumo && (() => {
        const senhaUlt = itens[itens.length - 1];
        const senha5 = itens[MAX_FILA_INDIVIDUAL - 1];
        const de = senha5.senha != null ? fmtSenha(senha5.senha) : `#${senha5.numero}`;
        const ate = senhaUlt.senha != null ? fmtSenha(senhaUlt.senha) : `#${senhaUlt.numero}`;
        return (
          <div className="tv-card tv-card-resumo">
            <span className="tv-card-resumo-txt">
              <span className="tv-card-resumo-label">+ {restantes.length} na fila</span>
              <span className="tv-card-resumo-range">De {de} até {ate}</span>
            </span>
          </div>
        );
      })()}
    </div>
  );
}

/**
 * Sub-seção EM PREPARAÇÃO (dentro da coluna 2).
 * Lista compacta com paginação automática se muitos itens.
 */
function ColunaInterna({ itens }: { itens: PainelTvPreparando[] }) {
  const paginas = Math.max(1, Math.ceil(itens.length / POR_PAGINA));
  const [pagina, setPagina] = useState(0);
  useEffect(() => { setPagina((p) => (p >= paginas ? 0 : p)); }, [paginas]);
  useEffect(() => {
    if (paginas <= 1) { setPagina(0); return; }
    const t = setInterval(() => setPagina((p) => (p + 1) % paginas), 6000);
    return () => clearInterval(t);
  }, [paginas]);
  const inicio = Math.min(pagina, paginas - 1) * POR_PAGINA;
  const fatia = itens.slice(inicio, inicio + POR_PAGINA);

  return (
    <div className="tv-col-body tv-col-body-prep">
      <div className={`tv-lista tv-lista-prep dens-${densidade(itens.length)}`}>
        {fatia.map((p) => (
          <div key={p.numero} className={`tv-card ${p.estado === "PROXIMO" ? "proximo" : ""}`}>
            <span className="tv-card-senha">{p.senha != null ? fmtSenha(p.senha) : `#${p.numero}`}</span>
            <span className="tv-card-pos">Posição {p.posicao}</span>
          </div>
        ))}
      </div>
      {paginas > 1 && (
        <div className="tv-pager">
          {Array.from({ length: paginas }).map((_, i) => (
            <span key={i} className={`tv-pager-dot ${i === Math.min(pagina, paginas - 1) ? "on" : ""}`} />
          ))}
          <span className="tv-pager-lbl">Página {Math.min(pagina, paginas - 1) + 1} de {paginas}</span>
        </div>
      )}
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
  const porPagina = POR_PAGINA;
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
              <span className="tv-pager-lbl">Página {Math.min(pagina, paginas - 1) + 1} de {paginas}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="tv-empty">{vazio}</div>
      )}
    </section>
  );
}
