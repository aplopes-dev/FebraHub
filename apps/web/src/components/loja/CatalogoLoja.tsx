"use client";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Boxes, ImageOff, Layers, Loader2, PackageCheck, Pencil, Plus, Search, SlidersHorizontal, Sparkles, Tag, Trash2, Upload } from "lucide-react";
import {
  lojaAjustarEstoque, lojaAlterarPreco, lojaAtualizarProduto, lojaCategorias, lojaCriarProduto,
  lojaEnviarImagemProduto, lojaIndicadores, lojaInativarProduto, lojaMovimentos, lojaProdutos, lojaTransferirEstoque,
} from "@/services/api/loja-produtos";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import type { LojaLocal, LojaProduto, ProdutoInput } from "@/types/loja-produtos";
import { GestaoCategorias } from "@/components/loja/GestaoCategorias";
import "@/app/loja.css";

const brl = (n: number | string) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const num = (n: number | string) => Number(n).toLocaleString("pt-BR");
const NOME_LOCAL: Record<LojaLocal, string> = { LOJA: "Loja", DEPOSITO: "Depósito" };

export function CatalogoLoja() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao());
  const podeGerir = pode(perfil.data, "loja.produtos.gerenciar");
  // Alterar preço: permissão dedicada OU gestão do catálogo (PRD §40).
  const podePreco = podeGerir || pode(perfil.data, "loja.produtos.preco");

  const [busca, setBusca] = useState("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [situacao, setSituacao] = useState("ativos");
  const [editar, setEditar] = useState<LojaProduto | null | "novo">(null);
  const [estoque, setEstoque] = useState<LojaProduto | null>(null);
  const [preco, setPreco] = useState<LojaProduto | null>(null);
  const [gerirCategorias, setGerirCategorias] = useState(false);

  const ind = useQuery({ queryKey: ["loja", "indicadores"], queryFn: lojaIndicadores });
  const cats = useQuery({ queryKey: ["loja", "categorias"], queryFn: lojaCategorias });
  const prods = useQuery({
    queryKey: ["loja", "produtos", busca, categoriaId, situacao],
    queryFn: () => lojaProdutos({ busca: busca || undefined, categoriaId: categoriaId || undefined, situacao }),
  });

  const i = ind.data;
  const invalidar = () => qc.invalidateQueries({ queryKey: ["loja"] });

  return (
    <main className="loja-page">
      <header className="loja-hero">
        <div>
          <span className="tag">LOJA · CATÁLOGO E ESTOQUE</span>
          <h1>Produtos da Loja</h1>
          <p>Cadastro único para PDV e Cardápio. Estoque operacional dividido em Loja e Depósito, com entrada, saída e transferência entre os dois.</p>
        </div>
        {podeGerir && (
          <div className="acoes">
            <button className="loja-btn" onClick={() => setGerirCategorias(true)}><Layers size={15} /> Categorias</button>
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
            <select className="loja-select" style={{ width: "auto" }} value={situacao} onChange={(e) => setSituacao(e.target.value)}>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
              <option value="todos">Todos</option>
            </select>
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
              <th>Estoque (Loja / Depósito)</th><th>Flags</th>{(podeGerir || podePreco) && <th></th>}
            </tr>
          </thead>
          <tbody>
            {(prods.data ?? []).map((p) => {
              const baixo = p.controlaEstoque && Number(p.estoqueMinimo) > 0 && p.estoque.saldoTotal < Number(p.estoqueMinimo);
              return (
                <tr key={p.id}>
                  <td>{p.imagemUrl ? <img className="loja-thumb" src={p.imagemUrl} alt="" /> : <div className="loja-thumb" />}</td>
                  <td className="nome"><b>{p.nome}</b><small>{p.sku || p.codigoBarras || "sem código"}</small></td>
                  <td>{p.categoria?.nome ?? "—"}</td>
                  <td className="num">{brl(p.preco)}</td>
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
                    {p.precisaPreparacao && <span className="loja-badge prep">preparo</span>}{" "}
                    {!p.vendePdv && <span className="loja-badge off">s/ PDV</span>}{" "}
                    {!p.exibeCardapio && <span className="loja-badge off">s/ cardápio</span>}
                  </td>
                  {(podeGerir || podePreco) && (
                    <td className="num">
                      {podePreco && <><button className="loja-btn mini" onClick={() => setPreco(p)} title="Alterar preço"><Tag size={13} /></button>{" "}</>}
                      {podeGerir && <><button className="loja-btn mini" onClick={() => setEstoque(p)} title="Estoque"><Boxes size={13} /></button>{" "}
                      <button className="loja-btn mini" onClick={() => setEditar(p)} title="Editar"><Pencil size={13} /></button></>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!prods.isLoading && !(prods.data ?? []).length && <p className="loja-empty">Nenhum produto encontrado neste filtro.</p>}
      </section>

      {editar && <ModalProduto produto={editar === "novo" ? null : editar} aoFechar={() => setEditar(null)} aoSalvar={() => { setEditar(null); invalidar(); }} />}
      {estoque && <ModalEstoque produto={estoque} aoFechar={() => setEstoque(null)} aoMudar={() => invalidar()} />}
      {preco && <ModalPreco produto={preco} aoFechar={() => setPreco(null)} aoSalvar={() => { setPreco(null); invalidar(); }} />}
      {gerirCategorias && <GestaoCategorias aoFechar={() => { setGerirCategorias(false); invalidar(); }} />}
    </main>
  );
}

// ==================== UPLOADER DE IMAGEM (com remoção de fundo) ====================
/**
 * Sobe a imagem do produto e, opcionalmente, remove o fundo direto no
 * navegador (@imgly/background-removal — roda em WASM, sem custo de servidor).
 * A remoção é dinâmica: só baixa o modelo quando o usuário de fato usa. Se
 * falhar, cai para o upload da imagem original — nunca trava o cadastro.
 */
function UploaderImagem({ valor, aoMudar }: { valor: string; aoMudar: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [removerFundo, setRemoverFundo] = useState(true);
  const [etapa, setEtapa] = useState<"" | "fundo" | "enviando">("");
  const [erro, setErro] = useState<string | null>(null);
  const ocupado = etapa !== "";

  async function processar(arquivo: File) {
    setErro(null);
    try {
      let blob: Blob = arquivo;
      let nome = arquivo.name || "produto.png";
      if (removerFundo) {
        setEtapa("fundo");
        try {
          const { removeBackground } = await import("@imgly/background-removal");
          blob = await removeBackground(arquivo, { output: { format: "image/png" } });
          nome = nome.replace(/\.[^.]+$/, "") + ".png";
        } catch (e) {
          // Modelo indisponível/erro de WASM: segue com a imagem original.
          console.warn("Remoção de fundo falhou, enviando original:", e);
          setErro("Não foi possível remover o fundo — a imagem original foi enviada.");
        }
      }
      setEtapa("enviando");
      const { url } = await lojaEnviarImagemProduto(blob, nome);
      aoMudar(url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setEtapa("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label>Imagem do produto</label>
      <div className="loja-uploader">
        <div className={`loja-uploader-preview ${valor ? "" : "vazio"}`} onClick={() => !ocupado && inputRef.current?.click()}>
          {ocupado ? (
            <span className="loja-uploader-status"><Loader2 size={18} className="girando" />{etapa === "fundo" ? "Removendo fundo…" : "Enviando…"}</span>
          ) : valor ? (
            <img src={valor} alt="Prévia do produto" />
          ) : (
            <span className="loja-uploader-status"><ImageOff size={20} /> Sem imagem</span>
          )}
        </div>
        <div className="loja-uploader-acoes">
          <button type="button" className="loja-btn mini" disabled={ocupado} onClick={() => inputRef.current?.click()}>
            <Upload size={13} /> {valor ? "Trocar imagem" : "Enviar imagem"}
          </button>
          {valor && (
            <button type="button" className="loja-btn mini" disabled={ocupado} onClick={() => aoMudar("")}>
              <Trash2 size={13} /> Remover
            </button>
          )}
          <label className="loja-uploader-toggle" title="Deixa só o produto, sem fundo">
            <input type="checkbox" checked={removerFundo} disabled={ocupado} onChange={(e) => setRemoverFundo(e.target.checked)} />
            <Sparkles size={13} /> Remover fundo
          </label>
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
    </div>
  );
}

// ==================== MODAL PRODUTO ====================
function ModalProduto({ produto, aoFechar, aoSalvar }: { produto: LojaProduto | null; aoFechar: () => void; aoSalvar: () => void }) {
  const cats = useQuery({ queryKey: ["loja", "categorias"], queryFn: lojaCategorias });
  const [f, setF] = useState<ProdutoInput & { ativo: boolean }>(() => ({
    nome: produto?.nome ?? "",
    sku: produto?.sku ?? "",
    codigoBarras: produto?.codigoBarras ?? "",
    descricao: produto?.descricao ?? "",
    imagemUrl: produto?.imagemUrl ?? "",
    categoriaId: produto?.categoriaId ?? "",
    preco: produto ? Number(produto.preco) : 0,
    custo: produto?.custo ? Number(produto.custo) : undefined,
    unidade: produto?.unidade ?? "un",
    ativo: produto?.ativo ?? true,
    vendePdv: produto?.vendePdv ?? true,
    exibeCardapio: produto?.exibeCardapio ?? true,
    precisaPreparacao: produto?.precisaPreparacao ?? false,
    controlaEstoque: produto?.controlaEstoque ?? true,
    estoqueMinimo: produto ? Number(produto.estoqueMinimo) : 0,
  }));
  const [erro, setErro] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const salvar = useMutation({
    mutationFn: () => {
      const payload: ProdutoInput = { ...f, categoriaId: f.categoriaId || null };
      return produto ? lojaAtualizarProduto(produto.id, payload) : lojaCriarProduto(payload);
    },
    onSuccess: aoSalvar,
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao salvar o produto."),
  });
  const inativar = useMutation({ mutationFn: () => lojaInativarProduto(produto!.id), onSuccess: aoSalvar });

  return (
    <div className="loja-modal-bg" onClick={aoFechar}>
      <div className="loja-modal lg" onClick={(e) => e.stopPropagation()}>
        <h3>{produto ? "Editar produto" : "Novo produto"}</h3>
        <label>Nome</label>
        <input className="loja-input" value={f.nome} onChange={(e) => set("nome", e.target.value)} autoFocus />
        <div className="loja-grid3">
          <div><label>SKU</label><input className="loja-input" value={f.sku} onChange={(e) => set("sku", e.target.value)} /></div>
          <div><label>Código de barras</label><input className="loja-input" value={f.codigoBarras} onChange={(e) => set("codigoBarras", e.target.value)} /></div>
          <div><label>Categoria</label>
            <select className="loja-select" value={f.categoriaId ?? ""} onChange={(e) => set("categoriaId", e.target.value)}>
              <option value="">—</option>
              {(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="loja-grid3">
          <div><label>Preço de venda (R$)</label><input className="loja-input" type="number" min={0} step="0.01" value={f.preco} onChange={(e) => set("preco", Number(e.target.value))} /></div>
          <div><label>Custo (R$)</label><input className="loja-input" type="number" min={0} step="0.01" value={f.custo ?? ""} onChange={(e) => set("custo", e.target.value ? Number(e.target.value) : undefined)} /></div>
          <div><label>Unidade</label><input className="loja-input" value={f.unidade} onChange={(e) => set("unidade", e.target.value)} placeholder="un, kg…" /></div>
        </div>
        <div className="loja-grid2">
          <UploaderImagem valor={f.imagemUrl ?? ""} aoMudar={(url) => set("imagemUrl", url)} />
          <div><label>Estoque mínimo</label><input className="loja-input" type="number" min={0} step="0.001" value={f.estoqueMinimo} onChange={(e) => set("estoqueMinimo", Number(e.target.value))} /></div>
        </div>
        <label>Descrição</label>
        <textarea className="loja-textarea" value={f.descricao} onChange={(e) => set("descricao", e.target.value)} />

        <div className="loja-flags">
          <label className="loja-flag"><input type="checkbox" checked={f.ativo} onChange={(e) => set("ativo", e.target.checked)} /> Ativo</label>
          <label className="loja-flag"><input type="checkbox" checked={f.vendePdv} onChange={(e) => set("vendePdv", e.target.checked)} /> Vende no PDV</label>
          <label className="loja-flag"><input type="checkbox" checked={f.exibeCardapio} onChange={(e) => set("exibeCardapio", e.target.checked)} /> Exibe no Cardápio Digital</label>
          <label className="loja-flag"><input type="checkbox" checked={f.precisaPreparacao} onChange={(e) => set("precisaPreparacao", e.target.checked)} /> Precisa preparação</label>
          <label className="loja-flag"><input type="checkbox" checked={f.controlaEstoque} onChange={(e) => set("controlaEstoque", e.target.checked)} /> Controla estoque</label>
        </div>

        {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 10 }}>{erro}</p>}
        <div className="fim">
          {produto && produto.ativo && <button className="loja-btn perigo" style={{ marginRight: "auto" }} disabled={inativar.isPending} onClick={() => inativar.mutate()}>Inativar</button>}
          <button className="loja-btn" onClick={aoFechar}>Cancelar</button>
          <button className="loja-btn ouro" disabled={salvar.isPending || !f.nome} onClick={() => { setErro(null); salvar.mutate(); }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// ==================== MODAL ESTOQUE ====================
function ModalEstoque({ produto, aoFechar, aoMudar }: { produto: LojaProduto; aoFechar: () => void; aoMudar: () => void }) {
  const [tab, setTab] = useState<"ajuste" | "transferencia" | "historico">("ajuste");
  const [local, setLocal] = useState<LojaLocal>("LOJA");
  const [tipo, setTipo] = useState<"entrada" | "saida" | "inventario">("entrada");
  const [qtd, setQtd] = useState("");
  const [obs, setObs] = useState("");
  const [origem, setOrigem] = useState<LojaLocal>("DEPOSITO");
  const [destino, setDestino] = useState<LojaLocal>("LOJA");
  const [erro, setErro] = useState<string | null>(null);

  const movs = useQuery({ queryKey: ["loja", "movs", produto.id], queryFn: () => lojaMovimentos(produto.id), enabled: tab === "historico" });

  const ajustar = useMutation({
    mutationFn: () => lojaAjustarEstoque(produto.id, { local, tipo, quantidade: Number(qtd) || 0, observacao: obs || undefined }),
    onSuccess: () => { setQtd(""); setObs(""); aoMudar(); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha no ajuste."),
  });
  const transferir = useMutation({
    mutationFn: () => lojaTransferirEstoque(produto.id, { origem, destino, quantidade: Number(qtd) || 0, observacao: obs || undefined }),
    onSuccess: () => { setQtd(""); setObs(""); aoMudar(); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha na transferência."),
  });

  return (
    <div className="loja-modal-bg" onClick={aoFechar}>
      <div className="loja-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Estoque · {produto.nome}</h3>
        <div className="loja-locais" style={{ marginBottom: 12 }}>
          {(["LOJA", "DEPOSITO"] as LojaLocal[]).map((loc) => (
            <article key={loc} className="loja-card" style={{ flex: 1, padding: 12 }}>
              <small style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>{NOME_LOCAL[loc].toUpperCase()}</small>
              <b style={{ display: "block", fontSize: 22 }}>{num(produto.estoque.porLocal[loc].disponivel)}</b>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>{num(produto.estoque.porLocal[loc].saldoFisico)} físico · {num(produto.estoque.porLocal[loc].reservado)} reservado</span>
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
              <div><label>Local</label><select className="loja-select" value={local} onChange={(e) => setLocal(e.target.value as LojaLocal)}><option value="LOJA">Loja</option><option value="DEPOSITO">Depósito</option></select></div>
              <div><label>Tipo</label><select className="loja-select" value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}><option value="entrada">Entrada (+)</option><option value="saida">Saída (−)</option><option value="inventario">Inventário (define saldo)</option></select></div>
            </div>
            <label>{tipo === "inventario" ? "Saldo contado" : "Quantidade"}</label>
            <input className="loja-input" type="number" min={0} step="0.001" value={qtd} onChange={(e) => setQtd(e.target.value)} autoFocus />
            <label>Observação</label>
            <input className="loja-input" value={obs} onChange={(e) => setObs(e.target.value)} />
            {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
            <div className="fim"><button className="loja-btn" onClick={aoFechar}>Fechar</button><button className="loja-btn ouro" disabled={ajustar.isPending || !qtd} onClick={() => { setErro(null); ajustar.mutate(); }}>Aplicar</button></div>
          </>
        )}

        {tab === "transferencia" && (
          <>
            <div className="loja-grid2">
              <div><label>De</label><select className="loja-select" value={origem} onChange={(e) => setOrigem(e.target.value as LojaLocal)}><option value="LOJA">Loja</option><option value="DEPOSITO">Depósito</option></select></div>
              <div><label>Para</label><select className="loja-select" value={destino} onChange={(e) => setDestino(e.target.value as LojaLocal)}><option value="LOJA">Loja</option><option value="DEPOSITO">Depósito</option></select></div>
            </div>
            <label>Quantidade</label>
            <input className="loja-input" type="number" min={0.001} step="0.001" value={qtd} onChange={(e) => setQtd(e.target.value)} autoFocus />
            <label>Observação</label>
            <input className="loja-input" value={obs} onChange={(e) => setObs(e.target.value)} />
            {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
            <div className="fim"><button className="loja-btn" onClick={aoFechar}>Fechar</button><button className="loja-btn ouro" disabled={transferir.isPending || !qtd || origem === destino} onClick={() => { setErro(null); transferir.mutate(); }}>Transferir</button></div>
          </>
        )}

        {tab === "historico" && (
          <div className="loja-mov">
            {(movs.data ?? []).map((m) => (
              <div key={m.id} className="linha">
                <div><b>{m.tipo}</b> · {NOME_LOCAL[m.local]} <small style={{ display: "block" }}>{m.observacao || m.origem}</small></div>
                <div style={{ textAlign: "right" }}><b style={{ color: Number(m.quantidade) < 0 ? "var(--down)" : "var(--up)" }}>{Number(m.quantidade) > 0 ? "+" : ""}{num(m.quantidade)}</b><small style={{ display: "block" }}>{new Date(m.criadoEm).toLocaleString("pt-BR")}</small></div>
              </div>
            ))}
            {!movs.isLoading && !(movs.data ?? []).length && <p className="loja-empty">Sem movimentações ainda.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/** Modal de alteração de preço (PRD §41). Mostra produto, preço atual e novo
 *  preço + motivo opcional. Valida no backend (permissão + auditoria). O novo
 *  preço reflete no Cardápio e no PDV; pedidos já pagos preservam o preço. */
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
