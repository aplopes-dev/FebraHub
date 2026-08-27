"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight, Barcode, Boxes, CheckCircle2, Copy, ImageOff, Layers, Link2, Loader2,
  PackageCheck, Pencil, Plus, RefreshCw, Search, SlidersHorizontal, Tag, Trash2, Upload, X, ZoomIn,
} from "lucide-react";
import {
  lojaAjustarEstoque, lojaAlterarPreco, lojaAtualizarCodigoBarras, lojaAtualizarProduto, lojaCategorias,
  lojaCriarProduto, lojaEnriquecerEanLote, lojaEnviarImagemProduto, lojaIndicadores, lojaInativarProduto,
  lojaMovimentos, lojaProduto, lojaProdutos, lojaTransferirEstoque, lojaConsultarEanOnline,
  type EnriquecimentoLote,
} from "@/services/api/loja-produtos";
import { omieVincularProdutos, type VinculoOmieResp } from "@/services/api/omie";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import type { LojaLocal, LojaProduto, ProdutoInput } from "@/types/loja-produtos";
import { GestaoCategorias } from "@/components/loja/GestaoCategorias";
import { Select } from "@/components/ui/Select";
import "@/app/loja.css";

const brl = (n: number | string) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (n: number | string) => Number(n).toLocaleString("pt-BR");
const NOME_LOCAL: Record<LojaLocal, string> = { LOJA: "Loja", DEPOSITO: "Depósito" };

export function CatalogoLoja() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao());
  const podeGerir = pode(perfil.data, "loja.produtos.gerenciar");
  const podePreco = podeGerir || pode(perfil.data, "loja.produtos.preco");

  const [busca, setBusca] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [situacao, setSituacao] = useState("ativos");
  // editar: null=fechado, "novo"=criar, "duplicar:ID"=duplicar, LojaProduto=editar
  const [editar, setEditar] = useState<LojaProduto | null | "novo" | { duplicar: LojaProduto }>(null);
  const [estoque, setEstoque] = useState<LojaProduto | null>(null);
  const [preco, setPreco] = useState<LojaProduto | null>(null);
  const [gerirCategorias, setGerirCategorias] = useState(false);
  const [loteResultado, setLoteResultado] = useState<EnriquecimentoLote | null>(null);
  const [vinculoOmie, setVinculoOmie] = useState<VinculoOmieResp | null>(null);

  // Deep-link vindo do PDV: /loja/produtos?editar=<produtoId> abre o modal de edição.
  const router = useRouter();
  const params = useSearchParams();
  const editarId = params.get("editar");
  const [deepLinkFeito, setDeepLinkFeito] = useState(false);
  const deepLinkProduto = useQuery({
    queryKey: ["loja", "produto", editarId],
    queryFn: () => lojaProduto(editarId as string),
    enabled: !!editarId && !deepLinkFeito,
  });
  useEffect(() => {
    if (editarId && !deepLinkFeito && deepLinkProduto.data) {
      setEditar(deepLinkProduto.data);
      setDeepLinkFeito(true);
      router.replace("/loja/produtos");
    }
  }, [editarId, deepLinkFeito, deepLinkProduto.data, router]);

  const ind = useQuery({ queryKey: ["loja", "indicadores"], queryFn: lojaIndicadores });
  const cats = useQuery({ queryKey: ["loja", "categorias"], queryFn: lojaCategorias });
  const prods = useQuery({
    queryKey: ["loja", "produtos", busca, categoriaId, situacao],
    queryFn: () => lojaProdutos({ busca: busca || undefined, categoriaId: categoriaId || undefined, situacao }),
  });

  const i = ind.data;
  const invalidar = () => qc.invalidateQueries({ queryKey: ["loja"] });

  const enriquecerLote = useMutation({
    mutationFn: lojaEnriquecerEanLote,
    onSuccess: (r) => { setLoteResultado(r); invalidar(); },
  });

  // Vincula os produtos da Loja aos do Omie por codigo_produto_integracao
  // (chave imutável recomendada pela Omie). Idempotente.
  const vincularOmie = useMutation({
    mutationFn: omieVincularProdutos,
    onSuccess: (r) => { setVinculoOmie(r); invalidar(); },
  });

  return (
    <main className="loja-page">
      <header className="loja-hero loja-hero-compacto">
        <div>
          <span className="tag">LOJA · CATÁLOGO E ESTOQUE</span>
          <p>Cadastro único para PDV e Cardápio, com saldo dividido entre Loja e Depósito.</p>
        </div>
        {podeGerir && (
          <div className="acoes">
            <button className="loja-btn" onClick={() => setGerirCategorias(true)}><Layers size={15} /> Categorias</button>
            <button
              className="loja-btn"
              title="Varre produtos com SKU numérico (EAN-8/13) e preenche o código de barras consultando Open Food Facts"
              disabled={enriquecerLote.isPending}
              onClick={() => enriquecerLote.mutate()}
            >
              {enriquecerLote.isPending ? <Loader2 size={15} className="girando" /> : <Barcode size={15} />}
              {enriquecerLote.isPending ? "Consultando EANs…" : "Atualizar EANs"}
            </button>
            <button
              className="loja-btn"
              title="Vincula todos os produtos ao Omie pelo código de integração (codigo_produto_integracao) — cria no Omie os que ainda não existem"
              disabled={vincularOmie.isPending}
              onClick={() => vincularOmie.mutate()}
            >
              {vincularOmie.isPending ? <Loader2 size={15} className="girando" /> : <Link2 size={15} />}
              {vincularOmie.isPending ? "Vinculando ao Omie…" : "Vincular ao Omie"}
            </button>
            <button className="loja-btn ouro" onClick={() => setEditar("novo")}><Plus size={15} /> Novo produto</button>
          </div>
        )}
      </header>

      <section className="loja-kpis">
        <article><small>PRODUTOS ATIVOS</small><b>{i?.ativos ?? 0}</b><span>de {i?.totalProdutos ?? 0} cadastrados</span></article>
        <article><small>CATEGORIAS</small><b>{i?.categorias ?? 0}</b><span>ativas</span></article>
        {(i?.porLocal ?? []).map((l) => (
          <article key={l.local}><small>SALDO · {NOME_LOCAL[l.local].toUpperCase()}</small><b>{num(l.saldoFisico)}</b><span>{num(l.reservado)} reservado</span></article>
        ))}
        <article><small>ESTOQUE BAIXO</small><b className={i?.abaixoMinimo ? "down" : ""}>{i?.abaixoMinimo ?? 0}</b><span>abaixo do mínimo</span></article>
      </section>

      <section className="loja-card">
        <header>
          <label className="loja-busca"><Search size={15} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, SKU ou código de barras" /></label>
          <div className="loja-filtros">
            <Select className="loja-select" aria-label="Situação" value={situacao} onChange={setSituacao} style={{ minWidth: 120 }}
              options={[{ value: "ativos", label: "Ativos" }, { value: "inativos", label: "Inativos" }, { value: "todos", label: "Todos" }]} />
            <button className={`loja-chip ${!categoriaId ? "ativo" : ""}`} onClick={() => setCategoriaId("")}>Todas</button>
            {(cats.data ?? []).filter((c) => c.ativo).map((c) => (
              <button key={c.id} className={`loja-chip ${categoriaId === c.id ? "ativo" : ""}`} onClick={() => setCategoriaId(c.id)}>{c.nome}</button>
            ))}
          </div>
        </header>

        <table className="loja-table">
          <thead>
            <tr>
              <th></th><th>Produto</th><th>Categoria</th><th className="num">Preço</th>
              <th>Código de barras</th>
              <th>Estoque (Loja / Depósito)</th><th>Flags</th>{(podeGerir || podePreco) && <th></th>}
            </tr>
          </thead>
          <tbody>
            {(prods.data ?? []).map((p) => {
              const baixo = p.controlaEstoque && Number(p.estoqueMinimo) > 0 && p.estoque.saldoTotal < Number(p.estoqueMinimo);
              return (
                <tr key={p.id}>
                  <td>{p.imagemUrl ? <img className="loja-thumb" src={p.imagemUrl} alt="" /> : <div className="loja-thumb" />}</td>
                  <td className="nome"><b>{p.nome}</b><small>{p.sku || "sem SKU"}</small></td>
                  <td>{p.categoria?.nome ?? "—"}</td>
                  <td className="num">{brl(p.preco)}</td>
                  <td>
                    {p.codigoBarras ? (
                      <span className="loja-ean-chip"><Barcode size={11} />{p.codigoBarras}</span>
                    ) : (
                      <span className="loja-ean-chip vazio">—</span>
                    )}
                  </td>
                  <td>
                    <div className="loja-locais">
                      {(["LOJA", "DEPOSITO"] as LojaLocal[]).map((loc) => (
                        <span key={loc} className="loja-local"><b>{num(p.estoque.porLocal[loc].disponivel)}</b><small>{NOME_LOCAL[loc]}</small></span>
                      ))}
                      {baixo && <span className="loja-badge baixo" style={{ alignSelf: "center" }}>baixo</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`loja-badge ${p.ativo ? "on" : "off"}`}>{p.ativo ? "ativo" : "inativo"}</span>{" "}
                    {p.emDestaque && <span className="loja-badge destaque" title="Destaque no cardápio">⭐ destaque</span>}{" "}
                    {p.precisaPreparacao && <span className="loja-badge prep">preparo</span>}{" "}
                    {p.vendeSemEstoque && <span className="loja-badge prep" title="Vende mesmo sem estoque">s/ limite</span>}{" "}
                    {!p.vendePdv && <span className="loja-badge off">s/ PDV</span>}{" "}
                    {!p.exibeCardapio && <span className="loja-badge off">s/ cardápio</span>}
                  </td>
                  {(podeGerir || podePreco) && (
                    <td className="num">
                      <div className="loja-acoes-linha">
                        {podePreco && <button className="loja-btn mini" onClick={() => setPreco(p)} title="Alterar preço"><Tag size={13} /></button>}
                        {podeGerir && <button className="loja-btn mini" onClick={() => setEstoque(p)} title="Estoque"><Boxes size={13} /></button>}
                        {podeGerir && <button className="loja-btn mini" onClick={() => setEditar({ duplicar: p })} title="Duplicar produto"><Copy size={13} /></button>}
                        {podeGerir && <button className="loja-btn mini" onClick={() => setEditar(p)} title="Editar"><Pencil size={13} /></button>}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {prods.isError && <p className="loja-empty" style={{ color: "var(--down)" }}>Não foi possível carregar os produtos. Verifique sua conexão e tente novamente.</p>}
        {!prods.isLoading && !prods.isError && !(prods.data ?? []).length && <p className="loja-empty">Nenhum produto encontrado neste filtro.</p>}
      </section>

      {editar && (
        <ModalProduto
          produto={editar === "novo" ? null : "duplicar" in editar ? null : editar}
          duplicarDe={"duplicar" in (editar as object) ? (editar as { duplicar: LojaProduto }).duplicar : undefined}
          aoFechar={() => setEditar(null)}
          aoSalvar={() => { setEditar(null); invalidar(); }}
        />
      )}
      {estoque && <ModalEstoque produto={estoque} aoFechar={() => setEstoque(null)} aoMudar={() => invalidar()} />}
      {preco && <ModalPreco produto={preco} aoFechar={() => setPreco(null)} aoSalvar={() => { setPreco(null); invalidar(); }} />}
      {gerirCategorias && <GestaoCategorias aoFechar={() => { setGerirCategorias(false); invalidar(); }} />}
      {loteResultado && (
        <ModalLoteEan resultado={loteResultado} aoFechar={() => setLoteResultado(null)} />
      )}
      {vinculoOmie && (
        <ModalVinculoOmie resultado={vinculoOmie} aoFechar={() => setVinculoOmie(null)} />
      )}
    </main>
  );
}

// ==================== LIGHTBOX ====================
function Lightbox({ src, aoFechar }: { src: string; aoFechar: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") aoFechar(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [aoFechar]);
  return (
    <div
      className="loja-lightbox-bg"
      onClick={aoFechar}
      title="Clique ou Esc para fechar"
    >
      <button className="loja-lightbox-fechar" onClick={aoFechar} title="Fechar"><X size={20} /></button>
      <img
        src={src}
        alt="Imagem do produto"
        className="loja-lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ==================== UPLOADER DE IMAGEM ====================
function UploaderImagem({ valor, aoMudar }: { valor: string; aoMudar: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [previa, setPrevia] = useState<string>(valor);
  const [lightbox, setLightbox] = useState(false);

  // Sincroniza prévia quando valor externo muda (ex: abrir modal com produto existente)
  useEffect(() => { setPrevia(valor); }, [valor]);

  async function processar(arquivo: File) {
    setErro(null);
    // Mostra prévia local imediatamente
    const urlLocal = URL.createObjectURL(arquivo);
    setPrevia(urlLocal);
    setEnviando(true);
    try {
      URL.revokeObjectURL(urlLocal);
      const { url } = await lojaEnviarImagemProduto(arquivo, arquivo.name || "produto.png");
      setPrevia(url);
      aoMudar(url);
    } catch (e) {
      URL.revokeObjectURL(urlLocal);
      setPrevia(valor); // volta à imagem anterior
      setErro(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label>Imagem do produto</label>
      <div className="loja-uploader">
        <div
          className={`loja-uploader-preview ${previa ? "" : "vazio"}`}
          onClick={() => {
            if (enviando) return;
            if (previa) setLightbox(true); // clicou na imagem → lightbox
            else inputRef.current?.click(); // sem imagem → abre file picker
          }}
          style={{ cursor: enviando ? "wait" : previa ? "zoom-in" : "pointer" }}
          title={previa ? "Clique para ampliar a imagem" : "Clique para enviar uma imagem"}
        >
          {previa ? (
            <>
              <img
                src={previa}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "100%" }}
                onError={() => setPrevia("")}
              />
              {/* Ícone de zoom sobreposto */}
              <div className="loja-uploader-zoom-hint">
                <ZoomIn size={18} />
              </div>
            </>
          ) : (
            <span className="loja-uploader-status"><ImageOff size={20} /> Sem imagem — clique para enviar</span>
          )}
          {enviando && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.45)", borderRadius: "inherit" }}>
              <Loader2 size={28} className="girando" style={{ color: "#fff" }} />
            </div>
          )}
        </div>
        <div className="loja-uploader-acoes">
          <button type="button" className="loja-btn mini" disabled={enviando} onClick={() => inputRef.current?.click()}>
            <Upload size={13} /> {previa ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {previa && (
            <button type="button" className="loja-btn mini" disabled={enviando} onClick={() => { setPrevia(""); aoMudar(""); }}>
              <Trash2 size={13} /> Remover
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => { const arq = e.target.files?.[0]; if (arq) void processar(arq); }}
        />
      </div>
      {erro && <p className="loja-uploader-erro">{erro}</p>}
      {lightbox && previa && <Lightbox src={previa} aoFechar={() => setLightbox(false)} />}
    </div>
  );
}

// ==================== MODAL PRODUTO ====================
function ModalProduto({
  produto,
  duplicarDe,
  aoFechar,
  aoSalvar,
}: {
  produto: LojaProduto | null;
  duplicarDe?: LojaProduto;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const cats = useQuery({ queryKey: ["loja", "categorias"], queryFn: lojaCategorias });
  const qc = useQueryClient();

  // Quando duplicarDe está presente, pré-preenche o form a partir do original
  // mas sem o ID (cria novo), com nome prefixado para evitar duplicata visível.
  const base = duplicarDe ?? produto;
  const [f, setF] = useState<ProdutoInput & { ativo: boolean }>(() => ({
    nome: duplicarDe ? `Cópia de ${duplicarDe.nome}` : (produto?.nome ?? ""),
    sku: duplicarDe ? "" : (produto?.sku ?? ""),  // SKU deve ser único — limpa na cópia
    codigoBarras: duplicarDe ? "" : (produto?.codigoBarras ?? ""),  // EAN único — limpa na cópia
    descricao: base?.descricao ?? "",
    imagemUrl: base?.imagemUrl ?? "",
    categoriaId: base?.categoriaId ?? "",
    preco: base ? Number(base.preco) : 0,
    custo: base?.custo ? Number(base.custo) : undefined,
    unidade: base?.unidade ?? "un",
    ativo: base?.ativo ?? true,
    vendePdv: base?.vendePdv ?? true,
    exibeCardapio: base?.exibeCardapio ?? true,
    precisaPreparacao: base?.precisaPreparacao ?? false,
    controlaEstoque: base?.controlaEstoque ?? true,
    vendeSemEstoque: base?.vendeSemEstoque ?? false,
    emDestaque: base?.emDestaque ?? false,
    estoqueMinimo: base ? Number(base.estoqueMinimo) : 0,
  }));
  const [erro, setErro] = useState<string | null>(null);
  const [eanStatus, setEanStatus] = useState<"" | "buscando" | "ok" | "nao_encontrado">(""); 
  const [eanModo, setEanModo] = useState(false);
  // Aba estoque inline (só disponível em modo edição/não-duplicar)
  const [abaEstoque, setAbaEstoque] = useState(false);
  const eanRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const isDuplicar = !!duplicarDe;
  const titulo = isDuplicar ? "Duplicar produto" : produto ? "Editar produto" : "Novo produto";

  useEffect(() => { if (eanModo) eanRef.current?.focus(); }, [eanModo]);

  const buscarEanOnline = useMutation({
    mutationFn: () => lojaConsultarEanOnline(f.codigoBarras ?? ""),
    onSuccess: (dados) => {
      if (dados) {
        if (!f.nome.trim()) set("nome", dados.nome);
        if (!f.descricao?.trim() && dados.descricao) set("descricao", dados.descricao);
        setEanStatus("ok");
      } else {
        setEanStatus("nao_encontrado");
      }
    },
    onError: () => setEanStatus("nao_encontrado"),
  });

  const salvar = useMutation({
    mutationFn: () => {
      const payload: ProdutoInput = { ...f, categoriaId: f.categoriaId || null };
      // Duplicar e criar novo: sempre POST
      return produto && !isDuplicar ? lojaAtualizarProduto(produto.id, payload) : lojaCriarProduto(payload);
    },
    onSuccess: aoSalvar,
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao salvar o produto."),
  });
  const inativar = useMutation({ mutationFn: () => lojaInativarProduto(produto!.id), onSuccess: aoSalvar });

  const invalidarEstoque = () => qc.invalidateQueries({ queryKey: ["loja"] });

  return (
    <div className="loja-modal-bg" onClick={aoFechar}>
      <div className="loja-modal lg" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0 }}>
            {isDuplicar && <Copy size={16} style={{ verticalAlign: "-3px", marginRight: 7 }} />}
            {titulo}
          </h3>
          {/* Abas: Dados | Estoque (só em edição de produto existente) */}
          {produto && !isDuplicar && (
            <div className="loja-filtros" style={{ margin: 0 }}>
              <button className={`loja-chip ${!abaEstoque ? "ativo" : ""}`} onClick={() => setAbaEstoque(false)}>Dados</button>
              <button className={`loja-chip ${abaEstoque ? "ativo" : ""}`} onClick={() => setAbaEstoque(true)}><Boxes size={12} /> Estoque</button>
            </div>
          )}
        </div>

        {/* ===== ABA ESTOQUE INLINE ===== */}
        {abaEstoque && produto && (
          <EstoqueInline produto={{ ...produto, estoque: produto.estoque }} aoMudar={invalidarEstoque} />
        )}

        {/* ===== ABA DADOS ===== */}
        {!abaEstoque && (
          <>
            <label>Nome</label>
            <input className="loja-input" value={f.nome} onChange={(e) => set("nome", e.target.value)} autoFocus={!eanModo} />
            <div className="loja-grid3">
              <div><label>SKU</label><input className="loja-input" value={f.sku} onChange={(e) => set("sku", e.target.value)} /></div>
              <div>
                <label>
                  Código de barras (EAN)
                  <button
                    type="button"
                    className={`loja-btn mini ${eanModo ? "ouro" : ""}`}
                    style={{ marginLeft: 6, verticalAlign: "middle" }}
                    title={eanModo ? "Modo scanner ativo — bipe o produto" : "Ativar modo scanner"}
                    onClick={() => { setEanModo((m) => !m); setEanStatus(""); }}
                  >
                    <Barcode size={12} /> {eanModo ? "Bipando…" : "Scanner"}
                  </button>
                </label>
                <div className="loja-ean-row">
                  <input
                    ref={eanRef}
                    className={`loja-input ${eanStatus === "ok" ? "ean-ok" : eanStatus === "nao_encontrado" ? "ean-err" : ""}`}
                    value={f.codigoBarras ?? ""}
                    placeholder={eanModo ? "Bipe o código de barras…" : "EAN-8 / EAN-13 / Code128"}
                    onChange={(e) => { set("codigoBarras", e.target.value); setEanStatus(""); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (f.codigoBarras ?? "").trim()) {
                        e.preventDefault();
                        setEanModo(false);
                        if (/^\d{8}$|^\d{13}$/.test((f.codigoBarras ?? "").trim())) {
                          setEanStatus("buscando");
                          buscarEanOnline.mutate();
                        }
                      }
                    }}
                  />
                  {(f.codigoBarras ?? "").trim() && /^\d{8}$|^\d{13}$/.test((f.codigoBarras ?? "").trim()) && (
                    <button
                      type="button"
                      className="loja-btn mini"
                      disabled={eanStatus === "buscando"}
                      title="Consultar este EAN na internet (Open Food Facts)"
                      onClick={() => { setEanStatus("buscando"); buscarEanOnline.mutate(); }}
                    >
                      {eanStatus === "buscando" ? <Loader2 size={12} className="girando" /> : <RefreshCw size={12} />}
                    </button>
                  )}
                </div>
                {eanStatus === "ok" && <p className="loja-ean-hint ok"><CheckCircle2 size={11} /> Dados preenchidos via EAN online</p>}
                {eanStatus === "nao_encontrado" && <p className="loja-ean-hint err">EAN não encontrado nas bases públicas</p>}
              </div>
              <div>
                <label>Unidade</label>
                <Select className="loja-select" aria-label="Unidade" value={f.unidade ?? "un"} onChange={(v) => set("unidade", v)}
                  options={["un", "kg", "g", "l", "ml", "cx", "pct"].map((u) => ({ value: u, label: u }))} />
              </div>
            </div>

            <div className="loja-grid2">
              <div>
                <label>Preço de venda (R$)</label>
                <input className="loja-input" type="number" min={0} step="0.01" value={f.preco} onChange={(e) => set("preco", Number(e.target.value))} />
              </div>
              <div>
                <label>Custo (R$)</label>
                <input className="loja-input" type="number" min={0} step="0.01" value={f.custo ?? ""} onChange={(e) => set("custo", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </div>

            <div className="loja-grid2">
              <div>
                <label>Categoria</label>
                <Select className="loja-select" aria-label="Categoria" value={f.categoriaId ?? ""} onChange={(v) => set("categoriaId", v)}
                  options={[{ value: "", label: "Sem categoria" }, ...(cats.data ?? []).filter((c) => c.ativo).map((c) => ({ value: c.id, label: c.nome }))]} />
              </div>
              <div>
                <label>Estoque mínimo</label>
                <input className="loja-input" type="number" min={0} step="0.001" value={f.estoqueMinimo} onChange={(e) => set("estoqueMinimo", Number(e.target.value))} />
              </div>
            </div>

            <label>Descrição</label>
            <textarea className="loja-input loja-textarea" value={f.descricao} onChange={(e) => set("descricao", e.target.value)} />

            <UploaderImagem valor={f.imagemUrl ?? ""} aoMudar={(url) => set("imagemUrl", url)} />

            <div className="loja-flags">
              <label className="loja-flag"><input type="checkbox" checked={f.ativo} onChange={(e) => set("ativo", e.target.checked)} /> Ativo</label>
              <label className="loja-flag"><input type="checkbox" checked={f.vendePdv} onChange={(e) => set("vendePdv", e.target.checked)} /> Vende no PDV</label>
              <label className="loja-flag"><input type="checkbox" checked={f.exibeCardapio} onChange={(e) => set("exibeCardapio", e.target.checked)} /> Exibe no Cardápio</label>
              <label className="loja-flag loja-flag-destaque" title="O produto aparece na seção Destaques (carrossel topo) do cardápio digital">
                <input type="checkbox" checked={f.emDestaque ?? false} onChange={(e) => set("emDestaque", e.target.checked)} />
                ⭐ Destaque no Cardápio
              </label>
              <label className="loja-flag"><input type="checkbox" checked={f.precisaPreparacao} onChange={(e) => set("precisaPreparacao", e.target.checked)} /> Precisa de preparação</label>
              <label className="loja-flag"><input type="checkbox" checked={f.controlaEstoque} onChange={(e) => set("controlaEstoque", e.target.checked)} /> Controla estoque</label>
              <label className="loja-flag" title="Permite vender mesmo quando o saldo disponível for zero">
                <input type="checkbox" checked={f.vendeSemEstoque ?? false} onChange={(e) => set("vendeSemEstoque", e.target.checked)} />
                Vende sem estoque
              </label>
            </div>

            {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 10 }}>{erro}</p>}
            <div className="fim">
              {produto && produto.ativo && !isDuplicar && (
                <button className="loja-btn perigo" style={{ marginRight: "auto" }} disabled={inativar.isPending} onClick={() => inativar.mutate()}>Inativar</button>
              )}
              <button className="loja-btn" onClick={aoFechar}>Cancelar</button>
              <button className="loja-btn ouro" disabled={salvar.isPending || !f.nome} onClick={() => { setErro(null); salvar.mutate(); }}>
                {salvar.isPending ? "Salvando…" : isDuplicar ? "Criar cópia" : "Salvar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==================== ESTOQUE INLINE (dentro do modal de produto) ====================
function EstoqueInline({ produto, aoMudar }: { produto: LojaProduto; aoMudar: () => void }) {
  const [tab, setTab] = useState<"ajuste" | "transferencia" | "historico">("ajuste");
  const [local, setLocal] = useState<LojaLocal>("LOJA");
  const [tipo, setTipo] = useState<"entrada" | "saida" | "inventario">("entrada");
  const [qtd, setQtd] = useState("");
  const [obs, setObs] = useState("");
  const [origem, setOrigem] = useState<LojaLocal>("DEPOSITO");
  const [destino, setDestino] = useState<LojaLocal>("LOJA");
  const [erro, setErro] = useState<string | null>(null);
  const qc = useQueryClient();

  // Recarrega dados do produto para refletir saldo após operação
  const prods = useQuery({
    queryKey: ["loja", "produto-inline", produto.id],
    queryFn: () => lojaProdutos({ busca: produto.nome }),
    staleTime: 0,
  });
  // Usa saldo do produto passado como prop (ou atualizado)
  const saldoAtual = (prods.data ?? []).find((p) => p.id === produto.id) ?? produto;

  const movs = useQuery({ queryKey: ["loja", "movs", produto.id], queryFn: () => lojaMovimentos(produto.id), enabled: tab === "historico" });

  const ajustar = useMutation({
    mutationFn: () => lojaAjustarEstoque(produto.id, { local, tipo, quantidade: Number(qtd) || 0, observacao: obs || undefined }),
    onSuccess: () => { setQtd(""); setObs(""); qc.invalidateQueries({ queryKey: ["loja"] }); aoMudar(); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha no ajuste."),
  });
  const transferir = useMutation({
    mutationFn: () => lojaTransferirEstoque(produto.id, { origem, destino, quantidade: Number(qtd) || 0, observacao: obs || undefined }),
    onSuccess: () => { setQtd(""); setObs(""); qc.invalidateQueries({ queryKey: ["loja"] }); aoMudar(); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha na transferência."),
  });

  return (
    <div>
      <div className="loja-locais" style={{ marginBottom: 12 }}>
        {(["LOJA", "DEPOSITO"] as LojaLocal[]).map((loc) => (
          <article key={loc} className="loja-card" style={{ flex: 1, padding: 12 }}>
            <small style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>{NOME_LOCAL[loc].toUpperCase()}</small>
            <b style={{ display: "block", fontSize: 22 }}>{num(saldoAtual.estoque.porLocal[loc].disponivel)}</b>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              {num(saldoAtual.estoque.porLocal[loc].saldoFisico)} físico · {num(saldoAtual.estoque.porLocal[loc].reservado)} reservado
            </span>
          </article>
        ))}
      </div>

      <div className="loja-filtros" style={{ marginBottom: 12 }}>
        <button className={`loja-chip ${tab === "ajuste" ? "ativo" : ""}`} onClick={() => setTab("ajuste")}><SlidersHorizontal size={12} /> Ajustar</button>
        <button className={`loja-chip ${tab === "transferencia" ? "ativo" : ""}`} onClick={() => setTab("transferencia")}><ArrowLeftRight size={12} /> Transferir</button>
        <button className={`loja-chip ${tab === "historico" ? "ativo" : ""}`} onClick={() => setTab("historico")}><PackageCheck size={12} /> Histórico</button>
      </div>

      {tab === "ajuste" && (
        <>
          <div className="loja-grid2">
            <div><label>Local</label><Select className="loja-select" aria-label="Local" value={local} onChange={(v) => setLocal(v as LojaLocal)} options={[{ value: "LOJA", label: "Loja" }, { value: "DEPOSITO", label: "Depósito" }]} /></div>
            <div><label>Tipo</label><Select className="loja-select" aria-label="Tipo" value={tipo} onChange={(v) => setTipo(v as typeof tipo)} options={[{ value: "entrada", label: "Entrada (+)" }, { value: "saida", label: "Saída (−)" }, { value: "inventario", label: "Inventário (define saldo)" }]} /></div>
          </div>
          <label>{tipo === "inventario" ? "Saldo contado" : "Quantidade"}</label>
          <input className="loja-input" type="number" min={0} step="0.001" value={qtd} onChange={(e) => setQtd(e.target.value)} autoFocus />
          <label>Observação</label>
          <input className="loja-input" value={obs} onChange={(e) => setObs(e.target.value)} />
          {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
          <div className="fim" style={{ marginBottom: 0 }}>
            <button className="loja-btn ouro" disabled={ajustar.isPending || !qtd} onClick={() => { setErro(null); ajustar.mutate(); }}>Aplicar</button>
          </div>
        </>
      )}

      {tab === "transferencia" && (
        <>
          <div className="loja-grid2">
            <div><label>De</label><Select className="loja-select" aria-label="Origem" value={origem} onChange={(v) => setOrigem(v as LojaLocal)} options={[{ value: "LOJA", label: "Loja" }, { value: "DEPOSITO", label: "Depósito" }]} /></div>
            <div><label>Para</label><Select className="loja-select" aria-label="Destino" value={destino} onChange={(v) => setDestino(v as LojaLocal)} options={[{ value: "LOJA", label: "Loja" }, { value: "DEPOSITO", label: "Depósito" }]} /></div>
          </div>
          <label>Quantidade</label>
          <input className="loja-input" type="number" min={0.001} step="0.001" value={qtd} onChange={(e) => setQtd(e.target.value)} autoFocus />
          <label>Observação</label>
          <input className="loja-input" value={obs} onChange={(e) => setObs(e.target.value)} />
          {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
          <div className="fim" style={{ marginBottom: 0 }}>
            <button className="loja-btn ouro" disabled={transferir.isPending || !qtd || origem === destino} onClick={() => { setErro(null); transferir.mutate(); }}>Transferir</button>
          </div>
        </>
      )}

      {tab === "historico" && (
        <div className="loja-mov">
          {(movs.data ?? []).map((m) => (
            <div key={m.id} className="linha">
              <div><b>{m.tipo}</b> · {NOME_LOCAL[m.local as LojaLocal]} <small style={{ display: "block" }}>{m.observacao || m.origem}</small></div>
              <div style={{ textAlign: "right" }}><b style={{ color: Number(m.quantidade) < 0 ? "var(--down)" : "var(--up)" }}>{Number(m.quantidade) > 0 ? "+" : ""}{num(m.quantidade)}</b><small style={{ display: "block" }}>{new Date(m.criadoEm).toLocaleString("pt-BR")}</small></div>
            </div>
          ))}
          {movs.isError && <p className="loja-empty" style={{ color: "var(--down)" }}>Não foi possível carregar o histórico.</p>}
          {!movs.isLoading && !movs.isError && !(movs.data ?? []).length && <p className="loja-empty">Sem movimentações ainda.</p>}
        </div>
      )}
    </div>
  );
}

// ==================== MODAL RESULTADO EAN LOTE ====================
function ModalLoteEan({ resultado, aoFechar }: { resultado: EnriquecimentoLote; aoFechar: () => void }) {
  return (
    <div className="loja-modal-bg" onClick={aoFechar}>
      <div className="loja-modal lg" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3><Barcode size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />Resultado — Enriquecimento de EANs</h3>
          <button className="loja-btn mini" onClick={aoFechar}><X size={13} /></button>
        </div>
        <div className="loja-kpis" style={{ marginBottom: 16 }}>
          <article><small>VERIFICADOS</small><b>{resultado.verificados}</b><span>produtos com SKU numérico</span></article>
          <article><small>ATUALIZADOS</small><b style={{ color: "var(--up)" }}>{resultado.atualizados}</b><span>EAN confirmado online</span></article>
          <article><small>NÃO ENCONTRADOS</small><b style={{ color: "var(--muted)" }}>{resultado.naoEncontrados}</b><span>não constam nas bases</span></article>
        </div>
        {resultado.itens.length > 0 && (
          <div className="loja-mov" style={{ maxHeight: 320, overflowY: "auto" }}>
            {resultado.itens.map((it) => (
              <div key={it.id} className="linha">
                <div>
                  <b>{it.nome}</b>
                  <small style={{ display: "block" }}>EAN {it.ean}{it.dadosOnline?.marca ? ` · ${it.dadosOnline.marca}` : ""}</small>
                </div>
                <div style={{ textAlign: "right" }}>
                  {it.encontrado
                    ? <span className="loja-badge on"><CheckCircle2 size={10} /> atualizado</span>
                    : <span className="loja-badge off">não encontrado</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {resultado.verificados === 0 && (
          <p className="loja-empty">Nenhum produto com SKU numérico (EAN-8 ou EAN-13) encontrado para verificar.<br /><small>Preencha o campo SKU com o EAN numérico do produto e tente novamente.</small></p>
        )}
        <div className="fim"><button className="loja-btn ouro" onClick={aoFechar}>Fechar</button></div>
      </div>
    </div>
  );
}

// ==================== MODAL RESULTADO VÍNCULO OMIE ====================
function ModalVinculoOmie({ resultado, aoFechar }: { resultado: VinculoOmieResp; aoFechar: () => void }) {
  return (
    <div className="loja-modal-bg" onClick={aoFechar}>
      <div className="loja-modal lg" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3><Link2 size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />Vínculo com o Omie</h3>
          <button className="loja-btn mini" onClick={aoFechar}><X size={13} /></button>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "var(--muted)" }}>
          Vínculo por <code>codigo_produto_integracao</code> (chave imutável). Já associados são ignorados; produtos
          ausentes no Omie são criados automaticamente.
        </p>
        {resultado.bloqueado && (
          <p className="loja-empty" style={{ color: "var(--down)", marginBottom: 12 }}>
            ⚠️ O Omie bloqueou o consumo da API (limite de requisições). O vínculo foi interrompido no meio —
            <b> aguarde ~30 minutos e clique de novo</b>. A operação é idempotente: retoma de onde parou, sem duplicar.
          </p>
        )}
        <div className="loja-kpis" style={{ marginBottom: 16 }}>
          <article><small>TOTAL</small><b>{resultado.total}</b><span>produtos ativos</span></article>
          <article><small>VINCULADOS AGORA</small><b style={{ color: "var(--up)" }}>{resultado.vinculados}</b><span>{resultado.associados} associados · {resultado.criados} criados</span></article>
          <article><small>JÁ VINCULADOS</small><b style={{ color: "var(--muted)" }}>{resultado.jaVinculados}</b><span>sem alteração</span></article>
          <article><small>ERROS</small><b className={resultado.erros ? "down" : ""}>{resultado.erros}</b><span>{resultado.bloqueado ? "bloqueio de consumo" : "ver logs da API"}</span></article>
        </div>
        <div className="fim"><button className="loja-btn ouro" onClick={aoFechar}>Fechar</button></div>
      </div>
    </div>
  );
}

// ==================== MODAL ESTOQUE (standalone, acessado pela tabela) ====================
function ModalEstoque({ produto, aoFechar, aoMudar }: { produto: LojaProduto; aoFechar: () => void; aoMudar: () => void }) {
  return (
    <div className="loja-modal-bg" onClick={aoFechar}>
      <div className="loja-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Estoque · {produto.nome}</h3>
        <EstoqueInline produto={produto} aoMudar={aoMudar} />
        <div className="fim" style={{ marginTop: 18 }}>
          <button className="loja-btn" onClick={aoFechar}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

/** Modal de alteração de preço (PRD §41). */
function ModalPreco({ produto, aoFechar, aoSalvar }: { produto: LojaProduto; aoFechar: () => void; aoSalvar: () => void }) {
  const [novo, setNovo] = useState<string>(String(Number(produto.preco)));
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const salvar = useMutation({
    mutationFn: () => lojaAlterarPreco(produto.id, { preco: Number(novo), motivo: motivo.trim() || undefined }),
    onSuccess: aoSalvar,
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao alterar o preço."),
  });
  const invalido = novo === "" || Number.isNaN(Number(novo)) || Number(novo) < 0;

  return (
    <div className="loja-modal-bg" onClick={aoFechar}>
      <div className="loja-modal" onClick={(e) => e.stopPropagation()}>
        <h3><Tag size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />Alterar preço</h3>
        <p style={{ margin: "2px 0 14px", fontWeight: 700 }}>{produto.nome}</p>
        <div className="loja-grid2">
          <div><label>Preço atual</label><input className="loja-input" value={brl(produto.preco)} disabled /></div>
          <div><label>Novo preço (R$)</label><input className="loja-input" type="number" min={0} step="0.01" value={novo} onChange={(e) => setNovo(e.target.value)} autoFocus /></div>
        </div>
        <label>Motivo (opcional)</label>
        <input className="loja-input" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: reajuste de tabela" />
        <p style={{ color: "var(--txt-fraco, #9a9aa2)", fontSize: 11.5, marginTop: 10 }}>
          A mudança vale no Cardápio e no PDV e é registrada na auditoria. Pedidos já pagos mantêm o preço da compra.
        </p>
        {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
        <div className="fim">
          <button className="loja-btn" onClick={aoFechar}>Cancelar</button>
          <button className="loja-btn ouro" disabled={salvar.isPending || invalido} onClick={() => { setErro(null); salvar.mutate(); }}>
            {salvar.isPending ? "Salvando…" : "Salvar preço"}
          </button>
        </div>
      </div>
    </div>
  );
}
