"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote, Barcode, Camera, Check, ChefHat, Copy, CreditCard, ImageOff,
  Loader2, Minus, Pencil, Percent, Plus, Printer, QrCode, Search, Trash2, User, UserPlus, X,
  Star, PartyPopper,
} from "lucide-react";
import {
  checkout, confirmarPagamento, imprimirCupomPedido, iniciarPagamento, iniciarPreparacao,
  lojaPedido, lojaProdutosBalcao, vendaPdvFila,
} from "@/services/api/loja-pedidos";
import {
  lojaCategorias, lojaAtualizarProduto, lojaEnviarImagemProduto,
  lojaProduto as buscarProduto,
} from "@/services/api/loja-produtos";
import { ErroApi } from "@/services/api/client";
import { Select } from "@/components/ui/Select";
import { PortalPdv } from "@/app/pdv-movel/PortalPdv";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import type { LojaCategoria, LojaProduto } from "@/types/loja-produtos";
import type { PdvProduto } from "@/types/pdv";
import type { FormaPagamento, LojaPedido, LojaPedidoPagamento } from "@/types/loja-pedidos";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Estado =
  | { t: "carrinho" }
  | { t: "pix"; pedido: LojaPedido; pgto: LojaPedidoPagamento }
  | { t: "ok"; pedido: LojaPedido };

type ModalExtra = null | "cliente" | "descItem" | "descTotal" | "cancelar";

interface Cliente { nome: string; tel: string }
interface LinhaCarrinho { p: PdvProduto; q: number; descItem: number }

// ─────────────────────────────────────────────────────────────────────────────
// Componente: CardProdutoMovel
// Card de produto com clique duplo e botão direito → abre edição.
// ─────────────────────────────────────────────────────────────────────────────
function CardProdutoMovel({
  p, noCarrinho, onAdd, onEditar, podeEditar,
}: {
  p: PdvProduto;
  noCarrinho: number;
  onAdd: () => void;
  onEditar: () => void;
  podeEditar: boolean;
}) {
  const esgotado = !!p.controlaEstoque && !p.vendeSemEstoque && p.disponivel <= 0;

  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleClick = () => {
    // Aguarda brevemente para distinguir de um clique duplo (editar).
    if (!podeEditar) { onAdd(); return; }
    if (clickTimer.current) return;
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null;
      onAdd();
    }, 220);
  };
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!podeEditar) return;
    e.preventDefault();
    e.stopPropagation();
    if (clickTimer.current) { clearTimeout(clickTimer.current); clickTimer.current = null; }
    onEditar();
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!podeEditar) return;
    e.preventDefault();
    onEditar();
  };

  const sel = noCarrinho > 0;
  const cls = p.disponivel <= 0 ? "zero" : p.disponivel <= 3 ? "baixo" : "ok";
  const badgeTxt = p.disponivel <= 0 ? "esgotado" : `${p.disponivel}`;

  return (
    <button
      className={`pm-prod ${sel ? "sel" : ""}`}
      disabled={esgotado}
      onClick={handleClick}
      onDoubleClick={podeEditar ? handleDoubleClick : undefined}
      onContextMenu={podeEditar ? handleContextMenu : undefined}
    >
      {noCarrinho > 0 && <span className="pm-prod-qtd">{noCarrinho}</span>}
      {p.controlaEstoque && <span className={`pm-prod-badge ${cls}`}>{badgeTxt}</span>}
      {/* Indicador visual de edição disponível */}
      {podeEditar && (
        <span className="pm-prod-edit-hint" title="Clique duplo para editar">
          <Pencil size={10} />
        </span>
      )}
      {p.imagemUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img className="pm-prod-img" src={p.imagemUrl} alt={p.descricao ?? ""} />
        : <div className="pm-prod-img pm-prod-img-vazia"><ImageOff size={24} /></div>}
      <span className="pm-prod-nome">{p.descricao}</span>
      <span className="pm-prod-preco">{brl(p.preco)}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal: Vender (PDV Móvel)
// ─────────────────────────────────────────────────────────────────────────────
export default function Vender() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao()).data;
  const podeGerir = pode(perfil, "loja.produtos.gerenciar");

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [carrinho, setCarrinho] = useState<Record<string, LinhaCarrinho>>({});
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [forma, setForma] = useState<FormaPagamento>("DINHEIRO");
  const [estado, setEstado] = useState<Estado>({ t: "carrinho" });
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [descontoTotal, setDescontoTotal] = useState(0);
  const [modalExtra, setModalExtra] = useState<ModalExtra>(null);
  const [editarProduto, setEditarProduto] = useState<PdvProduto | null>(null);
  const [avisoImpressao, setAvisoImpressao] = useState<string | null>(null);

  const categorias = useQuery({ queryKey: ["loja", "categorias"], queryFn: lojaCategorias });
  const produtos = useQuery({ queryKey: ["pdv-movel-produtos", busca], queryFn: () => lojaProdutosBalcao(busca) });

  const lista = useMemo(() => {
    const rows = produtos.data ?? [];
    return categoria ? rows.filter((p) => p.categoria === categoria) : rows;
  }, [produtos.data, categoria]);

  // Destaques do PDV móvel: emDestaque=true OU categoria Bebidas, sem esgotados
  const destaquesMovel = useMemo(() => {
    const rows = produtos.data ?? [];
    const set = new Set<string>();
    const result: PdvProduto[] = [];
    for (const p of rows) {
      const esgotado = !!p.controlaEstoque && !p.vendeSemEstoque && p.disponivel <= 0;
      const ehBebida = /bebida/i.test(p.categoria ?? "");
      if (!esgotado && (p.emDestaque || ehBebida)) {
        if (!set.has(p.produtoId)) { set.add(p.produtoId); result.push(p); }
      }
    }
    return result;
  }, [produtos.data]);

  const linhas = Object.values(carrinho);
  const bruto = useMemo(() => linhas.reduce((s, l) => s + l.p.preco * l.q, 0), [linhas]);
  const descItens = useMemo(() => linhas.reduce((s, l) => s + l.descItem, 0), [linhas]);
  const total = Math.max(0, +(bruto - descItens - descontoTotal).toFixed(2));
  const qtd = linhas.reduce((s, l) => s + l.q, 0);
  const precisaPreparo = linhas.some((l) => l.p.precisaPreparacao);

  const add = (p: PdvProduto) => {
    if (p.controlaEstoque && !p.vendeSemEstoque && p.disponivel <= 0) return;
    setCarrinho((c) => ({ ...c, [p.produtoId]: { p, q: (c[p.produtoId]?.q ?? 0) + 1, descItem: c[p.produtoId]?.descItem ?? 0 } }));
  };
  const setQ = (id: string, q: number) =>
    setCarrinho((c) => {
      if (q <= 0) {
        const cp = { ...c }; delete cp[id];
        setSelecionado((s) => (s === id ? null : s));
        return cp;
      }
      return { ...c, [id]: { ...c[id], q } };
    });
  const limpar = () => {
    setCarrinho({}); setEstado({ t: "carrinho" }); setErro(null);
    setDescontoTotal(0); setSelecionado(null); setCliente(null); setAvisoImpressao(null);
  };

  const finalizar = useMutation({
    mutationFn: () =>
      vendaPdvFila({
        // PDV móvel: toda venda entra na fila unificada do balcão — de lá o
        // operador acompanha, imprime o cupom e entrega (mesmo sem item de preparo).
        modo: "ENVIAR_PREPARACAO",
        clienteNome: cliente?.nome || undefined,
        clienteTel: cliente?.tel || undefined,
        desconto: +(descontoTotal + descItens).toFixed(2),
        itens: linhas.map((l) => ({ produtoId: l.p.produtoId, quantidade: l.q })),
        pagamentos: [{ forma, valor: total }],
      }),
    onSuccess: (p) => {
      setEstado({ t: "ok", pedido: p as LojaPedido });
      qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
      qc.invalidateQueries({ queryKey: ["pdv-movel-produtos"] });
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao registrar a venda."),
  });

  const gerarPix = useMutation({
    mutationFn: async () => {
      const pedido = await checkout({
        canal: "PDV",
        clienteNome: cliente?.nome || undefined,
        clienteTel: cliente?.tel || undefined,
        itens: linhas.map((l) => ({ produtoId: l.p.produtoId, quantidade: l.q })),
      });
      const pgto = await iniciarPagamento(pedido.id, { forma: "PIX" });
      return { pedido, pgto };
    },
    onSuccess: ({ pedido, pgto }) => {
      setEstado({ t: "pix", pedido, pgto });
      const iv = setInterval(async () => {
        try {
          const at = await lojaPedido(pedido.id);
          if (at.status !== "AGUARDANDO_PAGAMENTO") {
            clearInterval(iv);
            setEstado({ t: "ok", pedido: at });
            qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
            qc.invalidateQueries({ queryKey: ["pdv-movel-produtos"] });
          }
        } catch { /* ignora */ }
      }, 3000);
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao gerar PIX."),
  });

  const confirmarPix = useMutation({
    mutationFn: (id: string) => confirmarPagamento(id),
    onSuccess: (p) => {
      setEstado({ t: "ok", pedido: p as LojaPedido });
      qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao confirmar PIX."),
  });

  // Envia o pedido recém-concluído para preparação (o back imprime o cupom junto).
  const preparar = useMutation({
    mutationFn: (id: string) => iniciarPreparacao(id),
    onSuccess: (p) => {
      setEstado({ t: "ok", pedido: p as LojaPedido });
      setErro(null);
      setAvisoImpressao("Enviado para preparação — cupom na impressora.");
      qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao enviar para preparação."),
  });

  // Só imprime o cupom, sem mudar o status do pedido.
  const imprimirVenda = useMutation({
    mutationFn: (id: string) => imprimirCupomPedido(id),
    onSuccess: () => { setErro(null); setAvisoImpressao("Cupom enviado para a impressora."); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao imprimir o cupom."),
  });

  const pagar = () => {
    setErro(null);
    if (forma === "PIX") gerarPix.mutate();
    else finalizar.mutate();
  };

  const fecharSheet = () => {
    if (estado.t === "ok") limpar();
    setSheet(false);
    setEstado({ t: "carrinho" });
    setErro(null);
    setAvisoImpressao(null);
  };

  const copiarPix = async () => {
    if (estado.t !== "pix" || !estado.pgto.pixCopiaCola) return;
    try { await navigator.clipboard.writeText(estado.pgto.pixCopiaCola); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* */ }
  };

  // Item selecionado para desconto
  const itemSel = selecionado ? carrinho[selecionado] : null;
  const temItens = linhas.length > 0;

  // ── Ações rápidas (equivalentes às teclas de função) ──────────────────
  const acoes = [
    {
      id: "cliente",
      label: cliente ? cliente.nome.split(" ")[0] : "Cliente",
      Icone: cliente ? User : UserPlus,
      ativo: true,
      on: !!cliente,
      onClick: () => setModalExtra("cliente"),
    },
    {
      id: "desc-item",
      label: "Desc. item",
      Icone: Percent,
      ativo: !!selecionado,
      on: false,
      onClick: () => setModalExtra("descItem"),
    },
    {
      id: "desc-total",
      label: "Desc. total",
      Icone: Percent,
      ativo: temItens,
      on: descontoTotal > 0,
      onClick: () => setModalExtra("descTotal"),
    },
    {
      id: "cancelar",
      label: "Cancelar",
      Icone: Trash2,
      ativo: temItens,
      on: false,
      danger: true,
      onClick: () => setModalExtra("cancelar"),
    },
  ] as const;

  return (
    <>
      <div className="pm-busca">
        <Search />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto…"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoCorrect="off"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
        />
        {busca && (
          <button className="pm-busca-x" onClick={() => setBusca("")} aria-label="Limpar busca"><X size={16} /></button>
        )}
      </div>

      <div className="pm-chips">
        <button className={`pm-chip ${categoria === "" ? "on" : ""}`} onClick={() => setCategoria("")}>Todos</button>
        {(categorias.data ?? []).filter((c) => c.ativo).map((c) => (
          <button key={c.id} className={`pm-chip ${categoria === c.nome ? "on" : ""}`} onClick={() => setCategoria(c.nome)}>{c.nome}</button>
        ))}
      </div>

      {produtos.isLoading && <p className="pm-vazio">Carregando produtos…</p>}
      {produtos.data && lista.length === 0 && <p className="pm-vazio">Nenhum produto.</p>}

      {/* ---- Destaques: bebidas + emDestaque (só sem busca/categoria ativa) ---- */}
      {destaquesMovel.length > 0 && !busca && !categoria && (
        <div className="pm-destaques">
          <div className="pm-destaques-head">
            <Star size={13} fill="currentColor" />
            <span>Destaques &amp; Bebidas</span>
          </div>
          <div className="pm-destaques-rail">
            {destaquesMovel.map((p) => (
              <CardProdutoMovel
                key={p.produtoId}
                p={p}
                noCarrinho={carrinho[p.produtoId]?.q ?? 0}
                onAdd={() => { add(p); setSelecionado(p.produtoId); }}
                onEditar={() => setEditarProduto(p)}
                podeEditar={podeGerir}
              />
            ))}
          </div>
        </div>
      )}

      {podeGerir && (
        <p className="pm-hint-editar">
          <Pencil size={12} /> Clique duplo ou clique com botão direito para editar um produto
        </p>
      )}

      <div className="pm-grid">
        {lista.map((p) => (
          <CardProdutoMovel
            key={p.produtoId}
            p={p}
            noCarrinho={carrinho[p.produtoId]?.q ?? 0}
            onAdd={() => { add(p); setSelecionado(p.produtoId); }}
            onEditar={() => setEditarProduto(p)}
            podeEditar={podeGerir}
          />
        ))}
      </div>

      {/* ── Barra inferior: ações rápidas + carrinho ── */}
      {temItens && (
        <div className="pm-bottom-area">
          {/* Ajuste rápido do último item selecionado (sem abrir o carrinho) */}
          {itemSel && (
            <div className="pm-quick-item">
              <span className="nome">{itemSel.p.descricao}</span>
              <div className="pm-stepper">
                <button onClick={() => setQ(itemSel.p.produtoId, itemSel.q - 1)} aria-label="Menos um"><Minus size={16} /></button>
                <b>{itemSel.q}</b>
                <button
                  onClick={() => setQ(itemSel.p.produtoId, itemSel.q + 1)}
                  disabled={!!itemSel.p.controlaEstoque && !itemSel.p.vendeSemEstoque && itemSel.q >= itemSel.p.disponivel}
                  aria-label="Mais um"
                ><Plus size={16} /></button>
              </div>
              <button className="pm-quick-rm" onClick={() => setQ(itemSel.p.produtoId, 0)} aria-label="Remover item">
                <Trash2 size={15} />
              </button>
            </div>
          )}

          {/* Barra de ações rápidas (ícones — equivalente às teclas F no desktop) */}
          <div className="pm-acoes-bar">
            {acoes.map((a) => (
              <button
                key={a.id}
                className={`pm-acao-btn ${a.on ? "on" : ""} ${"danger" in a && a.danger ? "danger" : ""} ${!a.ativo ? "off" : ""}`}
                disabled={!a.ativo}
                onClick={a.onClick}
                title={a.label}
              >
                <a.Icone size={18} />
                <span>{a.label}</span>
              </button>
            ))}
          </div>

          {/* Barra do carrinho */}
          <div className="pm-carrinho-bar">
            <button className="pm-carrinho-btn" onClick={() => { setSheet(true); setEstado({ t: "carrinho" }); }}>
              <span><span className="c">{qtd}</span> no carrinho</span>
              <span>{brl(total)} →</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Sheet do carrinho / pagamento (portal → escapa do scroll e da navbar) ── */}
      {sheet && (
        <PortalPdv>
        <div className="pm-sheet-bg" onClick={fecharSheet}>
          <div className="pm-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="pm-sheet-head">
              <h2>{estado.t === "ok" ? "Venda concluída" : estado.t === "pix" ? "Pagamento PIX" : "Seu pedido"}</h2>
              <button className="pm-sheet-x" onClick={fecharSheet}><X /></button>
            </div>

            {/* ---- Carrinho ---- */}
            {estado.t === "carrinho" && (
              <>
                {/* Cliente identificado */}
                {cliente && (
                  <div className="pm-sheet-cliente">
                    <User size={14} />
                    <span>{cliente.nome}{cliente.tel ? ` · ${cliente.tel}` : ""}</span>
                    <button onClick={() => setCliente(null)}><X size={12} /></button>
                  </div>
                )}

                <div className="pm-sheet-body">
                  {linhas.map((l) => (
                    <div
                      key={l.p.produtoId}
                      className={`pm-linha-item ${selecionado === l.p.produtoId ? "sel" : ""}`}
                      onClick={() => setSelecionado((s) => s === l.p.produtoId ? null : l.p.produtoId)}
                    >
                      {l.p.imagemUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img className="pm-linha-thumb" src={l.p.imagemUrl} alt="" />
                        : <div className="pm-linha-thumb pm-linha-thumb-vazia"><ImageOff size={16} /></div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="nome">{l.p.descricao}</span>
                        {l.descItem > 0 && <span className="pm-desc-chip">−{brl(l.descItem)}</span>}
                      </div>
                      <div className="pm-stepper">
                        <button onClick={(e) => { e.stopPropagation(); setQ(l.p.produtoId, l.q - 1); }}><Minus size={16} /></button>
                        <b>{l.q}</b>
                        <button onClick={(e) => { e.stopPropagation(); setQ(l.p.produtoId, l.q + 1); }} disabled={!!l.p.controlaEstoque && !l.p.vendeSemEstoque && l.q >= l.p.disponivel}><Plus size={16} /></button>
                      </div>
                      <button className="pm-linha-rm" onClick={(e) => { e.stopPropagation(); setQ(l.p.produtoId, 0); }} aria-label="Remover item">
                        <Trash2 size={15} />
                      </button>
                      <span className="preco">{brl(l.p.preco * l.q - l.descItem)}</span>
                    </div>
                  ))}

                  {/* Ações rápidas (rolam junto com a lista; o rodapé fica só com o pagamento) */}
                  <div className="pm-sheet-acoes">
                    {acoes.filter((a) => a.id !== "cancelar").map((a) => (
                      <button
                        key={a.id}
                        className={`pm-sheet-acao ${a.on ? "on" : ""} ${!a.ativo ? "off" : ""}`}
                        disabled={!a.ativo}
                        onClick={a.onClick}
                      >
                        <a.Icone size={14} />
                        <span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pm-sheet-foot">
                  <div className="pm-total-bloco">
                    {(descontoTotal > 0 || descItens > 0) && (
                      <div className="pm-total-linha"><span>Subtotal</span><span>{brl(bruto)}</span></div>
                    )}
                    {descItens > 0 && (
                      <div className="pm-total-linha"><span>Desc. itens</span><span className="pm-desc-val">−{brl(descItens)}</span></div>
                    )}
                    {descontoTotal > 0 && (
                      <div className="pm-total-linha"><span>Desc. total</span><span className="pm-desc-val">−{brl(descontoTotal)}</span></div>
                    )}
                    <div className="pm-total-linha big"><span>Total</span><span>{brl(total)}</span></div>
                  </div>

                  <p className="pm-total-linha muted" style={{ margin: 0 }}>
                    <ChefHat size={13} /> {precisaPreparo
                      ? "Vai para a fila de preparação."
                      : "Vai para a fila do balcão (dá pra imprimir e preparar)."}
                  </p>
                  <div className="pm-formas">
                    {([["DINHEIRO", Banknote, "Dinheiro"], ["CARTAO_CREDITO", CreditCard, "Cartão"], ["PIX", QrCode, "PIX"]] as const).map(([f, I, lbl]) => (
                      <button key={f} className={`pm-forma ${forma === f ? "on" : ""}`} onClick={() => setForma(f)}><I /> {lbl}</button>
                    ))}
                  </div>
                  {erro && <div className="pm-erro">{erro}</div>}
                  <button className="pm-btn verde bloco" disabled={finalizar.isPending || gerarPix.isPending} onClick={pagar}>
                    {finalizar.isPending || gerarPix.isPending ? "Processando…" : `Finalizar venda · ${brl(total)}`}
                  </button>
                  <button className="pm-btn pm-btn-danger bloco" onClick={() => setModalExtra("cancelar")}>
                    <Trash2 size={15} /> Cancelar venda
                  </button>
                </div>
              </>
            )}

            {/* ---- PIX ---- */}
            {estado.t === "pix" && (
              <div className="pm-sheet-body">
                <div className="pm-pix">
                  {estado.pgto.pixQrcode
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={estado.pgto.pixQrcode.startsWith("data:") ? estado.pgto.pixQrcode : `data:image/png;base64,${estado.pgto.pixQrcode}`} alt="QR PIX" />
                    : <p className="pm-vazio">Gerando QR…</p>}
                  <p className="pm-total-linha big" style={{ justifyContent: "center" }}>{brl(total)}</p>
                  {estado.pgto.pixCopiaCola && (
                    <div className="pm-pix-copia">
                      <input readOnly value={estado.pgto.pixCopiaCola} />
                      <button className="pm-btn" onClick={copiarPix}>{copiado ? <Check size={16} /> : <Copy size={16} />}</button>
                    </div>
                  )}
                  <p className="pm-vazio">Aguardando confirmação do pagamento…</p>
                  {erro && <div className="pm-erro">{erro}</div>}
                  <button className="pm-btn ouro bloco" disabled={confirmarPix.isPending} onClick={() => confirmarPix.mutate(estado.pedido.id)}>
                    Já recebi — confirmar
                  </button>
                </div>
              </div>
            )}

            {/* ---- Sucesso ---- */}
            {estado.t === "ok" && (() => {
              const emPreparo = estado.pedido.status === "EM_PREPARACAO";
              const naFila = estado.pedido.status === "NA_FILA" || estado.pedido.status === "PROXIMO";
              return (
                <div className="pm-sheet-body">
                  <div className="pm-sucesso">
                    <div className="ico"><PartyPopper size={46} /></div>
                    <h2>Pedido #{estado.pedido.numero}</h2>
                    <p>{emPreparo
                      ? "Em preparação — cupom enviado para a impressora."
                      : naFila
                        ? "Na fila do balcão. Envie para preparação/impressão ou imprima o cupom."
                        : "Venda concluída."}</p>
                    {erro && <div className="pm-erro">{erro}</div>}
                    {avisoImpressao && <div className="pm-aviso-ok">{avisoImpressao}</div>}
                    {naFila && (
                      <button
                        className="pm-btn verde bloco"
                        style={{ marginTop: 10 }}
                        disabled={preparar.isPending}
                        onClick={() => preparar.mutate(estado.pedido.id)}
                      >
                        <ChefHat size={16} /> {preparar.isPending ? "Enviando…" : "Preparar e imprimir"}
                      </button>
                    )}
                    {(naFila || emPreparo) && (
                      <button
                        className="pm-btn bloco"
                        style={{ marginTop: 10 }}
                        disabled={imprimirVenda.isPending}
                        onClick={() => imprimirVenda.mutate(estado.pedido.id)}
                      >
                        <Printer size={16} /> {imprimirVenda.isPending ? "Enviando…" : "Imprimir cupom"}
                      </button>
                    )}
                    <button className="pm-btn ouro bloco" style={{ marginTop: 10 }} onClick={fecharSheet}>Nova venda</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
        </PortalPdv>
      )}

      {/* ── Modais extras (cliente, desconto, cancelar) ── */}
      {modalExtra === "cliente" && (
        <ModalCliente
          inicial={cliente}
          onFechar={() => setModalExtra(null)}
          onSalvar={(c) => { setCliente(c); setModalExtra(null); }}
          onLimpar={() => { setCliente(null); setModalExtra(null); }}
        />
      )}

      {modalExtra === "descItem" && itemSel && (
        <ModalDesconto
          titulo="Desconto do item"
          subtitulo={itemSel.p.descricao ?? "Item"}
          base={itemSel.p.preco * itemSel.q}
          onFechar={() => setModalExtra(null)}
          onAplicar={(v) => {
            const id = itemSel.p.produtoId;
            setCarrinho((c) => ({ ...c, [id]: { ...c[id], descItem: v } }));
            setModalExtra(null);
          }}
        />
      )}

      {modalExtra === "descTotal" && (
        <ModalDesconto
          titulo="Desconto na venda"
          subtitulo="Aplicado sobre o total"
          base={bruto - descItens}
          onFechar={() => setModalExtra(null)}
          onAplicar={(v) => { setDescontoTotal(v); setModalExtra(null); }}
        />
      )}

      {modalExtra === "cancelar" && (
        <PortalPdv>
        <div className="pm-modal-bg" onClick={() => setModalExtra(null)}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancelar venda?</h3>
            <p>Todos os itens do carrinho serão removidos.</p>
            <div className="pm-modal-fim">
              <button className="pm-btn" onClick={() => setModalExtra(null)}>Voltar</button>
              <button className="pm-btn pm-btn-danger" onClick={() => { limpar(); setModalExtra(null); setSheet(false); }}>Cancelar venda</button>
            </div>
          </div>
        </div>
        </PortalPdv>
      )}

      {/* ── Modal de edição rápida (clique duplo / botão direito) ── */}
      {editarProduto && (
        <ModalEditarProdutoPdvMovel
          produto={editarProduto}
          categorias={categorias.data ?? []}
          onFechar={() => setEditarProduto(null)}
          onSalvo={() => {
            qc.invalidateQueries({ queryKey: ["pdv-movel-produtos"] });
            qc.invalidateQueries({ queryKey: ["loja"] });
            setEditarProduto(null);
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de cliente (mobile)
// ─────────────────────────────────────────────────────────────────────────────
function ModalCliente({
  inicial, onFechar, onSalvar, onLimpar,
}: {
  inicial: Cliente | null;
  onFechar: () => void;
  onSalvar: (c: Cliente) => void;
  onLimpar: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [tel, setTel] = useState(inicial?.tel ?? "");
  const nomeRef = useRef<HTMLInputElement>(null);

  const salvar = () => {
    if (!nome.trim()) return;
    onSalvar({ nome: nome.trim(), tel: tel.trim() });
  };

  return (
    <PortalPdv>
    <div className="pm-modal-bg" onClick={onFechar}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-head">
          <UserPlus size={18} />
          <h3>Identificar cliente</h3>
          <button className="pm-sheet-x" onClick={onFechar}><X size={18} /></button>
        </div>
        <label className="pm-modal-label">Nome</label>
        <input
          ref={nomeRef}
          className="pm-modal-input"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do cliente"
          autoFocus
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          onKeyDown={(e) => { if (e.key === "Enter") salvar(); }}
        />
        <label className="pm-modal-label">Telefone <span className="pm-modal-opt">(opcional)</span></label>
        <input
          className="pm-modal-input"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          placeholder="(71) 90000-0000"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="done"
          onKeyDown={(e) => { if (e.key === "Enter") salvar(); }}
        />
        <div className="pm-modal-fim">
          {inicial
            ? <button className="pm-btn pm-btn-danger" onClick={onLimpar}>Remover</button>
            : <button className="pm-btn" onClick={onFechar}>Cancelar</button>}
          <button className="pm-btn ouro" disabled={!nome.trim()} onClick={salvar}>Salvar</button>
        </div>
      </div>
    </div>
    </PortalPdv>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de desconto (mobile)
// ─────────────────────────────────────────────────────────────────────────────
function ModalDesconto({
  titulo, subtitulo, base, onFechar, onAplicar,
}: {
  titulo: string;
  subtitulo: string;
  base: number;
  onFechar: () => void;
  onAplicar: (valorEmReais: number) => void;
}) {
  const [tipo, setTipo] = useState<"reais" | "pct">("reais");
  const [valor, setValor] = useState("");

  const num = Number(valor.replace(",", ".")) || 0;
  const descReais = tipo === "reais" ? Math.min(num, base) : +(base * Math.min(num, 100) / 100).toFixed(2);
  const final = Math.max(0, base - descReais);
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <PortalPdv>
    <div className="pm-modal-bg" onClick={onFechar}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pm-modal-head">
          <Percent size={18} />
          <div>
            <h3>{titulo}</h3>
            <p className="pm-modal-sub">{subtitulo} · atual {fmt(base)}</p>
          </div>
          <button className="pm-sheet-x" onClick={onFechar}><X size={18} /></button>
        </div>

        <div className="pm-desc-tipo">
          <button className={tipo === "reais" ? "on" : ""} onClick={() => setTipo("reais")}>R$</button>
          <button className={tipo === "pct" ? "on" : ""} onClick={() => setTipo("pct")}><Percent size={13} /> %</button>
        </div>

        <input
          className="pm-modal-input big"
          inputMode="decimal"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder={tipo === "reais" ? "0,00" : "0"}
          autoFocus
          autoComplete="off"
          enterKeyHint="done"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAplicar(descReais); } }}
        />

        <div className="pm-desc-resumo">
          <div><span>Original</span><b>{fmt(base)}</b></div>
          <div><span>Desconto</span><b className="pm-val-down">−{fmt(descReais)}</b></div>
          <div><span>Final</span><b className="pm-val-up">{fmt(final)}</b></div>
        </div>

        <div className="pm-modal-fim">
          <button className="pm-btn" onClick={onFechar}>Cancelar</button>
          <button className="pm-btn ouro" onClick={() => onAplicar(descReais)}>Aplicar</button>
        </div>
      </div>
    </div>
    </PortalPdv>
  );
}

// Redimensiona/compacta a imagem no próprio navegador antes de enviar. A câmera
// do celular entrega fotos de 4–12 MP (3–8 MB); reduzir para ~1400px deixa o
// upload MUITO mais rápido.
async function comprimirImagem(file: File, maxLado = 1400, qualidade = 0.82): Promise<File> {
  try {
    if (typeof createImageBitmap !== "function") return file;
    const bmp = await createImageBitmap(file);
    const maior = Math.max(bmp.width, bmp.height);
    const escala = maior > maxLado ? maxLado / maior : 1;
    if (escala === 1 && file.size <= 900_000) { bmp.close(); return file; }
    const w = Math.round(bmp.width * escala);
    const h = Math.round(bmp.height * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) { bmp.close(); return file; }
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", qualidade));
    if (!blob) return file;
    return new File([blob], (file.name || "produto").replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de edição rápida de produto (acionado por clique duplo / botão direito)
// Estilo .pm-* (tema escuro fixo do PDV móvel)
// ─────────────────────────────────────────────────────────────────────────────
function ModalEditarProdutoPdvMovel({
  produto: prodInicial,
  categorias,
  onFechar,
  onSalvo,
}: {
  produto: PdvProduto;
  categorias: LojaCategoria[];
  onFechar: () => void;
  onSalvo: (atualizado?: LojaProduto) => void;
}) {
  const [nome, setNome] = useState(prodInicial.descricao ?? "");
  const [ean, setEan] = useState("");
  const [preco, setPreco] = useState(String(prodInicial.preco));
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [exibeCardapio, setExibeCardapio] = useState(true);
  const [emDestaque, setEmDestaque] = useState(!!prodInicial.emDestaque);
  const [imagemUrl, setImagemUrl] = useState(prodInicial.imagemUrl ?? "");
  const [enviandoImg, setEnviandoImg] = useState(false);
  const [erroImg, setErroImg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  // Ignora uploads antigos quando o usuário troca a foto rápido.
  const imgTokenRef = useRef(0);

  // Carrega dados completos do produto (incl. EAN)
  const prodQuery = useQuery({
    queryKey: ["loja", "produto", prodInicial.produtoId],
    queryFn: () => buscarProduto(prodInicial.produtoId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (prodQuery.data) {
      setEan(prodQuery.data.codigoBarras ?? "");
      setCategoriaId(prodQuery.data.categoriaId ?? "");
      setExibeCardapio(prodQuery.data.exibeCardapio);
      setEmDestaque(prodQuery.data.emDestaque);
      if (nome === prodInicial.descricao) setNome(prodQuery.data.nome);
      const precoApi = Number(prodQuery.data.preco);
      if (!isNaN(precoApi)) setPreco(precoApi.toFixed(2).replace(".", ","));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prodQuery.data]);

  function limparInputs() {
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  }

  // Envia a foto (comprimida no navegador para ficar leve e rápida).
  async function processarImagem(arquivo: File) {
    const token = ++imgTokenRef.current;
    setErroImg(null);
    const urlLocal = URL.createObjectURL(arquivo);
    setImagemUrl(urlLocal);
    setEnviandoImg(true);
    try {
      const comprimida = await comprimirImagem(arquivo, 1400);
      const { url } = await lojaEnviarImagemProduto(comprimida, "produto.jpg");
      if (imgTokenRef.current !== token) { URL.revokeObjectURL(urlLocal); return; }
      URL.revokeObjectURL(urlLocal);
      setImagemUrl(url);
      setEnviandoImg(false);
      limparInputs();
    } catch (e) {
      URL.revokeObjectURL(urlLocal);
      setImagemUrl(prodInicial.imagemUrl ?? "");
      setErroImg(e instanceof Error ? e.message : "Falha ao enviar imagem.");
      setEnviandoImg(false);
      limparInputs();
    }
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const precoNum = Number(preco.replace(",", "."));
      if (isNaN(precoNum) || precoNum < 0) throw new Error("Preço inválido.");
      const prodData = prodQuery.data;
      if (!prodData) throw new Error("Produto não carregado.");
      const payload = {
        nome: nome.trim() || prodData.nome,
        sku: prodData.sku ?? "",
        codigoBarras: ean.trim() || undefined,
        descricao: prodData.descricao ?? "",
        imagemUrl: imagemUrl || undefined,
        categoriaId: categoriaId || null,
        preco: precoNum,
        custo: prodData.custo ? Number(prodData.custo) : undefined,
        unidade: prodData.unidade ?? "un",
        ativo: prodData.ativo,
        vendePdv: prodData.vendePdv,
        exibeCardapio,
        precisaPreparacao: prodData.precisaPreparacao,
        controlaEstoque: prodData.controlaEstoque,
        vendeSemEstoque: prodData.vendeSemEstoque,
        emDestaque,
        estoqueMinimo: Number(prodData.estoqueMinimo) ?? 0,
      };
      return lojaAtualizarProduto(prodData.id, payload);
    },
    onSuccess: onSalvo,
    onError: (e) => setErro(e instanceof Error ? e.message : "Falha ao salvar."),
  });

  const carregando = prodQuery.isLoading;

  return (
    <PortalPdv>
    <div className="pm-modal-bg pm-modal-bg-top" onClick={onFechar}>
      <div className="pm-modal pm-modal-edprod" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className="pm-modal-head">
          <Pencil size={18} />
          <div style={{ flex: 1 }}>
            <h3>Editar produto</h3>
            <p className="pm-modal-sub">{prodInicial.descricao}</p>
          </div>
          <button className="pm-sheet-x" onClick={onFechar}><X size={18} /></button>
        </div>

        {carregando ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--pm-muted)" }}>
            <Loader2 size={28} className="pm-spin" /> Carregando…
          </div>
        ) : (
          <>
            {/* Área de imagem */}
            <div className="pm-edprod-img-area">
              <div
                className={`pm-edprod-preview ${imagemUrl ? "" : "vazio"}`}
                onClick={() => !enviandoImg && fileRef.current?.click()}
              >
                {imagemUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagemUrl} alt="" />
                ) : (
                  <span><ImageOff size={28} /><small>Sem imagem</small></span>
                )}
                {enviandoImg && (
                  <div className="pm-edprod-sending">
                    <Loader2 size={24} className="pm-spin" />
                  </div>
                )}
              </div>

              <div className="pm-edprod-img-btns">
                <button
                  type="button"
                  className="pm-btn ouro"
                  style={{ fontSize: 13, padding: "10px 14px" }}
                  disabled={enviandoImg}
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera size={14} /> Tirar foto
                </button>
                <button
                  type="button"
                  className="pm-btn"
                  style={{ fontSize: 13, padding: "10px 14px" }}
                  disabled={enviandoImg}
                  onClick={() => fileRef.current?.click()}
                >
                  {imagemUrl ? "Trocar" : "Galeria"}
                </button>
                {imagemUrl && (
                  <button
                    type="button"
                    className="pm-btn"
                    style={{ fontSize: 13, padding: "10px 12px" }}
                    disabled={enviandoImg}
                    onClick={() => setImagemUrl("")}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {erroImg && <p className="pm-erro" style={{ fontSize: 12 }}>{erroImg}</p>}

              <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void processarImagem(f); }} />
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void processarImagem(f); }} />
            </div>

            {/* Campos */}
            <div className="pm-edprod-campos">
              <div>
                <label className="pm-modal-label">Nome do produto</label>
                <input
                  className="pm-modal-input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do produto"
                />
              </div>

              <div>
                <label className="pm-modal-label">Código de barras (EAN)</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="pm-modal-input"
                    style={{ flex: 1 }}
                    value={ean}
                    onChange={(e) => setEan(e.target.value)}
                    placeholder="Ex: 7891234567890"
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    className="pm-btn"
                    style={{ padding: "0 14px" }}
                    title="Escanear EAN com câmera"
                    onClick={() => cameraRef.current?.click()}
                  >
                    <Barcode size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="pm-modal-label">Categoria</label>
                <Select
                  className="pm-modal-input"
                  style={{ width: "100%" }}
                  aria-label="Categoria"
                  value={categoriaId}
                  onChange={setCategoriaId}
                  options={[{ value: "", label: "Sem categoria" }, ...categorias.filter((c) => c.ativo).map((c) => ({ value: c.id, label: c.nome }))]}
                />
              </div>

              <div>
                <label className="pm-modal-label">Preço (R$)</label>
                <input
                  className="pm-modal-input"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </div>

              <label className="pm-edprod-check">
                <input
                  type="checkbox"
                  checked={emDestaque}
                  onChange={(e) => setEmDestaque(e.target.checked)}
                />
                <span>
                  <span className="pm-edprod-check-tit"><Star size={14} fill={emDestaque ? "currentColor" : "none"} /> Marcar como destaque</span>
                  <small>{emDestaque ? "Aparece na vitrine de Destaques (cardápio e PDV)." : "Produto comum, sem destaque."}</small>
                </span>
              </label>

              <label className="pm-edprod-check">
                <input
                  type="checkbox"
                  checked={!exibeCardapio}
                  onChange={(e) => setExibeCardapio(!e.target.checked)}
                />
                <span>
                  Retirar do cardápio digital
                  <small>{exibeCardapio ? "Aparece no cardápio para o cliente." : "Fica só no PDV — o cliente não vê no cardápio."}</small>
                </span>
              </label>
            </div>

            {erro && <p className="pm-erro">{erro}</p>}

            <div className="pm-modal-fim" style={{ marginTop: 8 }}>
              <button className="pm-btn" onClick={onFechar}>Cancelar</button>
              <button
                className="pm-btn ouro"
                disabled={salvar.isPending || enviandoImg}
                onClick={() => salvar.mutate()}
              >
                {salvar.isPending ? <Loader2 size={14} className="pm-spin" /> : <Check size={14} />}
                {salvar.isPending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </PortalPdv>
  );
}
