"use client";
/**
 * VendasLoja — Tabela de todas as vendas da Loja com status do lançamento Omie.
 *
 * Funcionalidades:
 *  - Listar vendas pagas/confirmadas com filtros (busca, status, data, status Omie)
 *  - Indicadores KPI (total de vendas, lançadas no Omie, com erro, pendentes)
 *  - Lançar uma venda individual no Omie (botão por linha)
 *  - Lançar em lote todas as filtradas / não-lançadas
 *  - Aba "Configuração Omie" para gerenciar app_key / app_secret / conta
 *  - Aba "Sync SKU" para sincronizar códigos de produto
 */
import { useCallback, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings, RefreshCw, Upload, CheckCircle2, AlertCircle,
  Clock, Package, ChevronLeft, ChevronRight, Link2,
} from "lucide-react";
import { useSessao, pode, ehAdmin } from "@/hooks/auth";
import {
  omieVendas, omieConfig, omieConfigSalvar, omieTestar,
  omieSyncSku, omieLancarUm, omieLancarFiltrados,
  type FiltrosVendas, type OmieConfig,
} from "@/services/api/omie";

const STATUS_PEDIDO_LABEL: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando Pgto.",
  CONFIRMADO: "Confirmado",
  NA_FILA: "Na Fila",
  EM_PREPARACAO: "Preparando",
  PRONTO: "Pronto",
  RETIRADO: "Retirado",
  CANCELADO: "Cancelado",
  EXPIRADO: "Expirado",
};

const CANAL_LABEL: Record<string, string> = {
  CARDAPIO_DIGITAL: "Cardápio",
  BALCAO: "Balcão",
  PDV: "PDV",
};

function BadgeStatus({ s }: { s: string }) {
  return <span className={`vnd-badge ${s}`}>{STATUS_PEDIDO_LABEL[s] ?? s}</span>;
}

function BadgeOmie({ s, num }: { s?: string; num?: string | null }) {
  if (!s) return <span className="vnd-badge sem-omie">Não lançado</span>;
  if (s === "lancado") return <span className="vnd-badge lancado">✓ {num ?? "Lançado"}</span>;
  if (s === "erro") return <span className="vnd-badge erro">✗ Erro</span>;
  if (s === "cancelado") return <span className="vnd-badge cancelado">Cancelado</span>;
  return <span className="vnd-badge pendente">{s}</span>;
}

function fmtMoeda(v: string | number) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtData(s: string) {
  return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// ──────────────────────────────────────────────────────────────
// Sub-componente: Aba de Configuração Omie
// ──────────────────────────────────────────────────────────────
/** Estado do form de configuração (campos de texto, sem booleanos) */
interface FormCfg { appKey: string; appSecret: string; contaCorrente: string; codigoCategoria: string; }

function AbaConfig() {
  const qc = useQueryClient();
  const { data: cfg, isLoading } = useQuery({ queryKey: ["omie-config"], queryFn: omieConfig });
  const [form, setForm] = useState<Partial<FormCfg>>({});
  const [ativoLocal, setAtivoLocal] = useState<boolean | undefined>(undefined);
  const [testando, setTestando] = useState(false);
  const [testeResp, setTesteResp] = useState<string | null>(null);

  const salvaMut = useMutation({
    mutationFn: (d: Partial<OmieConfig>) => omieConfigSalvar(d),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["omie-config"] }); setForm({}); setAtivoLocal(undefined); },
  });

  const syncSkuMut = useMutation({
    mutationFn: omieSyncSku,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["omie-vendas"] }),
  });

  const val = (k: keyof FormCfg) => {
    if (k in form) return form[k] ?? "";
    if (!cfg) return "";
    return String(cfg[k as keyof OmieConfig] ?? "");
  };

  const set = (k: keyof FormCfg, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const ativoEfetivo = ativoLocal !== undefined ? ativoLocal : (cfg?.ativo ?? false);
  const temAlteracao = Object.keys(form).length > 0 || ativoLocal !== undefined;

  const testar = async () => {
    setTestando(true); setTesteResp(null);
    try {
      const r = await omieTestar();
      setTesteResp(r.ok ? "✅ Conexão OK!" : "❌ Falha na conexão");
    } catch (e: unknown) {
      setTesteResp(`❌ ${e instanceof Error ? e.message : "Erro"}`);
    } finally { setTestando(false); }
  };

  if (isLoading) return <div className="vnd-vazio">Carregando…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Card principal */}
      <div className="vnd-config-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Credenciais da API Omie</h3>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={ativoEfetivo}
              onChange={(e) => setAtivoLocal(e.target.checked)}
            />
            Integração ativa
          </label>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 16px" }}>
          Obtenha app_key e app_secret em <b>app.omie.com.br → Engrenagem → API</b>
        </p>
        <div className="vnd-config-grid">
          <div className="vnd-config-campo">
            <label className="vnd-config-label">App Key</label>
            <input className="vnd-input" value={val("appKey")} onChange={(e) => set("appKey", e.target.value)} placeholder="Ex: 1234567890" />
          </div>
          <div className="vnd-config-campo">
            <label className="vnd-config-label">App Secret</label>
            <input className="vnd-input" type="password" value={val("appSecret")} onChange={(e) => set("appSecret", e.target.value)} placeholder="Deixe em branco para manter" />
          </div>
          <div className="vnd-config-campo">
            <label className="vnd-config-label">Conta Corrente (ID Omie)</label>
            <input className="vnd-input" value={val("contaCorrente")} onChange={(e) => set("contaCorrente", e.target.value)} placeholder="Ex: 1234567890" />
          </div>
          <div className="vnd-config-campo">
            <label className="vnd-config-label">Código Categoria Financeira</label>
            <input className="vnd-input" value={val("codigoCategoria")} onChange={(e) => set("codigoCategoria", e.target.value)} placeholder="Ex: 1.01.01" />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button
            className="loja-btn ouro"
            onClick={() => salvaMut.mutate({ ...form, ativo: ativoEfetivo })}
            disabled={salvaMut.isPending || !temAlteracao}
          >
            {salvaMut.isPending ? "Salvando…" : "Salvar configuração"}
          </button>
          <button className="loja-btn outline" onClick={testar} disabled={testando || !cfg?.configurado}>
            {testando ? "Testando…" : "Testar conexão"}
          </button>
        </div>
        {testeResp && <div style={{ marginTop: 10, fontSize: 13.5, fontWeight: 700 }}>{testeResp}</div>}
        {salvaMut.isSuccess && <div style={{ marginTop: 8, fontSize: 13, color: "#059669" }}>✅ Configuração salva!</div>}
      </div>

      {/* Sync SKU */}
      <div className="vnd-config-card">
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800 }}>Sincronizar SKU de Produtos</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 16px" }}>
          Para cada produto sem SKU Omie: busca pelo código no Omie, ou cria o produto lá e popula
          <code style={{ background: "rgb(var(--gold-rgb)/.1)", borderRadius: 4, padding: "1px 5px", marginLeft: 4 }}>sku_omie</code>.
          Produtos já mapeados são ignorados.
        </p>
        <button
          className="loja-btn ouro"
          onClick={() => syncSkuMut.mutate()}
          disabled={syncSkuMut.isPending || !cfg?.configurado}
        >
          <RefreshCw size={14} />
          {syncSkuMut.isPending ? "Sincronizando…" : "Sincronizar SKU agora"}
        </button>
        {syncSkuMut.isSuccess && (
          <div style={{ marginTop: 10, fontSize: 13 }}>
            ✅ Concluído — <b>{syncSkuMut.data.mapeados}</b> mapeados, <b>{syncSkuMut.data.criados}</b> criados no Omie,
            <b> {syncSkuMut.data.erros}</b> erros (de {syncSkuMut.data.total} produtos).
          </div>
        )}
        {syncSkuMut.isError && (
          <div className="vnd-err-box" style={{ marginTop: 10 }}>
            {syncSkuMut.error instanceof Error ? syncSkuMut.error.message : "Erro ao sincronizar"}
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────
export function VendasLoja() {
  const sessao = useSessao();
  const perfil = sessao?.perfil ?? null;
  const qc = useQueryClient();
  const podeGerenciar = pode(perfil, "loja.pedidos.gerenciar") || (perfil ? ehAdmin(perfil) : false);

  const [aba, setAba] = useState<"vendas" | "config">("vendas");
  const [filtros, setFiltros] = useState<FiltrosVendas>({ statusOmie: "todos", pagina: 1, porPagina: 30 });
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [lancandoId, setLancandoId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["omie-vendas", filtros],
    queryFn: () => omieVendas(filtros),
    refetchInterval: 30_000,
  });

  const lancarMut = useMutation({
    mutationFn: (ids: string[]) => omieLancarFiltrados({ pedidoIds: ids }),
    onSuccess: () => {
      setSelecionados(new Set());
      void qc.invalidateQueries({ queryKey: ["omie-vendas"] });
    },
  });

  const lancarUmFn = useCallback(async (id: string) => {
    setLancandoId(id);
    try {
      await omieLancarUm(id);
      void qc.invalidateQueries({ queryKey: ["omie-vendas"] });
    } finally {
      setLancandoId(null);
    }
  }, [qc]);

  const lancarSelecionados = () => {
    if (!selecionados.size) return;
    lancarMut.mutate([...selecionados]);
  };

  const lancarTodosNaoLançados = () => {
    const naoLancados = (data?.itens ?? [])
      .filter((v) => !v.omieLancamento || v.omieLancamento.status === "erro")
      .map((v) => v.id);
    if (naoLancados.length) lancarMut.mutate(naoLancados);
  };

  const setFiltro = (k: keyof FiltrosVendas, v: string | number) =>
    setFiltros((f) => ({ ...f, [k]: v, pagina: 1 }));

  // KPIs
  const kpis = useMemo(() => {
    const itens = data?.itens ?? [];
    return {
      total: data?.total ?? 0,
      lancados: itens.filter((v) => v.omieLancamento?.status === "lancado").length,
      erros: itens.filter((v) => v.omieLancamento?.status === "erro").length,
      pendentes: itens.filter((v) => !v.omieLancamento).length,
      valorTotal: itens.reduce((s, v) => s + Number(v.total), 0),
    };
  }, [data]);

  const todosSelecionados = !!data?.itens?.length && selecionados.size === data.itens.length;
  const toggleTodos = () => {
    if (todosSelecionados) setSelecionados(new Set());
    else setSelecionados(new Set(data?.itens?.map((v) => v.id)));
  };

  return (
    <div className="vnd-page">
      {/* Abas */}
      <div className="vnd-tabs">
        <button className={`vnd-tab${aba === "vendas" ? " ativo" : ""}`} onClick={() => setAba("vendas")}>
          Vendas
        </button>
        {podeGerenciar && (
          <button className={`vnd-tab${aba === "config" ? " ativo" : ""}`} onClick={() => setAba("config")}>
            <Settings size={13} style={{ marginRight: 5 }} />
            Configuração Omie
          </button>
        )}
      </div>

      {aba === "config" ? (
        <AbaConfig />
      ) : (
        <>
          {/* KPIs */}
          <div className="vnd-resumo">
            <div className="vnd-kpi">
              <div className="vnd-kpi-label">Total de vendas</div>
              <div className="vnd-kpi-valor">{data?.total ?? "—"}</div>
            </div>
            <div className="vnd-kpi">
              <div className="vnd-kpi-label">Valor total (página)</div>
              <div className="vnd-kpi-valor" style={{ fontSize: 18 }}>{fmtMoeda(kpis.valorTotal)}</div>
            </div>
            <div className="vnd-kpi">
              <div className="vnd-kpi-label"><CheckCircle2 size={12} style={{ marginRight: 4 }} />Lançadas no Omie</div>
              <div className="vnd-kpi-valor" style={{ color: "#059669" }}>{kpis.lancados}</div>
            </div>
            <div className="vnd-kpi">
              <div className="vnd-kpi-label"><Clock size={12} style={{ marginRight: 4 }} />Não lançadas</div>
              <div className="vnd-kpi-valor" style={{ color: "#d97706" }}>{kpis.pendentes}</div>
            </div>
            {kpis.erros > 0 && (
              <div className="vnd-kpi">
                <div className="vnd-kpi-label"><AlertCircle size={12} style={{ marginRight: 4 }} />Com erro</div>
                <div className="vnd-kpi-valor" style={{ color: "#dc2626" }}>{kpis.erros}</div>
              </div>
            )}
          </div>

          {/* Filtros + Ações */}
          <div className="vnd-topo">
            <div className="vnd-filtros">
              <input
                className="vnd-input"
                style={{ flex: 2, minWidth: 160 }}
                placeholder="Buscar cliente, operador…"
                value={filtros.busca ?? ""}
                onChange={(e) => setFiltro("busca", e.target.value)}
              />
              <select className="vnd-select" value={filtros.status ?? ""} onChange={(e) => setFiltro("status", e.target.value)}>
                <option value="">Todos os status</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="NA_FILA">Na fila</option>
                <option value="EM_PREPARACAO">Preparando</option>
                <option value="PRONTO">Pronto</option>
                <option value="RETIRADO">Retirado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
              <select className="vnd-select" value={filtros.statusOmie ?? "todos"} onChange={(e) => setFiltro("statusOmie", e.target.value)}>
                <option value="todos">Omie: todos</option>
                <option value="pendente">Não lançados</option>
                <option value="lancado">Lançados</option>
                <option value="erro">Com erro</option>
              </select>
              <input
                className="vnd-input"
                type="date"
                value={filtros.dataInicio ?? ""}
                onChange={(e) => setFiltro("dataInicio", e.target.value)}
                title="Data inicial"
              />
              <input
                className="vnd-input"
                type="date"
                value={filtros.dataFim ?? ""}
                onChange={(e) => setFiltro("dataFim", e.target.value)}
                title="Data final"
              />
            </div>
            {podeGerenciar && (
              <div className="vnd-acoes">
                {selecionados.size > 0 && (
                  <button className="loja-btn ouro" onClick={lancarSelecionados} disabled={lancarMut.isPending}>
                    <Upload size={14} />
                    Lançar {selecionados.size} selecionada{selecionados.size !== 1 ? "s" : ""}
                  </button>
                )}
                <button className="loja-btn ouro" onClick={lancarTodosNaoLançados} disabled={lancarMut.isPending || !kpis.pendentes}>
                  <Link2 size={14} />
                  {lancarMut.isPending ? "Lançando…" : `Lançar todas não lançadas (${kpis.pendentes})`}
                </button>
              </div>
            )}
          </div>

          {lancarMut.isSuccess && (
            <div style={{ background: "rgb(16 185 129/.1)", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#059669" }}>
              ✅ {lancarMut.data.lancados} lançada{lancarMut.data.lancados !== 1 ? "s" : ""} com sucesso
              {lancarMut.data.erros > 0 && `, ${lancarMut.data.erros} com erro`}
            </div>
          )}

          {/* Tabela */}
          <div className="vnd-card">
            <div className="vnd-tabela-wrap">
              <table className="vnd-tabela">
                <thead>
                  <tr>
                    {podeGerenciar && (
                      <th style={{ width: 36 }}>
                        <input type="checkbox" checked={todosSelecionados} onChange={toggleTodos} title="Selecionar todos" />
                      </th>
                    )}
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Itens</th>
                    <th>Total</th>
                    <th>Status Pedido</th>
                    <th>Status Omie</th>
                    <th>Data</th>
                    {podeGerenciar && <th>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={9} className="vnd-vazio">Carregando…</td></tr>
                  ) : !data?.itens?.length ? (
                    <tr><td colSpan={9} className="vnd-vazio">
                      <Package size={32} style={{ opacity: .3, marginBottom: 8 }} />
                      <br />Nenhuma venda encontrada
                    </td></tr>
                  ) : data.itens.map((v) => (
                    <tr key={v.id}>
                      {podeGerenciar && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selecionados.has(v.id)}
                            onChange={(e) => {
                              setSelecionados((s) => {
                                const n = new Set(s);
                                e.target.checked ? n.add(v.id) : n.delete(v.id);
                                return n;
                              });
                            }}
                          />
                        </td>
                      )}
                      <td>
                        <div className="vnd-num">#{v.numero}</div>
                        <div className="vnd-canal">{CANAL_LABEL[v.canal] ?? v.canal}</div>
                      </td>
                      <td>
                        <div className="vnd-cliente">{v.clienteNome || "—"}</div>
                        {v.operadorNome && <div className="vnd-canal">op: {v.operadorNome}</div>}
                        {v.operacao && <div className="vnd-canal">{v.operacao.nome}</div>}
                      </td>
                      <td>
                        <div className="vnd-itens-lista">
                          {v.itens.slice(0, 2).map((it, i) => (
                            <div key={i} style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>{Number(it.quantidade).toFixed(0)}×</span>
                              <span style={{ fontSize: 12 }}>{it.descricao}</span>
                              <span className="vnd-sku">{it.produto.skuOmie ?? it.produto.sku ?? ""}</span>
                            </div>
                          ))}
                          {v.itens.length > 2 && <div style={{ fontSize: 11, color: "var(--muted)" }}>+{v.itens.length - 2} mais</div>}
                        </div>
                      </td>
                      <td><div className="vnd-total">{fmtMoeda(v.total)}</div></td>
                      <td><BadgeStatus s={v.status} /></td>
                      <td>
                        <BadgeOmie s={v.omieLancamento?.status} num={v.omieLancamento?.omieNumero} />
                        {v.omieLancamento?.erro && (
                          <div className="vnd-err-box" style={{ marginTop: 4, fontSize: 11 }} title={v.omieLancamento.erro}>
                            {v.omieLancamento.erro.slice(0, 80)}{v.omieLancamento.erro.length > 80 ? "…" : ""}
                          </div>
                        )}
                      </td>
                      <td><div className="vnd-data">{fmtData(v.criadoEm)}</div></td>
                      {podeGerenciar && (
                        <td>
                          <div className="vnd-acoes-col">
                            {(!v.omieLancamento || v.omieLancamento.status === "erro") && (
                              <button
                                className="vnd-btn lançar"
                                onClick={() => lancarUmFn(v.id)}
                                disabled={lancandoId === v.id}
                                title="Lançar no Omie"
                              >
                                {lancandoId === v.id ? "…" : <><Upload size={12} /> Omie</>}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {(data?.totalPaginas ?? 0) > 1 && (
              <div className="vnd-pag">
                <span>{data?.total} venda{data?.total !== 1 ? "s" : ""} • página {data?.pagina} de {data?.totalPaginas}</span>
                <div className="vnd-pag-btns">
                  <button
                    className="vnd-pag-btn"
                    disabled={!filtros.pagina || filtros.pagina <= 1}
                    onClick={() => setFiltro("pagina", (filtros.pagina ?? 1) - 1)}
                  ><ChevronLeft size={14} /></button>
                  <button
                    className="vnd-pag-btn"
                    disabled={(filtros.pagina ?? 1) >= (data?.totalPaginas ?? 1)}
                    onClick={() => setFiltro("pagina", (filtros.pagina ?? 1) + 1)}
                  ><ChevronRight size={14} /></button>
                </div>
              </div>
            )}

            {isFetching && !isLoading && (
              <div style={{ fontSize: 11, color: "var(--muted)", padding: "4px 16px" }}>Atualizando…</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
