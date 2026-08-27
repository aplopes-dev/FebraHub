"use client";
/**
 * CentralVendas — Central de Vendas e Conciliação da Loja (FebraHub + Stone + Omie).
 *
 * Regra de ouro (PRD §20, §56): o faturamento consolidado é a soma das VENDAS
 * CONSOLIDADAS — NUNCA a soma das origens (senão a mesma venda em 3 sistemas
 * triplicaria). Os valores por origem são visões, não parcelas somáveis.
 *
 *  - Cards do topo (clicáveis → aplicam filtro).
 *  - Filtro de ORIGEM em destaque (Todas | FebraHub | Stone | Omie) + filtros.
 *  - Tabela consolidada (badges das 3 origens) ou registros por origem.
 *  - Drawer de detalhe com os 3 blocos + auditoria + conciliar/desvincular.
 *  - Conciliação manual (selecionar registros), sincronizar Stone, exportar CSV.
 */
import "@/app/loja.css";
import "@/app/central-vendas.css";
import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw, Download, Link2, ChevronLeft, ChevronRight, X, AlertTriangle,
  CheckCircle2, Store, CreditCard, FileText, Search, Layers,
} from "lucide-react";
import { useSessao, pode, ehAdmin } from "@/hooks/auth";
import { Select } from "@/components/ui/Select";
import {
  centralListar, centralResumo, centralDetalhe, centralStatusIntegracao,
  centralConciliar, centralDesvincular, centralRessincronizar, centralExportarUrl,
  type FiltrosCentral, type VendaConsolidada, type VendaOrigem, type StatusConciliacao,
} from "@/services/api/central-vendas";

// ─────────────────────────── helpers ───────────────────────────
const money = (v: string | number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtData = (s?: string | null) =>
  s ? new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS_LABEL: Record<StatusConciliacao, string> = {
  CONCILIADA: "Conciliada",
  PARCIALMENTE_CONCILIADA: "Parcial",
  SOMENTE_STONE: "Somente Stone",
  SOMENTE_FEBRAHUB: "Somente FebraHub",
  SOMENTE_OMIE: "Somente Omie",
  FEBRAHUB_STONE: "FebraHub + Stone",
  FEBRAHUB_OMIE: "FebraHub + Omie",
  STONE_OMIE: "Stone + Omie",
  DIVERGENCIA_VALOR: "Divergência",
  POSSIVEL_DUPLICIDADE: "Poss. duplicidade",
  REQUER_REVISAO: "Requer revisão",
  CANCELADA: "Cancelada",
  ESTORNADA: "Estornada",
};

function BadgeStatus({ s }: { s: StatusConciliacao }) {
  return <span className={`cv-status ${s}`}>{STATUS_LABEL[s] ?? s}</span>;
}
function BadgeOrigem({ nome, on }: { nome: string; on: boolean }) {
  return <span className={`cv-orig ${on ? "on" : "off"}`}>{nome} {on ? "✓" : "—"}</span>;
}
const vcNum = (n: number) => `VC-${String(n).padStart(6, "0")}`;

// ─────────────────────────── componente ───────────────────────────
export function CentralVendas() {
  const sessao = useSessao();
  const perfil = sessao?.perfil ?? null;
  const qc = useQueryClient();
  const podeConciliar = pode(perfil, "loja.vendas.conciliar") || (perfil ? ehAdmin(perfil) : false);

  const [filtros, setFiltros] = useState<FiltrosCentral>({ origem: "todas", pagina: 1, porPagina: 30 });
  const [detalheId, setDetalheId] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const setFiltro = (k: keyof FiltrosCentral, v: string | number | undefined) =>
    setFiltros((f) => ({ ...f, [k]: v, pagina: 1 }));
  const limparFiltros = () =>
    setFiltros({ origem: "todas", pagina: 1, porPagina: 30 });

  const { data: resumo } = useQuery({
    queryKey: ["cv-resumo", filtros.dataInicio, filtros.dataFim],
    queryFn: () => centralResumo({ dataInicio: filtros.dataInicio, dataFim: filtros.dataFim }),
    refetchInterval: 60_000,
  });
  const { data: integracao } = useQuery({
    queryKey: ["cv-integracao"],
    queryFn: () => centralStatusIntegracao(),
    refetchInterval: 120_000,
  });
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["cv-lista", filtros],
    queryFn: () => centralListar(filtros),
    refetchInterval: 45_000,
  });

  const syncMut = useMutation({
    mutationFn: () => centralRessincronizar(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cv-lista"] }).then(() => {
      void qc.invalidateQueries({ queryKey: ["cv-resumo"] });
      void qc.invalidateQueries({ queryKey: ["cv-integracao"] });
    }),
  });

  const conciliarMut = useMutation({
    mutationFn: (ids: string[]) => centralConciliar({ origemIds: ids }),
    onSuccess: () => {
      setSelecionados(new Set());
      void qc.invalidateQueries({ queryKey: ["cv-lista"] });
      void qc.invalidateQueries({ queryKey: ["cv-resumo"] });
    },
  });

  const toggleSel = (id: string) =>
    setSelecionados((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const filtroCard = (patch: Partial<FiltrosCentral>) =>
    setFiltros((f) => ({ ...f, ...patch, pagina: 1 }));

  const modoOrigem = filtros.origem && filtros.origem !== "todas";
  const itens = data?.itens ?? [];

  return (
    <div className="vnd-page cv-page">
      {/* ---------- CARDS ---------- */}
      <div className="cv-cards">
        <button className="cv-card destaque" onClick={() => filtroCard({ origem: "todas", statusConciliacao: undefined })}>
          <div className="cv-card-label"><Layers size={13} /> Faturamento consolidado</div>
          <div className="cv-card-valor">{money(resumo?.faturamentoConsolidado ?? 0)}</div>
          <div className="cv-card-sub">{resumo?.totalVendas ?? 0} vendas reais únicas</div>
        </button>
        <button className="cv-card" onClick={() => filtroCard({ origem: "STONE" })}>
          <div className="cv-card-label"><CreditCard size={13} /> Movimentado na Stone</div>
          <div className="cv-card-valor">{money(resumo?.porOrigem?.STONE.valor ?? 0)}</div>
          <div className="cv-card-sub">{resumo?.porOrigem?.STONE.count ?? 0} transações</div>
        </button>
        <button className="cv-card" onClick={() => filtroCard({ origem: "FEBRAHUB" })}>
          <div className="cv-card-label"><Store size={13} /> Registrado no FebraHub</div>
          <div className="cv-card-valor">{money(resumo?.porOrigem?.FEBRAHUB.valor ?? 0)}</div>
          <div className="cv-card-sub">{resumo?.porOrigem?.FEBRAHUB.count ?? 0} pedidos</div>
        </button>
        <button className="cv-card" onClick={() => filtroCard({ origem: "OMIE" })}>
          <div className="cv-card-label"><FileText size={13} /> Registrado no Omie</div>
          <div className="cv-card-valor">{money(resumo?.porOrigem?.OMIE.valor ?? 0)}</div>
          <div className="cv-card-sub">{resumo?.porOrigem?.OMIE.count ?? 0} documentos</div>
        </button>
        <button className="cv-card critico" onClick={() => filtroCard({ origem: "todas", statusConciliacao: "SOMENTE_STONE" })}>
          <div className="cv-card-label"><AlertTriangle size={13} /> Stone sem FebraHub</div>
          <div className="cv-card-valor">{money(resumo?.somenteStone.valor ?? 0)}</div>
          <div className="cv-card-sub">{resumo?.somenteStone.count ?? 0} transações</div>
        </button>
        <button className="cv-card" onClick={() => filtroCard({ origem: "todas", statusConciliacao: "SOMENTE_FEBRAHUB" })}>
          <div className="cv-card-label">FebraHub sem Stone</div>
          <div className="cv-card-valor">{money(resumo?.febrahubSemStone.valor ?? 0)}</div>
          <div className="cv-card-sub">{resumo?.febrahubSemStone.count ?? 0} vendas</div>
        </button>
        <button className="cv-card" onClick={() => filtroCard({ origem: "todas", statusConciliacao: "REQUER_REVISAO" })}>
          <div className="cv-card-label">Não conciliado</div>
          <div className="cv-card-valor pequeno">{resumo?.naoConciliado ?? 0}</div>
          <div className="cv-card-sub">registros pendentes</div>
        </button>
        <button className="cv-card" onClick={() => filtroCard({ origem: "todas", statusConciliacao: "DIVERGENCIA_VALOR" })}>
          <div className="cv-card-label">Divergências</div>
          <div className="cv-card-valor pequeno">{resumo?.divergencias.count ?? 0}</div>
          <div className="cv-card-sub">{money(resumo?.divergencias.valor ?? 0)}</div>
        </button>
      </div>

      {/* ---------- FILTRO DE ORIGEM + AÇÕES ---------- */}
      <div className="cv-barra">
        <div className="cv-origem-tabs" role="tablist" aria-label="Origem">
          {(["todas", "FEBRAHUB", "STONE", "OMIE"] as const).map((o) => (
            <button
              key={o}
              role="tab"
              aria-selected={(filtros.origem ?? "todas") === o}
              className={`cv-origem-tab${(filtros.origem ?? "todas") === o ? " on" : ""}`}
              onClick={() => setFiltro("origem", o)}
            >
              {o === "todas" ? "Todas" : o === "FEBRAHUB" ? "FebraHub" : o === "STONE" ? "Stone" : "Omie"}
            </button>
          ))}
        </div>
        <div className="cv-barra-acoes">
          {integracao && (
            <span className={`cv-int ${integracao.stone.conectado ? "on" : "off"}`} title={integracao.stone.ultimoErro ?? ""}>
              Stone {integracao.stone.conectado ? "conectada" : "não configurada"}
              {integracao.stone.ultimaSincronizacao ? ` • ${fmtData(integracao.stone.ultimaSincronizacao)}` : ""}
            </span>
          )}
          {podeConciliar && (
            <button className="loja-btn" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
              <RefreshCw size={14} className={syncMut.isPending ? "cv-girando" : ""} />
              {syncMut.isPending ? "Sincronizando…" : "Sincronizar"}
            </button>
          )}
          <a className="loja-btn" href={centralExportarUrl(filtros)} target="_blank" rel="noreferrer">
            <Download size={14} /> Exportar
          </a>
        </div>
      </div>

      {/* ---------- FILTROS ---------- */}
      <div className="cv-filtros">
        <div className="cv-busca">
          <Search size={15} />
          <input
            placeholder="Buscar: venda, pedido, cliente, NSU, TID, ID Stone/Omie…"
            value={filtros.busca ?? ""}
            onChange={(e) => setFiltro("busca", e.target.value || undefined)}
          />
        </div>
        <input className="vnd-input" type="date" title="Data inicial" value={filtros.dataInicio ?? ""} onChange={(e) => setFiltro("dataInicio", e.target.value || undefined)} />
        <input className="vnd-input" type="date" title="Data final" value={filtros.dataFim ?? ""} onChange={(e) => setFiltro("dataFim", e.target.value || undefined)} />
        <input className="vnd-input" placeholder="Unidade" value={filtros.unidade ?? ""} onChange={(e) => setFiltro("unidade", e.target.value || undefined)} />
        {!modoOrigem && (
          <Select
            className="vnd-select" aria-label="Status de conciliação"
            value={filtros.statusConciliacao ?? ""}
            onChange={(v) => setFiltro("statusConciliacao", v || undefined)}
            options={[{ value: "", label: "Todos os status" }, ...Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))]}
          />
        )}
        <input className="vnd-input" placeholder="NSU" value={filtros.nsu ?? ""} onChange={(e) => setFiltro("nsu", e.target.value || undefined)} />
        <input className="vnd-input" placeholder="TID" value={filtros.tid ?? ""} onChange={(e) => setFiltro("tid", e.target.value || undefined)} />
        <input className="vnd-input" placeholder="Terminal" value={filtros.terminal ?? ""} onChange={(e) => setFiltro("terminal", e.target.value || undefined)} />
        <button className="loja-btn mini" onClick={limparFiltros}>Limpar filtros</button>
      </div>

      {/* ---------- BARRA DE SELEÇÃO (conciliar manual) ---------- */}
      {podeConciliar && selecionados.size > 0 && (
        <div className="cv-selbar">
          <span>{selecionados.size} registro{selecionados.size !== 1 ? "s" : ""} selecionado{selecionados.size !== 1 ? "s" : ""}</span>
          <button className="loja-btn ouro mini" onClick={() => conciliarMut.mutate([...selecionados])} disabled={conciliarMut.isPending}>
            <Link2 size={13} /> Conciliar vendas
          </button>
          <button className="loja-btn mini" onClick={() => setSelecionados(new Set())}>Cancelar</button>
        </div>
      )}

      {/* ---------- TABELA ---------- */}
      <div className="vnd-card">
        <div className="vnd-tabela-wrap">
          <table className="vnd-tabela cv-tabela">
            {modoOrigem ? (
              <thead><tr>
                {podeConciliar && <th style={{ width: 34 }} />}
                <th>Data/Hora</th><th>Origem</th><th>Registro</th><th>Valor</th>
                <th>Forma</th><th>NSU / TID</th><th>Cliente</th><th>Conciliação</th>
              </tr></thead>
            ) : (
              <thead><tr>
                {podeConciliar && <th style={{ width: 34 }} />}
                <th>Data/Hora</th><th>Venda</th><th>Valor</th><th>Origens</th>
                <th>Forma</th><th>Cliente</th><th>Unidade</th><th>Conciliação</th>
              </tr></thead>
            )}
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="vnd-vazio">Carregando…</td></tr>
              ) : !itens.length ? (
                <tr><td colSpan={9} className="vnd-vazio">Nenhuma venda encontrada</td></tr>
              ) : modoOrigem ? (
                (itens as VendaOrigem[]).map((o) => (
                  <tr key={o.id} className={selecionados.has(o.id) ? "sel" : ""}>
                    {podeConciliar && <td><input type="checkbox" checked={selecionados.has(o.id)} onChange={() => toggleSel(o.id)} /></td>}
                    <td><span className="vnd-data">{fmtData(o.dataHora)}</span></td>
                    <td><span className={`cv-orig on ${o.origem}`}>{o.origem}</span></td>
                    <td className="cv-mono">{o.externalId.length > 22 ? o.externalId.slice(0, 22) + "…" : o.externalId}</td>
                    <td className="vnd-total">{money(o.valor)}</td>
                    <td>{o.formaPagamento ?? "—"}{o.parcelas && o.parcelas > 1 ? ` ${o.parcelas}x` : ""}</td>
                    <td className="cv-mono">{o.nsu ?? "—"}<br /><span className="vnd-canal">{o.tid ?? ""}</span></td>
                    <td>{o.clienteNome ?? "—"}</td>
                    <td>{o.consolidada ? <button className="cv-vc" onClick={() => setDetalheId(o.consolidadaId!)}>{vcNum(o.consolidada.numero)}</button> : <span className="cv-status SOMENTE_STONE">Não conciliado</span>}</td>
                  </tr>
                ))
              ) : (
                (itens as VendaConsolidada[]).map((v) => (
                  <tr key={v.id} className="cv-linha" onClick={() => setDetalheId(v.id)}>
                    {podeConciliar && <td onClick={(e) => e.stopPropagation()}><input type="checkbox" disabled title="Selecione na visão por origem" /></td>}
                    <td><span className="vnd-data">{fmtData(v.dataVenda)}</span></td>
                    <td><span className="cv-vc-txt">{vcNum(v.numero)}</span></td>
                    <td className="vnd-total">{money(v.valorTotal)}{v.inferido && <span className="cv-inf" title="Vínculo inferido por heurística">≈</span>}</td>
                    <td className="cv-origens">
                      <BadgeOrigem nome="FH" on={v.temFebrahub} />
                      <BadgeOrigem nome="ST" on={v.temStone} />
                      <BadgeOrigem nome="OM" on={v.temOmie} />
                    </td>
                    <td>{v.formaPagamento ?? "—"}</td>
                    <td>{v.clienteNome ?? "—"}</td>
                    <td>{v.unidade ?? <span className="vnd-canal">n/ident.</span>}</td>
                    <td><BadgeStatus s={v.statusConciliacao} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {(data?.totalPaginas ?? 0) > 1 && (
          <div className="vnd-pag">
            <span>{data?.total} registro{data?.total !== 1 ? "s" : ""} • página {data?.pagina} de {data?.totalPaginas}</span>
            <div className="vnd-pag-btns">
              <button className="vnd-pag-btn" disabled={(filtros.pagina ?? 1) <= 1} onClick={() => setFiltros((f) => ({ ...f, pagina: (f.pagina ?? 1) - 1 }))}><ChevronLeft size={14} /></button>
              <button className="vnd-pag-btn" disabled={(filtros.pagina ?? 1) >= (data?.totalPaginas ?? 1)} onClick={() => setFiltros((f) => ({ ...f, pagina: (f.pagina ?? 1) + 1 }))}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
        {isFetching && !isLoading && <div className="cv-fetching">Atualizando…</div>}
      </div>

      {detalheId && (
        <DrawerDetalhe id={detalheId} onClose={() => setDetalheId(null)} podeConciliar={podeConciliar} onMudou={() => {
          void qc.invalidateQueries({ queryKey: ["cv-lista"] });
          void qc.invalidateQueries({ queryKey: ["cv-resumo"] });
        }} />
      )}
    </div>
  );
}

// ─────────────────────────── drawer de detalhe ───────────────────────────
function DrawerDetalhe({ id, onClose, podeConciliar, onMudou }: { id: string; onClose: () => void; podeConciliar: boolean; onMudou: () => void }) {
  const qc = useQueryClient();
  const { data: d, isLoading } = useQuery({ queryKey: ["cv-detalhe", id], queryFn: () => centralDetalhe(id) });

  const invalidar = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["cv-detalhe", id] });
    onMudou();
  }, [qc, id, onMudou]);

  const desvincularMut = useMutation({
    mutationFn: (origemId: string) => centralDesvincular({ origemId }),
    onSuccess: invalidar,
  });

  const blocos = useMemo(() => {
    const map: Record<string, VendaOrigem | undefined> = {};
    for (const o of d?.origens ?? []) if (!map[o.origem]) map[o.origem] = o;
    return map;
  }, [d]);
  const stones = (d?.origens ?? []).filter((o) => o.origem === "STONE");

  return (
    <div className="cv-drawer-bg" onClick={onClose}>
      <aside className="cv-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cv-drawer-topo">
          <div>
            <div className="cv-drawer-vc">{d ? vcNum(d.numero) : "Venda"}</div>
            {d && <BadgeStatus s={d.statusConciliacao} />}
          </div>
          <button className="cv-x" onClick={onClose}><X size={18} /></button>
        </div>

        {isLoading || !d ? (
          <div className="cv-drawer-body">Carregando…</div>
        ) : (
          <div className="cv-drawer-body">
            <div className="cv-resumo-valores">
              <div><span>Faturamento</span><strong>{money(d.valorTotal)}</strong></div>
              <div><span>Recebido (Stone)</span><strong>{money(d.valorRecebido)}</strong></div>
              {Number(d.valorEstornado) > 0 && <div className="est"><span>Estornado</span><strong>{money(d.valorEstornado)}</strong></div>}
            </div>

            {/* BLOCO FEBRAHUB */}
            <BlocoOrigem titulo="FebraHub" origem={blocos.FEBRAHUB} podeConciliar={podeConciliar} onDesvincular={(oid) => desvincularMut.mutate(oid)} pendente={desvincularMut.isPending}>
              {!!d.itensFebrahub?.length && (
                <ul className="cv-itens">
                  {d.itensFebrahub.map((it, i) => (
                    <li key={i}><span>{Number(it.quantidade).toFixed(0)}× {it.descricao}</span><span>{money(it.total)}</span></li>
                  ))}
                </ul>
              )}
            </BlocoOrigem>

            {/* BLOCO OMIE */}
            <BlocoOrigem titulo="Omie" origem={blocos.OMIE} podeConciliar={podeConciliar} onDesvincular={(oid) => desvincularMut.mutate(oid)} pendente={desvincularMut.isPending} />

            {/* BLOCO(S) STONE — pode haver múltiplos pagamentos (§27) */}
            {stones.length === 0 ? (
              <BlocoOrigem titulo="Stone" origem={undefined} podeConciliar={podeConciliar} onDesvincular={() => {}} pendente={false} />
            ) : (
              stones.map((s) => (
                <BlocoOrigem key={s.id} titulo={`Stone${stones.length > 1 ? " (pagamento)" : ""}`} origem={s} podeConciliar={podeConciliar} onDesvincular={(oid) => desvincularMut.mutate(oid)} pendente={desvincularMut.isPending}>
                  <div className="cv-stone-meta">
                    {s.bandeira && <span>{s.bandeira}</span>}
                    {s.autorizacao && <span>Aut. {s.autorizacao}</span>}
                    {s.terminal && <span>Terminal {s.terminal}</span>}
                  </div>
                </BlocoOrigem>
              ))
            )}

            {/* AUDITORIA */}
            {!!d.auditoria?.length && (
              <div className="cv-audit">
                <div className="cv-audit-tit">Histórico de conciliação</div>
                {d.auditoria.map((a) => (
                  <div key={a.id} className="cv-audit-item">
                    <span className={`cv-audit-tag ${a.acao}`}>{a.acao}</span>
                    <span className="cv-audit-det">{a.detalhe}</span>
                    <span className="cv-audit-meta">{a.usuarioNome ?? "sistema"} • {fmtData(a.criadoEm)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function BlocoOrigem({
  titulo, origem, children, podeConciliar, onDesvincular, pendente,
}: {
  titulo: string; origem?: VendaOrigem; children?: React.ReactNode;
  podeConciliar: boolean; onDesvincular: (id: string) => void; pendente: boolean;
}) {
  return (
    <div className={`cv-bloco ${origem ? "on" : "off"}`}>
      <div className="cv-bloco-topo">
        <span className="cv-bloco-tit">{origem ? <CheckCircle2 size={14} /> : null}{titulo}</span>
        {origem ? <span className="cv-bloco-valor">{money(origem.valor)}</span> : <span className="cv-bloco-nao">não localizado</span>}
      </div>
      {origem && (
        <div className="cv-bloco-corpo">
          <div className="cv-bloco-linhas">
            <span>ID: <b className="cv-mono">{origem.externalId}</b></span>
            {origem.nsu && <span>NSU: <b className="cv-mono">{origem.nsu}</b></span>}
            {origem.tid && <span>TID: <b className="cv-mono">{origem.tid}</b></span>}
            {origem.formaPagamento && <span>Forma: <b>{origem.formaPagamento}{origem.parcelas && origem.parcelas > 1 ? ` ${origem.parcelas}x` : ""}</b></span>}
            {origem.vinculoModo && <span>Vínculo: <b>{origem.vinculoModo}{origem.vinculoScore != null ? ` (${origem.vinculoScore}%)` : ""}</b></span>}
          </div>
          {children}
          {podeConciliar && origem.consolidadaId && (
            <button className="loja-btn perigo mini" onClick={() => { if (confirm(`Desvincular ${titulo} desta venda?`)) onDesvincular(origem.id); }} disabled={pendente}>
              Desvincular
            </button>
          )}
        </div>
      )}
    </div>
  );
}
