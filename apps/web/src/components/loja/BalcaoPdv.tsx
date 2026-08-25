"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote, Bell, Check, ChefHat, CreditCard, MoreVertical, Percent, Plus, QrCode,
  ScanLine, Search, Trash2, X, Copy, Loader2, AlertCircle, Clock,
} from "lucide-react";
import { lojaCategorias } from "@/services/api/loja-produtos";
import {
  lojaPedidosIndicadores, lojaProdutosBalcao, vendaPdvFila,
  checkout, iniciarPagamento, confirmarPagamento, lojaPedido as buscarPedido,
} from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import type { PdvProduto } from "@/types/pdv";
import type { FormaPagamento, LojaPedido, LojaPedidoPagamento, VendaPdvInput } from "@/types/loja-pedidos";
import "@/app/balcao.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FORMAS: { forma: FormaPagamento; label: string; Icone: typeof Banknote }[] = [
  { forma: "DINHEIRO", label: "Dinheiro", Icone: Banknote },
  { forma: "CARTAO_CREDITO", label: "Cartão", Icone: CreditCard },
  { forma: "PIX", label: "PIX", Icone: QrCode },
];

interface LinhaCarrinho { produto: PdvProduto; quantidade: number; descItem: number }
interface Split { forma: FormaPagamento; valor: number }

// ==================== Estado do modal de pagamento ====================
type EstadoPagamento =
  | { tipo: "aguardando" }                          // modal aberto, escolhendo forma
  | { tipo: "dinheiro"; recebido: string }           // digitando valor recebido
  | { tipo: "cartao"; confirmado: boolean }          // aguardando operador confirmar na maquininha
  | { tipo: "pix_gerando" }                          // criando pedido + QR Code
  | { tipo: "pix_aguardando"; pedido: LojaPedido; pagamento: LojaPedidoPagamento } // exibindo QR
  | { tipo: "pix_confirmado"; pedido: LojaPedido }   // PIX confirmado
  | { tipo: "concluido"; numero: number }            // venda registrada com sucesso

function selo(p: PdvProduto): { txt: string; cls: string } | null {
  if (!p.controlaEstoque) return null;
  if (p.disponivel <= 0) return { txt: "Esgotado", cls: "zero" };
  if (p.disponivel <= 5) return { txt: "Últimas unidades", cls: "baixo" };
  return { txt: "Em estoque", cls: "ok" };
}

function grupoDe(cat?: string | null): string {
  return (cat ?? "outros").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "") || "outros";
}

export function BalcaoPdv() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao()).data;
  const podeOperar = pode(perfil, "loja.pedidos.operar");

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [carrinho, setCarrinho] = useState<Record<string, LinhaCarrinho>>({});
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [descontoTotal, setDescontoTotal] = useState(0);
  const [forma, setForma] = useState<FormaPagamento>("DINHEIRO");
  const [splitOn, setSplitOn] = useState(false);
  const [splits, setSplits] = useState<Split[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => new Date());
  const [modal, setModal] = useState<null | "descItem" | "descTotal" | "cancelar" | "pagamento">(null);
  const [estadoPgto, setEstadoPgto] = useState<EstadoPagamento>({ tipo: "aguardando" });
  const [pixPolling, setPixPolling] = useState<ReturnType<typeof setInterval> | null>(null);
  const buscaRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const t = setInterval(() => setAgora(new Date()), 30_000); return () => clearInterval(t); }, []);

  // Para polling do PIX
  useEffect(() => {
    return () => { if (pixPolling) clearInterval(pixPolling); };
  }, [pixPolling]);

  const categorias = useQuery({ queryKey: ["loja", "categorias"], queryFn: lojaCategorias });
  const indicadores = useQuery({ queryKey: ["loja-pedidos", "indicadores"], queryFn: () => lojaPedidosIndicadores(), refetchInterval: 15_000 });
  const produtos = useQuery({ queryKey: ["pdv-produtos", busca], queryFn: () => lojaProdutosBalcao(busca) });

  const lista = useMemo(() => {
    const rows = produtos.data ?? [];
    return categoria ? rows.filter((p) => p.categoria === categoria) : rows;
  }, [produtos.data, categoria]);

  const categoriasSemEstoque = useMemo(() => {
    const rows = produtos.data ?? [];
    const sem = new Set<string>();
    (categorias.data ?? []).filter((c) => c.ativo).forEach((c) => {
      const prodsCat = rows.filter((p) => p.categoria === c.nome);
      const todasEsgotadas = prodsCat.length > 0 && prodsCat.every((p) => p.controlaEstoque && p.disponivel <= 0);
      if (todasEsgotadas) sem.add(c.nome);
    });
    return sem;
  }, [produtos.data, categorias.data]);

  const linhas = Object.values(carrinho);
  const temItens = linhas.length > 0;
  const brutoTotal = useMemo(() => linhas.reduce((s, l) => s + l.produto.preco * l.quantidade, 0), [linhas]);
  const descItens = useMemo(() => linhas.reduce((s, l) => s + l.descItem, 0), [linhas]);
  const total = Math.max(0, +(brutoTotal - descItens - descontoTotal).toFixed(2));
  const pago = +splits.reduce((s, p) => s + p.valor, 0).toFixed(2);
  const falta = +(total - pago).toFixed(2);
  const qtdItens = linhas.reduce((s, l) => s + l.quantidade, 0);
  const itemSel = selecionado ? carrinho[selecionado] : null;
  const precisaPreparo = linhas.some((l) => l.produto.precisaPreparacao);

  const add = (p: PdvProduto) => {
    if (p.controlaEstoque && p.disponivel <= 0) return;
    setCarrinho((c) => ({ ...c, [p.produtoId]: { produto: p, quantidade: (c[p.produtoId]?.quantidade ?? 0) + 1, descItem: c[p.produtoId]?.descItem ?? 0 } }));
    setSelecionado(p.produtoId);
  };
  const setQty = (id: string, q: number) => setCarrinho((c) => {
    if (q <= 0) { const cp = { ...c }; delete cp[id]; return cp; }
    return { ...c, [id]: { ...c[id], quantidade: q } };
  });
  const remover = (id: string) => { setCarrinho((c) => { const cp = { ...c }; delete cp[id]; return cp; }); setSelecionado((s) => (s === id ? null : s)); };
  const removerSelecionado = () => { if (selecionado) remover(selecionado); };
  const limpar = () => {
    setCarrinho({}); setSplits([]); setDescontoTotal(0); setSplitOn(false); setSelecionado(null);
    if (pixPolling) { clearInterval(pixPolling); setPixPolling(null); }
  };

  const addSplit = () => setSplits((s) => [...s, { forma: "DINHEIRO", valor: Math.max(0, falta) }]);
  const setSplit = (i: number, patch: Partial<Split>) => setSplits((s) => s.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const rmSplit = (i: number) => setSplits((s) => s.filter((_, k) => k !== i));

  // ============== Finalizar venda (Dinheiro / Cartão) ==============
  const vendaMutacao = useMutation({
    mutationFn: (modo: VendaPdvInput["modo"]) => {
      const pagamentos = splitOn && splits.length ? splits : [{ forma, valor: total }];
      return vendaPdvFila({ modo, desconto: +(descontoTotal + descItens).toFixed(2), itens: linhas.map((l) => ({ produtoId: l.produto.produtoId, quantidade: l.quantidade })), pagamentos });
    },
    onSuccess: (p) => {
      const pedidoNum = (p as LojaPedido).numero;
      setEstadoPgto({ tipo: "concluido", numero: pedidoNum });
      setTimeout(() => {
        fecharModal();
        limpar();
        setErro(null);
        qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
        qc.invalidateQueries({ queryKey: ["pdv-produtos"] });
      }, 2500);
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao registrar a venda."),
  });

  // ============== Fluxo PIX: checkout → iniciarPagamento → polling ==============
  const pixMutacao = useMutation({
    mutationFn: async () => {
      setEstadoPgto({ tipo: "pix_gerando" });
      // 1. Cria pedido via checkout PDV
      const pedidoCriado = await checkout({
        canal: "PDV",
        itens: linhas.map((l) => ({ produtoId: l.produto.produtoId, quantidade: l.quantidade })),
      });
      // 2. Inicia pagamento PIX (Asaas gera QR)
      const pgto = await iniciarPagamento(pedidoCriado.id, { forma: "PIX" });
      setEstadoPgto({ tipo: "pix_aguardando", pedido: pedidoCriado, pagamento: pgto });
      return { pedido: pedidoCriado, pagamento: pgto };
    },
    onSuccess: ({ pedido, pagamento }) => {
      // Polling a cada 3s para verificar confirmação
      const intervalo = setInterval(async () => {
        try {
          const atualizado = await buscarPedido(pedido.id);
          if (atualizado.status !== "AGUARDANDO_PAGAMENTO") {
            clearInterval(intervalo);
            setPixPolling(null);
            setEstadoPgto({ tipo: "pix_confirmado", pedido: atualizado });
            setTimeout(() => {
              fecharModal();
              limpar();
              qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
              qc.invalidateQueries({ queryKey: ["pdv-produtos"] });
            }, 2500);
          }
        } catch { /* ignora erros de polling */ }
      }, 3000);
      setPixPolling(intervalo);
    },
    onError: (e) => {
      setEstadoPgto({ tipo: "aguardando" });
      setErro(e instanceof ErroApi ? e.mensagem : "Falha ao gerar PIX.");
    },
  });

  // ============== Confirmar PIX manualmente (operador viu na maquininha) ==============
  const confirmarPixMutacao = useMutation({
    mutationFn: async (pedidoId: string) => {
      return confirmarPagamento(pedidoId);
    },
    onSuccess: (pedido) => {
      if (pixPolling) { clearInterval(pixPolling); setPixPolling(null); }
      setEstadoPgto({ tipo: "pix_confirmado", pedido: pedido as LojaPedido });
      setTimeout(() => {
        fecharModal();
        limpar();
        qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
        qc.invalidateQueries({ queryKey: ["pdv-produtos"] });
      }, 2500);
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao confirmar PIX."),
  });

  const abrirModalPagamento = () => {
    setEstadoPgto({ tipo: "aguardando" });
    setErro(null);
    setModal("pagamento");
  };

  const fecharModal = () => {
    setModal(null);
    setEstadoPgto({ tipo: "aguardando" });
  };

  const pagamentoSplitOk = splitOn ? (splits.length > 0 && Math.abs(falta) < 0.01) : true;
  const podeFinalizar = temItens && pagamentoSplitOk && podeOperar;
  const focarBusca = () => { buscaRef.current?.focus(); buscaRef.current?.select(); };

  // -------- Atalhos de teclado --------
  const ATALHOS: { tecla: string; label: string; onClick: () => void; ativo: boolean }[] = [
    { tecla: "F1", label: "Cliente", onClick: () => { setErro("Identificação de cliente — em breve"); setTimeout(() => setErro(null), 2500); }, ativo: true },
    { tecla: "F6", label: "Produto", onClick: focarBusca, ativo: true },
    { tecla: "F7", label: "Pagar", onClick: () => { if (podeFinalizar) abrirModalPagamento(); }, ativo: podeFinalizar },
    { tecla: "F8", label: "Remover item", onClick: removerSelecionado, ativo: !!selecionado },
    { tecla: "F9", label: "Cancelar venda", onClick: () => setModal("cancelar"), ativo: temItens },
    { tecla: "F10", label: "Desconto total", onClick: () => { if (temItens) setModal("descTotal"); }, ativo: temItens },
  ];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modal) { if (e.key === "Escape") { e.preventDefault(); if (modal !== "pagamento" || estadoPgto.tipo === "aguardando") fecharModal(); } return; }
      if (e.key === "F2") { e.preventDefault(); focarBusca(); return; }
      const a = ATALHOS.find((x) => x.tecla === e.key);
      if (a) { e.preventDefault(); if (a.ativo) a.onClick(); return; }
      const alvo = e.target as HTMLElement | null;
      const digitando = !!alvo && ["INPUT", "TEXTAREA", "SELECT"].includes(alvo.tagName);
      if (e.key === "-" && !digitando && selecionado) { e.preventDefault(); setModal("descItem"); return; }
      if (e.key === "Delete" && !digitando && selecionado) { e.preventDefault(); removerSelecionado(); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal, estadoPgto, selecionado, temItens, podeFinalizar, carrinho, splitOn, splits, forma]);

  const ind = indicadores.data;

  return (
    <div className={`bal-page ${temItens ? "com-carrinho" : "sem-carrinho"}`}>
      {/* ---------------- topo ---------------- */}
      <header className="bal-top">
        <div>
          <h1>PDV · <b>Venda rápida</b></h1>
          <p>Venda no balcão com split de pagamento — mesma fila e estoque</p>
        </div>
        <div className="bal-topright">
          <span className="bal-caixa"><span className="dot" /> CAIXA ABERTO</span>
          <div className="bal-op"><small>Atendimento</small><b>{perfil?.nome?.split(/[\s.]+/)[0] ?? "Operador"}</b></div>
          <button className="bal-iconbtn" title="Ler código de barras"><ScanLine size={18} /></button>
          <button className="bal-iconbtn" title="Notificações"><Bell size={18} /></button>
          <button className="bal-iconbtn"><MoreVertical size={18} /></button>
          <div className="bal-clock">
            <b>{agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</b>
            <small>{agora.toLocaleDateString("pt-BR")}</small>
          </div>
        </div>
      </header>

      {/* ---------------- corpo ---------------- */}
      <div className="bal-body">
        {/* catálogo */}
        <div className="bal-catalogo">
          <label className="bal-busca">
            <Search />
            <input ref={buscaRef} value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, SKU ou código de barras  ·  F6"
              onKeyDown={(e) => { if (e.key === "Enter" && lista.length === 1) { add(lista[0]); setBusca(""); } }} />
            <button className="bal-scan" title="Escanear"><ScanLine size={16} /></button>
          </label>

          <div className="bal-chips">
            <button className={`bal-chip ${!categoria ? "on" : ""}`} onClick={() => setCategoria("")}>Todos</button>
            {(categorias.data ?? []).filter((c) => c.ativo).map((c) => {
              const semEstoque = categoriasSemEstoque.has(c.nome);
              return (
                <button key={c.id}
                  className={`bal-chip ${categoria === c.nome ? "on" : ""} ${semEstoque ? "sem-estoque" : ""}`}
                  onClick={() => setCategoria(c.nome)}
                  title={semEstoque ? "Sem estoque disponível" : undefined}>
                  {c.nome}
                </button>
              );
            })}
          </div>

          <div className="bal-scroll">
            <div className="bal-grid">
              {lista.map((p) => {
                const s = selo(p);
                const esgotado = !!p.controlaEstoque && p.disponivel <= 0;
                return (
                  <button key={p.produtoId} className={`bal-card grupo-${grupoDe(p.categoria)}`} disabled={esgotado} onClick={() => add(p)}>
                    <div className="bal-thumb">
                      {p.imagemUrl ? <img src={p.imagemUrl} alt="" /> : <span className="ph">🛍️</span>}
                    </div>
                    {!esgotado && <span className="bal-add"><Plus size={16} /></span>}
                    <div className="bal-info">
                      <p className="nome">{p.descricao}</p>
                      <p className="cat">{p.categoria ?? "—"}</p>
                      {s && <div className={`bal-est ${s.cls}`}>{s.txt}</div>}
                      <div className="preco">{brl(p.preco)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {!produtos.isLoading && lista.length === 0 && <p className="bal-empty">Nenhum produto encontrado.</p>}
          </div>
        </div>

        {/* carrinho — só aparece quando há itens */}
        {temItens && (
          <aside className="bal-cart">
            <div className="bal-cart-head">
              <h2>Carrinho <small>({qtdItens} {qtdItens === 1 ? "item" : "itens"})</small></h2>
              <button className="bal-limpar" onClick={() => setModal("cancelar")}>Limpar <Trash2 size={13} /></button>
            </div>

            <div className="bal-itens">
              {linhas.map((l) => {
                const totLinha = l.produto.preco * l.quantidade - l.descItem;
                const sel = selecionado === l.produto.produtoId;
                return (
                  <div key={l.produto.produtoId} className={`bal-item ${sel ? "sel" : ""}`} onClick={() => setSelecionado(l.produto.produtoId)}>
                    <div className="bal-item-thumb">{l.produto.imagemUrl ? <img src={l.produto.imagemUrl} alt="" /> : <span>🛍️</span>}{sel && <span className="tick"><Check size={11} /></span>}</div>
                    <div>
                      <div className="nome">{l.produto.descricao}<button className="x" onClick={(e) => { e.stopPropagation(); remover(l.produto.produtoId); }}><X size={14} /></button></div>
                      <div className="un">{brl(l.produto.preco)}{l.descItem > 0 && <span className="descq"> · −{brl(l.descItem)}</span>}</div>
                      <div className="bal-item-foot">
                        <div className="bal-step" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setQty(l.produto.produtoId, l.quantidade - 1)}>−</button>
                          <b>{l.quantidade}</b>
                          <button onClick={() => setQty(l.produto.produtoId, l.quantidade + 1)}>+</button>
                        </div>
                        <span className="lt">{brl(totLinha)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* rodapé sticky: total + pagamento + finalizar */}
            <div className="bal-checkout">
              <div className="bal-tot">
                <div className="row"><span>Subtotal</span><span>{brl(brutoTotal)}</span></div>
                <div className="row"><span>Desconto</span><span className="desc">− {brl(descItens + descontoTotal)}</span></div>
                <div className="row grande"><span>Total</span><span>{brl(total)}</span></div>
              </div>

              <div className="bal-pay">
                <div className="bal-formas">
                  {FORMAS.map((f) => (
                    <button key={f.forma} className={`bal-forma ${!splitOn && forma === f.forma ? "on" : ""}`} disabled={splitOn} onClick={() => setForma(f.forma)}>
                      <f.Icone /> {f.label}
                    </button>
                  ))}
                  <button className={`bal-forma ${splitOn ? "on" : ""}`} onClick={() => { setSplitOn((v) => !v); setSplits([]); }}><Plus /> Split</button>
                </div>

                {splitOn && (
                  <div className="bal-splits">
                    {splits.map((s, i) => (
                      <div key={i} className="bal-splitrow">
                        <select value={s.forma} onChange={(e) => setSplit(i, { forma: e.target.value as FormaPagamento })}>
                          {FORMAS.map((f) => <option key={f.forma} value={f.forma}>{f.label}</option>)}
                          <option value="CARTAO_DEBITO">Débito</option>
                        </select>
                        <input type="number" min={0} step="0.01" value={s.valor} onChange={(e) => setSplit(i, { valor: Number(e.target.value) })} />
                        <button className="rm" onClick={() => rmSplit(i)}><Trash2 size={15} /></button>
                      </div>
                    ))}
                    <button className="bal-addsplit" onClick={addSplit}>+ Adicionar forma {falta > 0.001 ? `· falta ${brl(falta)}` : falta < -0.001 ? `· excede ${brl(-falta)}` : "· fecha ✓"}</button>
                  </div>
                )}

                {/* BOTÃO PRINCIPAL — abre modal de pagamento, nunca finaliza diretamente */}
                <button
                  className="bal-finalizar"
                  disabled={!podeFinalizar}
                  onClick={abrirModalPagamento}
                >
                  <QrCode size={18} /> Ir para pagamento · {brl(total)}
                </button>
                {precisaPreparo && (
                  <button
                    className="bal-preparar"
                    disabled={!podeFinalizar}
                    onClick={abrirModalPagamento}
                  >
                    <ChefHat size={16} /> Pagar e enviar p/ preparação
                  </button>
                )}
                {!podeOperar && <p className="bal-hint">Sem permissão para operar o caixa</p>}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ---------------- rodapé: atalhos F# + fila ---------------- */}
      <footer className="bal-status">
        <div className="bal-atalhos">
          {ATALHOS.map((a) => (
            <button key={a.tecla} className={`bal-atalho ${a.ativo ? "" : "off"}`} onClick={() => a.ativo && a.onClick()} title={a.label}>
              <kbd>{a.tecla}</kbd><span>{a.label}</span>
            </button>
          ))}
          <button className={`bal-atalho ${selecionado ? "" : "off"}`} onClick={() => selecionado && setModal("descItem")} title="Desconto do item selecionado">
            <kbd>−</kbd><span>Desc. item</span>
          </button>
          <button className={`bal-atalho ${selecionado ? "" : "off"}`} onClick={removerSelecionado} title="Apagar item selecionado">
            <kbd>Del</kbd><span>Apagar</span>
          </button>
        </div>
        <div className="bal-fila">
          <span className="it"><ChefHat size={15} /> Fila <b>{ind?.aguardandoFila ?? 0}</b></span>
          <span className="it">Preparo <b>{ind?.emPreparacao ?? 0}</b></span>
          <span className="it"><Check size={15} /> Prontos <b>{ind?.prontos ?? 0}</b></span>
        </div>
      </footer>

      {/* ===================== MODAL DE PAGAMENTO ===================== */}
      {modal === "pagamento" && (
        <ModalPagamento
          total={total}
          forma={splitOn ? "SPLIT" : forma}
          splits={splitOn ? splits : null}
          precisaPreparo={precisaPreparo}
          estado={estadoPgto}
          erro={erro}
          isPending={vendaMutacao.isPending || pixMutacao.isPending || confirmarPixMutacao.isPending}
          onFechar={() => {
            // Só fecha se não tem PIX pendente
            if (estadoPgto.tipo === "pix_aguardando" || estadoPgto.tipo === "pix_gerando") return;
            fecharModal();
          }}
          onFinalizarDinheiro={(modo, _recebido) => vendaMutacao.mutate(modo)}
          onFinalizarCartao={(modo) => vendaMutacao.mutate(modo)}
          onGerarPix={() => pixMutacao.mutate()}
          onConfirmarPixManual={(pedidoId) => confirmarPixMutacao.mutate(pedidoId)}
          onEstadoChange={setEstadoPgto}
        />
      )}

      {/* ---------------- outros modais ---------------- */}
      {modal === "descItem" && itemSel && (
        <ModalDesconto
          titulo="Desconto do item"
          subtitulo={itemSel.produto.descricao ?? "Item"}
          base={itemSel.produto.preco * itemSel.quantidade}
          onFechar={() => setModal(null)}
          onAplicar={(v) => { const id = itemSel.produto.produtoId; setCarrinho((c) => ({ ...c, [id]: { ...c[id], descItem: v } })); setModal(null); }}
        />
      )}
      {modal === "descTotal" && (
        <ModalDesconto
          titulo="Desconto na venda"
          subtitulo="Aplicado sobre o total"
          base={brutoTotal - descItens}
          onFechar={() => setModal(null)}
          onAplicar={(v) => { setDescontoTotal(v); setModal(null); }}
        />
      )}
      {modal === "cancelar" && (
        <div className="bal-modal-bg" onClick={() => setModal(null)}>
          <div className="bal-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancelar venda?</h3>
            <p>Todos os itens do carrinho serão removidos.</p>
            <div className="fim">
              <button className="bal-mbtn" onClick={() => setModal(null)}>Voltar</button>
              <button className="bal-mbtn perigo" onClick={() => { limpar(); setModal(null); }}>Cancelar venda</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// MODAL DE PAGAMENTO — o coração do checkout do balcão
// =====================================================================
function ModalPagamento({
  total, forma, splits, precisaPreparo, estado, erro, isPending,
  onFechar, onFinalizarDinheiro, onFinalizarCartao, onGerarPix, onConfirmarPixManual, onEstadoChange,
}: {
  total: number;
  forma: FormaPagamento | "SPLIT";
  splits: Split[] | null;
  precisaPreparo: boolean;
  estado: EstadoPagamento;
  erro: string | null;
  isPending: boolean;
  onFechar: () => void;
  onFinalizarDinheiro: (modo: VendaPdvInput["modo"], recebido: number) => void;
  onFinalizarCartao: (modo: VendaPdvInput["modo"]) => void;
  onGerarPix: () => void;
  onConfirmarPixManual: (pedidoId: string) => void;
  onEstadoChange: (e: EstadoPagamento) => void;
}) {
  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const [recebido, setRecebido] = useState("");
  const [copiado, setCopiado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (estado.tipo === "aguardando" || estado.tipo === "dinheiro") {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [estado.tipo]);

  const recebidoNum = Number(recebido.replace(",", ".")) || 0;
  const troco = Math.max(0, +(recebidoNum - total).toFixed(2));
  const trocoNegativo = recebidoNum > 0 && recebidoNum < total;

  const copiarPix = (texto: string) => {
    navigator.clipboard.writeText(texto).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); });
  };

  const modoVenda: VendaPdvInput["modo"] = precisaPreparo ? "ENVIAR_PREPARACAO" : "ENTREGAR_AGORA";

  // ------- CONCLUÍDO -------
  if (estado.tipo === "concluido") {
    return (
      <div className="bal-modal-bg">
        <div className="bal-modal bal-pgto-ok">
          <div className="bal-pgto-icon ok"><Check size={36} /></div>
          <h3>Venda concluída!</h3>
          <p>Pedido <b>#{estado.numero}</b> registrado com sucesso.</p>
        </div>
      </div>
    );
  }

  // ------- PIX CONFIRMADO -------
  if (estado.tipo === "pix_confirmado") {
    return (
      <div className="bal-modal-bg">
        <div className="bal-modal bal-pgto-ok">
          <div className="bal-pgto-icon ok"><Check size={36} /></div>
          <h3>PIX confirmado!</h3>
          <p>Pedido <b>#{estado.pedido.numero}</b> registrado.</p>
        </div>
      </div>
    );
  }

  // ------- PIX GERANDO -------
  if (estado.tipo === "pix_gerando") {
    return (
      <div className="bal-modal-bg">
        <div className="bal-modal bal-pgto-pix">
          <div className="bal-pgto-icon spin"><Loader2 size={36} /></div>
          <h3>Gerando PIX…</h3>
          <p>Aguarde, estamos criando o QR Code.</p>
        </div>
      </div>
    );
  }

  // ------- PIX AGUARDANDO (QR CODE) -------
  if (estado.tipo === "pix_aguardando") {
    const { pedido, pagamento } = estado;
    return (
      <div className="bal-modal-bg">
        <div className="bal-modal bal-pgto-pix" onClick={(e) => e.stopPropagation()}>
          <div className="bal-pgto-header">
            <QrCode size={22} />
            <h3>Aguardando pagamento PIX</h3>
          </div>
          <p className="bal-pgto-sub">Pedido <b>#{pedido.numero}</b> · Total <b>{brl(total)}</b></p>

          {/* QR Code visual */}
          {pagamento.pixQrcode ? (
            <div className="bal-pix-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(pagamento.pixQrcode)}`} alt="QR Code PIX" width={220} height={220} />
            </div>
          ) : (
            <div className="bal-pix-qr bal-pix-qr-vazio">
              <QrCode size={80} />
              <small>QR Code indisponível</small>
            </div>
          )}

          {/* Copia e cola */}
          {pagamento.pixCopiaCola && (
            <div className="bal-pix-copia">
              <input readOnly value={pagamento.pixCopiaCola} onClick={(e) => (e.target as HTMLInputElement).select()} />
              <button onClick={() => copiarPix(pagamento.pixCopiaCola!)} className={copiado ? "copiado" : ""}>
                {copiado ? <Check size={15} /> : <Copy size={15} />} {copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>
          )}

          <div className="bal-pix-status">
            <Loader2 size={16} className="spin-icon" /> Aguardando confirmação automática…
          </div>

          {pagamento.pixExpiracao && (
            <div className="bal-pix-exp">
              <Clock size={14} /> Expira em {new Date(pagamento.pixExpiracao).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}

          {erro && <p className="bal-err" style={{ marginTop: 8 }}>{erro}</p>}

          <div className="fim" style={{ marginTop: 16 }}>
            <button className="bal-mbtn" onClick={() => {
              // Confirmar manualmente (operador viu na conta)
              onConfirmarPixManual(pedido.id);
            }} disabled={isPending}>
              <Check size={15} /> Confirmar recebimento
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>
            Use "Confirmar recebimento" se o cliente pagou mas o sistema ainda não detectou.
          </p>
        </div>
      </div>
    );
  }

  // ------- TELA INICIAL DO MODAL: escolhe a forma -------
  return (
    <div className="bal-modal-bg" onClick={onFechar}>
      <div className="bal-modal bal-pgto-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="bal-pgto-header">
          <h3>Pagamento · <b>{brl(total)}</b></h3>
          <button className="bal-modal-fechar" onClick={onFechar}><X size={18} /></button>
        </div>

        {/* Split info */}
        {splits && (
          <div className="bal-pgto-split-info">
            {splits.map((s, i) => (
              <div key={i} className="row">
                <span>{s.forma === "PIX" ? "PIX" : s.forma === "DINHEIRO" ? "Dinheiro" : "Cartão"}</span>
                <b>{brl(s.valor)}</b>
              </div>
            ))}
          </div>
        )}

        {/* ------- DINHEIRO ------- */}
        {(forma === "DINHEIRO" || forma === "SPLIT") && !splits && (
          <div className="bal-pgto-dinheiro">
            <div className="bal-pgto-icon-label"><Banknote size={20} /> Pagamento em Dinheiro</div>
            <label>Valor recebido do cliente</label>
            <input
              ref={inputRef}
              className="bal-desc-input"
              inputMode="decimal"
              placeholder="0,00"
              value={recebido}
              onChange={(e) => setRecebido(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && recebidoNum >= total) {
                  onFinalizarDinheiro(modoVenda, recebidoNum);
                }
              }}
            />
            {recebidoNum > 0 && (
              <div className={`bal-troco ${trocoNegativo ? "insuficiente" : ""}`}>
                {trocoNegativo ? (
                  <><AlertCircle size={15} /> Valor insuficiente · falta {brl(total - recebidoNum)}</>
                ) : (
                  <><Check size={15} /> Troco: <b>{brl(troco)}</b></>
                )}
              </div>
            )}
            {erro && <p className="bal-err">{erro}</p>}
            <div className="fim">
              <button className="bal-mbtn" onClick={onFechar}>Voltar</button>
              <button
                className="bal-mbtn ouro"
                disabled={recebidoNum < total || isPending}
                onClick={() => onFinalizarDinheiro(modoVenda, recebidoNum)}
              >
                {isPending ? <Loader2 size={15} className="spin-icon" /> : <Check size={15} />}
                Confirmar · {brl(total)}
              </button>
            </div>
            {recebidoNum < total && recebidoNum > 0 && (
              <p style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                O botão habilita quando o valor recebido cobrir o total.
              </p>
            )}
          </div>
        )}

        {/* ------- CARTÃO ------- */}
        {forma === "CARTAO_CREDITO" && !splits && (
          <div className="bal-pgto-cartao">
            <div className="bal-pgto-icon-label"><CreditCard size={20} /> Pagamento no Cartão</div>
            <div className="bal-cartao-info">
              <p>Passe o cartão na maquininha Stone e aguarde a aprovação.</p>
              <div className="bal-cartao-valor">{brl(total)}</div>
              <p className="bal-cartao-hint">
                <AlertCircle size={13} /> Integração automática com Stone em implantação.
                Após aprovação na maquininha, clique em <b>Confirmar</b>.
              </p>
            </div>
            {erro && <p className="bal-err">{erro}</p>}
            <div className="fim">
              <button className="bal-mbtn" onClick={onFechar}>Voltar</button>
              <button
                className="bal-mbtn ouro"
                disabled={isPending}
                onClick={() => onFinalizarCartao(modoVenda)}
              >
                {isPending ? <Loader2 size={15} className="spin-icon" /> : <Check size={15} />}
                Confirmar aprovação · {brl(total)}
              </button>
            </div>
          </div>
        )}

        {/* ------- PIX ------- */}
        {forma === "PIX" && !splits && (
          <div className="bal-pgto-pix">
            <div className="bal-pgto-icon-label"><QrCode size={20} /> Pagamento via PIX</div>
            <p>Clique em <b>Gerar QR Code</b> para exibir o PIX ao cliente.<br />
              O sistema confirmará automaticamente após o pagamento.</p>
            {erro && <p className="bal-err">{erro}</p>}
            <div className="fim">
              <button className="bal-mbtn" onClick={onFechar}>Voltar</button>
              <button
                className="bal-mbtn ouro"
                disabled={isPending}
                onClick={onGerarPix}
              >
                {isPending ? <Loader2 size={15} className="spin-icon" /> : <QrCode size={15} />}
                Gerar QR Code
              </button>
            </div>
          </div>
        )}

        {/* ------- SPLIT ------- */}
        {splits && splits.length > 0 && (
          <div className="bal-pgto-cartao">
            <p>Confirme cada forma de pagamento individualmente no equipamento.<br />
              Após todos confirmados, clique em <b>Registrar venda</b>.</p>
            {erro && <p className="bal-err">{erro}</p>}
            <div className="fim">
              <button className="bal-mbtn" onClick={onFechar}>Voltar</button>
              <button
                className="bal-mbtn ouro"
                disabled={isPending}
                onClick={() => onFinalizarCartao(modoVenda)}
              >
                {isPending ? <Loader2 size={15} className="spin-icon" /> : <Check size={15} />}
                Registrar venda · {brl(total)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================================
// Modal de desconto (item ou total) — sem alterações
// =====================================================================
function ModalDesconto({ titulo, subtitulo, base, onFechar, onAplicar }: {
  titulo: string; subtitulo: string; base: number; onFechar: () => void; onAplicar: (valorEmReais: number) => void;
}) {
  const [tipo, setTipo] = useState<"reais" | "pct">("reais");
  const [valor, setValor] = useState("");
  const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const num = Number(valor.replace(",", ".")) || 0;
  const descReais = tipo === "reais" ? Math.min(num, base) : +(base * Math.min(num, 100) / 100).toFixed(2);
  const final = Math.max(0, base - descReais);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const aplicar = () => onAplicar(descReais);

  return (
    <div className="bal-modal-bg" onClick={onFechar}>
      <div className="bal-modal" onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); aplicar(); } if (e.key === "Escape") { e.preventDefault(); onFechar(); } }}>
        <h3>{titulo}</h3>
        <p>{subtitulo} · atual <b>{fmt(base)}</b></p>
        <div className="bal-desc-tipo">
          <button className={tipo === "reais" ? "on" : ""} onClick={() => setTipo("reais")}>R$</button>
          <button className={tipo === "pct" ? "on" : ""} onClick={() => setTipo("pct")}><Percent size={13} /> %</button>
        </div>
        <input ref={inputRef} className="bal-desc-input" inputMode="decimal" value={valor}
          onChange={(e) => setValor(e.target.value)} placeholder={tipo === "reais" ? "0,00" : "0"} />
        <div className="bal-desc-resumo">
          <div><span>Original</span><b>{fmt(base)}</b></div>
          <div><span>Desconto</span><b className="down">− {fmt(descReais)}</b></div>
          <div><span>Final</span><b className="up">{fmt(final)}</b></div>
        </div>
        <div className="fim">
          <button className="bal-mbtn" onClick={onFechar}>Cancelar <kbd>ESC</kbd></button>
          <button className="bal-mbtn ouro" onClick={aplicar}>Aplicar <kbd>Enter</kbd></button>
        </div>
      </div>
    </div>
  );
}
