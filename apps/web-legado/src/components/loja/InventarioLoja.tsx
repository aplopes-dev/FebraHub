/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Barcode, Camera, CheckCircle2, ClipboardList, History, ImageOff,
  Loader2, PackageSearch, Save, ScanLine, Search, Trash2, Upload, X,
} from "lucide-react";
import {
  lojaAjustarEstoque,
  lojaAtualizarCodigoBarras,
  lojaAtualizarProduto,
  lojaBuscarPorBarcode,
  lojaEnviarImagemProduto,
  lojaMovimentos,
  lojaProduto,
  lojaProdutos,
} from "@/services/api/loja-produtos";
import { LeitorQr } from "@/components/loja/LeitorQr";
import { ErroApi } from "@/services/api/client";
import type { LojaLocal, LojaProduto, ProdutoInput } from "@/types/loja-produtos";

const num = (n: number | string) => Number(n).toLocaleString("pt-BR");
const NOME_LOCAL: Record<LojaLocal, string> = { LOJA: "Loja", DEPOSITO: "Depósito" };
const LOCAIS: LojaLocal[] = ["LOJA", "DEPOSITO"];

/** Extrai só o código de barras de um texto lido (QR pode trazer URL/prefixo). */
function normalizarCodigo(texto: string): string {
  const t = texto.trim();
  // Se veio uma URL com ?barcode= ou path numérico, tenta o último trecho numérico.
  const soNumeros = t.match(/\d{6,}/g);
  if (/^https?:\/\//i.test(t) && soNumeros?.length) return soNumeros[soNumeros.length - 1];
  return t;
}

/**
 * Inventário da Loja: encontre o produto (bipando o código de barras/QR pela
 * câmera, ou buscando pelo nome), confira o saldo atual por local e informe a
 * CONTAGEM real — o sistema ajusta o saldo (movimento tipo "inventário"). Dá
 * também para trocar a foto do produto e associar/limpar o código de barras.
 */
export function InventarioLoja({ podeGerir }: { podeGerir: boolean }) {
  const [alvo, setAlvo] = useState<LojaProduto | null>(null);

  return (
    <div className="inv">
      {!alvo ? (
        <SeletorProduto podeGerir={podeGerir} aoEscolher={setAlvo} />
      ) : (
        <FichaInventario
          produtoBase={alvo}
          podeGerir={podeGerir}
          aoVoltar={() => setAlvo(null)}
        />
      )}
    </div>
  );
}

/* ─────────────── Passo 1: encontrar o produto ─────────────── */
function SeletorProduto({
  podeGerir, aoEscolher,
}: {
  podeGerir: boolean;
  aoEscolher: (p: LojaProduto) => void;
}) {
  const [busca, setBusca] = useState("");
  const [scan, setScan] = useState(false);
  const [erroScan, setErroScan] = useState<string | null>(null);
  const [buscandoCod, setBuscandoCod] = useState(false);
  const [avisoCod, setAvisoCod] = useState<string | null>(null);

  const prods = useQuery({
    queryKey: ["loja", "produtos", "inventario", busca],
    queryFn: () => lojaProdutos({ busca: busca || undefined, situacao: "todos" }),
  });

  async function resolverCodigo(codigoBruto: string) {
    const codigo = normalizarCodigo(codigoBruto);
    if (!codigo) return;
    setScan(false);
    setBuscandoCod(true);
    setAvisoCod(null);
    try {
      const p = await lojaBuscarPorBarcode(codigo);
      aoEscolher(p);
    } catch (e) {
      // Não achou por barcode: joga o código na busca por nome/SKU e avisa.
      setBusca(codigo);
      setAvisoCod(
        e instanceof ErroApi && e.status === 404
          ? `Nenhum produto com o código ${codigo}. Busque pelo nome e associe o código na ficha.`
          : "Falha ao buscar pelo código. Tente pela busca.",
      );
    } finally {
      setBuscandoCod(false);
    }
  }

  return (
    <div className="inv-selecao">
      <div className="inv-scanbar">
        <label className="loja-busca inv-busca">
          <Search size={15} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome, SKU ou código de barras"
            autoFocus
          />
        </label>
        <button
          type="button"
          className="loja-btn ouro inv-scan-btn"
          onClick={() => { setErroScan(null); setScan((v) => !v); }}
        >
          {scan ? <><X size={15} /> Fechar câmera</> : <><ScanLine size={15} /> Bipar código</>}
        </button>
      </div>

      {scan && (
        <div className="inv-scanner-box">
          <LeitorQr
            onLer={(t) => void resolverCodigo(t)}
            onErro={(m) => { setErroScan(m); setScan(false); }}
          />
          <p className="inv-scan-hint"><Barcode size={13} /> Aponte para o código de barras ou QR do produto</p>
        </div>
      )}
      {erroScan && <p className="inv-aviso erro">{erroScan} — use a busca por nome abaixo.</p>}
      {buscandoCod && <p className="inv-aviso"><Loader2 size={13} className="girando" /> Procurando pelo código…</p>}
      {avisoCod && <p className="inv-aviso erro">{avisoCod}</p>}

      <div className="loja-tabela-wrap inv-lista">
        {prods.isLoading ? (
          <p className="loja-empty"><Loader2 size={16} className="girando" /> Carregando produtos…</p>
        ) : prods.isError ? (
          <p className="loja-empty" style={{ color: "var(--down)" }}>Não foi possível carregar os produtos.</p>
        ) : !(prods.data ?? []).length ? (
          <p className="loja-empty">
            <PackageSearch size={18} /> {busca ? "Nenhum produto encontrado." : "Nenhum produto cadastrado."}
          </p>
        ) : (
          <table className="loja-tabela">
            <thead>
              <tr><th>Produto</th><th className="dir">Loja</th><th className="dir">Depósito</th><th className="dir">Total</th><th></th></tr>
            </thead>
            <tbody>
              {(prods.data ?? []).map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="inv-prod-cel">
                      <Miniatura url={p.imagemUrl} />
                      <div>
                        <b>{p.nome}</b>
                        <small>{[p.sku, p.codigoBarras].filter(Boolean).join(" · ") || "sem código"}</small>
                      </div>
                    </div>
                  </td>
                  <td className="dir">{num(p.estoque.porLocal.LOJA.saldoFisico)}</td>
                  <td className="dir">{num(p.estoque.porLocal.DEPOSITO.saldoFisico)}</td>
                  <td className="dir"><b>{num(p.estoque.saldoTotal)}</b></td>
                  <td className="dir">
                    <button className="loja-btn ouro" onClick={() => aoEscolher(p)}>
                      <ClipboardList size={14} /> {podeGerir ? "Inventariar" : "Ver"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ─────────────── Passo 2: ficha de inventário do produto ─────────────── */
function FichaInventario({
  produtoBase, podeGerir, aoVoltar,
}: {
  produtoBase: LojaProduto;
  podeGerir: boolean;
  aoVoltar: () => void;
}) {
  const qc = useQueryClient();
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Recarrega sempre o produto atualizado (saldos frescos após ajuste).
  const prodQuery = useQuery({
    queryKey: ["loja", "produto", produtoBase.id],
    queryFn: () => lojaProduto(produtoBase.id),
    initialData: produtoBase,
  });
  const p = prodQuery.data ?? produtoBase;

  const movs = useQuery({
    queryKey: ["loja", "movimentos", produtoBase.id],
    queryFn: () => lojaMovimentos(produtoBase.id),
  });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["loja", "produto", produtoBase.id] });
    qc.invalidateQueries({ queryKey: ["loja", "movimentos", produtoBase.id] });
    qc.invalidateQueries({ queryKey: ["loja", "produtos"] });
    qc.invalidateQueries({ queryKey: ["loja", "indicadores"] });
    qc.invalidateQueries({ queryKey: ["loja", "reposicao"] });
  };

  return (
    <div className="inv-ficha">
      <div className="inv-ficha-topo">
        <button className="loja-btn" onClick={aoVoltar}><X size={14} /> Trocar produto</button>
      </div>

      <div className="inv-ficha-grid">
        {/* Coluna do produto: foto + identidade */}
        <div className="inv-col-produto">
          <FotoProduto produto={p} podeGerir={podeGerir} aoAtualizar={invalidar} />
          <h3 className="inv-nome">{p.nome}</h3>
          <div className="inv-meta">
            {p.sku && <span className="inv-tag">SKU {p.sku}</span>}
            <CodigoBarras produto={p} podeGerir={podeGerir} aoAtualizar={invalidar} />
          </div>
        </div>

        {/* Coluna da contagem por local */}
        <div className="inv-col-contagem">
          {okMsg && <p className="inv-aviso ok"><CheckCircle2 size={14} /> {okMsg}</p>}
          {LOCAIS.map((loc) => (
            <ContagemLocal
              key={loc}
              produtoId={p.id}
              local={loc}
              saldoAtual={p.estoque.porLocal[loc].saldoFisico}
              reservado={p.estoque.porLocal[loc].reservado}
              podeGerir={podeGerir}
              aoConcluir={(msg) => { setOkMsg(msg); invalidar(); }}
            />
          ))}
          <div className="inv-total-linha">
            <span>Total físico</span>
            <b>{num(p.estoque.saldoTotal)} {p.unidade}</b>
          </div>
        </div>
      </div>

      {/* Histórico de movimentos */}
      <details className="inv-hist" open>
        <summary><History size={14} /> Movimentos recentes</summary>
        {movs.isLoading ? (
          <p className="loja-empty"><Loader2 size={14} className="girando" /> Carregando…</p>
        ) : !(movs.data ?? []).length ? (
          <p className="loja-empty">Sem movimentos registrados.</p>
        ) : (
          <div className="loja-tabela-wrap">
            <table className="loja-tabela inv-tabela-mov">
              <thead>
                <tr><th>Data</th><th>Tipo</th><th>Local</th><th className="dir">Qtd</th><th>Observação</th></tr>
              </thead>
              <tbody>
                {(movs.data ?? []).slice(0, 30).map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td><span className={`inv-mov-tipo ${m.tipo}`}>{m.tipo}</span></td>
                    <td>{NOME_LOCAL[m.local] ?? m.local}</td>
                    <td className="dir" style={{ color: Number(m.quantidade) < 0 ? "var(--down)" : "var(--up, var(--gold))" }}>
                      {Number(m.quantidade) > 0 ? "+" : ""}{num(m.quantidade)}
                    </td>
                    <td><small>{m.observacao || "—"}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </div>
  );
}

/* ─────────────── Contagem por local (o coração do inventário) ─────────────── */
function ContagemLocal({
  produtoId, local, saldoAtual, reservado, podeGerir, aoConcluir,
}: {
  produtoId: string;
  local: LojaLocal;
  saldoAtual: number;
  reservado: number;
  podeGerir: boolean;
  aoConcluir: (msg: string) => void;
}) {
  const [contagem, setContagem] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const salvar = useMutation({
    mutationFn: () =>
      lojaAjustarEstoque(produtoId, {
        local,
        tipo: "inventario",
        quantidade: Number(contagem.replace(",", ".")) || 0,
        observacao: obs || undefined,
      }),
    onSuccess: () => {
      const q = Number(contagem.replace(",", "."));
      setContagem(""); setObs(""); setErro(null);
      aoConcluir(`${NOME_LOCAL[local]}: saldo ajustado para ${num(q)}.`);
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao salvar a contagem."),
  });

  const valorNum = contagem === "" ? null : Number(contagem.replace(",", "."));
  const diff = valorNum === null ? 0 : valorNum - saldoAtual;

  return (
    <div className="inv-local-card">
      <div className="inv-local-head">
        <span className="inv-local-nome">{NOME_LOCAL[local]}</span>
        <span className="inv-local-saldo">
          atual <b>{num(saldoAtual)}</b>{reservado > 0 && <em> · {num(reservado)} reserv.</em>}
        </span>
      </div>
      {podeGerir ? (
        <>
          <div className="inv-conta-linha">
            <input
              className="loja-input inv-conta-input"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.001"
              value={contagem}
              onChange={(e) => setContagem(e.target.value)}
              placeholder="Contagem real"
              aria-label={`Contagem real em ${NOME_LOCAL[local]}`}
            />
            <button
              className="loja-btn ouro"
              disabled={salvar.isPending || valorNum === null || valorNum < 0 || diff === 0}
              onClick={() => { setErro(null); salvar.mutate(); }}
              title={diff === 0 ? "A contagem é igual ao saldo atual" : "Aplicar contagem"}
            >
              {salvar.isPending ? <Loader2 size={14} className="girando" /> : <Save size={14} />} Aplicar
            </button>
          </div>
          {valorNum !== null && diff !== 0 && (
            <p className={`inv-diff ${diff < 0 ? "neg" : "pos"}`}>
              Ajuste de {diff > 0 ? "+" : ""}{num(diff)} {diff < 0 ? "(baixa)" : "(entrada)"}
            </p>
          )}
          <input
            className="loja-input inv-obs"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Observação (opcional)"
          />
          {erro && <p className="inv-aviso erro">{erro}</p>}
        </>
      ) : (
        <p className="inv-somente-leitura">Você não tem permissão para ajustar o estoque.</p>
      )}
    </div>
  );
}

/* ─────────────── Foto do produto (trocar com remoção de fundo) ─────────────── */
function FotoProduto({
  produto, podeGerir, aoAtualizar,
}: {
  produto: LojaProduto;
  podeGerir: boolean;
  aoAtualizar: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<string>(produto.imagemUrl ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [removerFundo, setRemoverFundo] = useState(true);

  useEffect(() => { setPrevia(produto.imagemUrl ?? ""); }, [produto.imagemUrl]);

  /** Monta o payload de atualização preservando os campos do produto. */
  function payloadCom(imagemUrl: string | null): ProdutoInput {
    return {
      nome: produto.nome,
      sku: produto.sku ?? undefined,
      codigoBarras: produto.codigoBarras ?? null,
      descricao: produto.descricao || undefined,
      imagemUrl,
      categoriaId: produto.categoriaId ?? null,
      preco: Number(produto.preco),
      custo: produto.custo != null ? Number(produto.custo) : undefined,
      unidade: produto.unidade,
      produtoEstoqueId: produto.produtoEstoqueId ?? null,
      ativo: produto.ativo,
      vendePdv: produto.vendePdv,
      exibeCardapio: produto.exibeCardapio,
      precisaPreparacao: produto.precisaPreparacao,
      controlaEstoque: produto.controlaEstoque,
      vendeSemEstoque: produto.vendeSemEstoque,
      emDestaque: produto.emDestaque,
      estoqueMinimo: Number(produto.estoqueMinimo),
      ordem: produto.ordem,
    };
  }

  async function processar(arquivo: File) {
    setErro(null);
    const urlLocal = URL.createObjectURL(arquivo);
    setPrevia(urlLocal);
    setEnviando(true);
    try {
      let arquivoFinal = arquivo;
      if (removerFundo) {
        try {
          const { removeBackground } = await import("@imgly/background-removal");
          const blob = await removeBackground(arquivo);
          arquivoFinal = new File([blob], arquivo.name.replace(/\.\w+$/, ".png"), { type: "image/png" });
        } catch { /* usa original se o modelo falhar */ }
      }
      URL.revokeObjectURL(urlLocal);
      const { url } = await lojaEnviarImagemProduto(arquivoFinal, arquivoFinal.name || "produto.png");
      await lojaAtualizarProduto(produto.id, payloadCom(url));
      setPrevia(url);
      aoAtualizar();
    } catch (e) {
      URL.revokeObjectURL(urlLocal);
      setPrevia(produto.imagemUrl ?? "");
      setErro(e instanceof ErroApi ? e.mensagem : e instanceof Error ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = "";
      if (camRef.current) camRef.current.value = "";
    }
  }

  async function remover() {
    if (!previa) return;
    setEnviando(true); setErro(null);
    try {
      await lojaAtualizarProduto(produto.id, payloadCom(null));
      setPrevia(""); aoAtualizar();
    } catch (e) {
      setErro(e instanceof ErroApi ? e.mensagem : "Falha ao remover a imagem.");
    } finally { setEnviando(false); }
  }

  return (
    <div className="inv-foto">
      <div className={`inv-foto-preview ${previa ? "" : "vazio"}`}>
        {previa ? (
          <img src={previa} alt={produto.nome} onError={() => setPrevia("")} />
        ) : (
          <span className="inv-foto-vazio"><ImageOff size={22} /> Sem foto</span>
        )}
        {enviando && (
          <div className="inv-foto-carregando"><Loader2 size={26} className="girando" /></div>
        )}
      </div>

      {podeGerir && (
        <div className="inv-foto-acoes">
          <button type="button" className="loja-btn mini" disabled={enviando} onClick={() => camRef.current?.click()}>
            <Camera size={13} /> Foto
          </button>
          <button type="button" className="loja-btn mini" disabled={enviando} onClick={() => fileRef.current?.click()}>
            <Upload size={13} /> {previa ? "Trocar" : "Enviar"}
          </button>
          {previa && (
            <button type="button" className="loja-btn mini" disabled={enviando} onClick={() => void remover()}>
              <Trash2 size={13} /> Remover
            </button>
          )}
          <label className="inv-foto-toggle">
            <input type="checkbox" checked={removerFundo} onChange={(e) => setRemoverFundo(e.target.checked)} />
            Remover fundo
          </label>
        </div>
      )}
      {erro && <p className="inv-aviso erro">{erro}</p>}

      {/* input de câmera (mobile abre a câmera direto) e input de arquivo */}
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden
        onChange={(e) => { const a = e.target.files?.[0]; if (a) void processar(a); }} />
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
        onChange={(e) => { const a = e.target.files?.[0]; if (a) void processar(a); }} />
    </div>
  );
}

/* ─────────────── Código de barras (associar via scan / limpar) ─────────────── */
function CodigoBarras({
  produto, podeGerir, aoAtualizar,
}: {
  produto: LojaProduto;
  podeGerir: boolean;
  aoAtualizar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [scan, setScan] = useState(false);
  const [valor, setValor] = useState(produto.codigoBarras ?? "");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => { setValor(produto.codigoBarras ?? ""); }, [produto.codigoBarras]);

  const salvar = useMutation({
    mutationFn: (codigo: string | null) => lojaAtualizarCodigoBarras(produto.id, codigo),
    onSuccess: () => { setEditando(false); setScan(false); setErro(null); aoAtualizar(); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao salvar o código."),
  });

  if (!podeGerir) {
    return <span className="inv-tag"><Barcode size={12} /> {produto.codigoBarras || "sem código"}</span>;
  }

  if (!editando) {
    return (
      <button type="button" className="inv-tag inv-tag-btn" onClick={() => setEditando(true)} title="Associar/editar código de barras">
        <Barcode size={12} /> {produto.codigoBarras || "associar código"}
      </button>
    );
  }

  return (
    <div className="inv-cod-edit">
      <div className="inv-cod-linha">
        <input
          className="loja-input"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Código de barras"
          autoFocus
        />
        <button type="button" className="loja-btn mini" onClick={() => { setErro(null); setScan((v) => !v); }}>
          <ScanLine size={13} /> {scan ? "Fechar" : "Bipar"}
        </button>
      </div>
      {scan && (
        <div className="inv-scanner-box compacto">
          <LeitorQr
            onLer={(t) => setValor(normalizarCodigo(t))}
            onErro={() => setScan(false)}
            pausado={!scan}
          />
        </div>
      )}
      {erro && <p className="inv-aviso erro">{erro}</p>}
      <div className="inv-cod-botoes">
        <button className="loja-btn mini" onClick={() => { setEditando(false); setScan(false); setValor(produto.codigoBarras ?? ""); }}>Cancelar</button>
        {produto.codigoBarras && (
          <button className="loja-btn mini" disabled={salvar.isPending} onClick={() => salvar.mutate(null)}>Limpar</button>
        )}
        <button className="loja-btn ouro mini" disabled={salvar.isPending || !valor.trim()} onClick={() => salvar.mutate(valor.trim())}>
          {salvar.isPending ? <Loader2 size={13} className="girando" /> : <Save size={13} />} Salvar
        </button>
      </div>
    </div>
  );
}

/* ─────────────── auxiliares ─────────────── */
function Miniatura({ url }: { url?: string | null }) {
  const [ok, setOk] = useState(true);
  if (!url || !ok) return <div className="inv-mini vazio"><ImageOff size={14} /></div>;
  return <img className="inv-mini" src={url} alt="" onError={() => setOk(false)} />;
}
