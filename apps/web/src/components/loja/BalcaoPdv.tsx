"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote, Barcode, Camera, Check, ChefHat, CreditCard, ImageOff, KeyRound, Link2,
  Loader2, Pencil, Percent, Plus, QrCode, ScanLine, Search, SquarePen, Star, Trash2, X, Copy,
  AlertCircle, Clock, User, UserPlus,
} from "lucide-react";
import {
  lojaBuscarPorBarcode, lojaCategorias, lojaAtualizarCodigoBarras, lojaDefinirDestaque,
  lojaAtualizarProduto, lojaEnviarImagemProduto, lojaProduto as buscarProduto,
} from "@/services/api/loja-produtos";
import type { LojaProduto } from "@/types/loja-produtos";
import { RetiradaLoja } from "@/components/loja/RetiradaLoja";
import { AtenderCodigo } from "@/components/loja/AtenderCodigo";
import {
  lojaPedidosIndicadores, lojaProdutosBalcao, vendaPdvFila,
  checkout, iniciarPagamento, confirmarPagamento, lojaPedido as buscarPedido,
} from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import type { PdvProduto } from "@/types/pdv";
import { Select } from "@/components/ui/Select";
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
interface Cliente { nome: string; tel: string }

// ==================== Estado do modal de pagamento ====================
type EstadoPagamento =
  | { tipo: "aguardando" }                          // modal aberto, escolhendo forma
  | { tipo: "dinheiro"; recebido: string }           // digitando valor recebido
  | { tipo: "cartao"; confirmado: boolean }          // aguardando operador confirmar na maquininha
  | { tipo: "pix_gerando" }                          // criando pedido + QR Code
  | { tipo: "pix_aguardando"; pedido: LojaPedido; pagamento: LojaPedidoPagamento } // exibindo QR
  | { tipo: "pix_confirmado"; pedido: LojaPedido }   // PIX confirmado
  | { tipo: "concluido"; numero: number }            // venda registrada com sucesso

/** EAN bipado mas não encontrado no cadastro — pede pro operador associar ao produto correto */
interface EanNaoEncontrado { ean: string }

function selo(p: PdvProduto): { txt: string; cls: string } | null {
  if (!p.controlaEstoque) return null;
  if (p.vendeSemEstoque) return { txt: "Sem limite", cls: "ok" };
  if (p.disponivel <= 0) return { txt: "Esgotado", cls: "zero" };
  if (p.disponivel <= 5) return { txt: "Últimas unidades", cls: "baixo" };
  return { txt: "Em estoque", cls: "ok" };
}

function grupoDe(cat?: string | null): string {
  return (cat ?? "outros").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "") || "outros";
}

export function BalcaoPdv() {
  const qc = useQueryClient();
  const router = useRouter();
  const perfil = usePerfil(useSessao()).data;
  const podeOperar = pode(perfil, "loja.pedidos.operar");
  const podeGerir = pode(perfil, "loja.produtos.gerenciar");

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
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [modal, setModal] = useState<null | "descItem" | "descTotal" | "cancelar" | "pagamento" | "cliente" | "ean_nao_encontrado" | "retiradaQr" | "retiradaCod">(null);
  const [editarProduto, setEditarProduto] = useState<PdvProduto | null>(null);
  const [eanPendente, setEanPendente] = useState<EanNaoEncontrado | null>(null);
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

  // Destaques do balcão: emDestaque=true OU categoria Bebidas, sem esgotados
  const destaquesBal = useMemo(() => {
    const rows = produtos.data ?? [];
    const set = new Set<string>();
    const result: PdvProduto[] = [];
    for (const p of rows) {
      const esgotado = p.controlaEstoque && !p.vendeSemEstoque && p.disponivel <= 0;
      const ehBebida = /bebida/i.test(p.categoria ?? "");
      if (!esgotado && (p.emDestaque || ehBebida)) {
        if (!set.has(p.produtoId)) { set.add(p.produtoId); result.push(p); }
      }
    }
    return result;
  }, [produtos.data]);

  const categoriasSemEstoque = useMemo(() => {
    const rows = produtos.data ?? [];
    const sem = new Set<string>();
    (categorias.data ?? []).filter((c) => c.ativo).forEach((c) => {
      const prodsCat = rows.filter((p) => p.categoria === c.nome);
      const todasEsgotadas = prodsCat.length > 0 && prodsCat.every((p) => p.controlaEstoque && !p.vendeSemEstoque && p.disponivel <= 0);
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

  // Favoritar (estrela no card) — marca/desmarca destaque, otimista sobre o cache do PDV.
  const destaqueMut = useMutation({
    mutationFn: ({ id, emDestaque }: { id: string; emDestaque: boolean }) => lojaDefinirDestaque(id, emDestaque),
    onMutate: async ({ id, emDestaque }) => {
      await qc.cancelQueries({ queryKey: ["pdv-produtos"] });
      const anterior = qc.getQueriesData<PdvProduto[]>({ queryKey: ["pdv-produtos"] });
      anterior.forEach(([key, rows]) => {
        if (rows) qc.setQueryData(key, rows.map((r) => (r.produtoId === id ? { ...r, emDestaque } : r)));
      });
      return { anterior };
    },
    onError: (_e, _v, ctx) => ctx?.anterior?.forEach(([key, rows]) => qc.setQueryData(key, rows)),
    onSettled: () => qc.invalidateQueries({ queryKey: ["pdv-produtos"] }),
  });
  const toggleDestaque = (p: PdvProduto) => destaqueMut.mutate({ id: p.produtoId, emDestaque: !p.emDestaque });
  /** Abre o cadastro completo do produto (aba Catálogo) já no modal de edição. */
  const abrirCadastro = (p: PdvProduto) => router.push(`/loja/produtos?editar=${p.produtoId}`);

  const add = (p: PdvProduto) => {
    if (p.controlaEstoque && !p.vendeSemEstoque && p.disponivel <= 0) return;
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
    setCarrinho({}); setSplits([]); setDescontoTotal(0); setSplitOn(false); setSelecionado(null); setCliente(null);
    if (pixPolling) { clearInterval(pixPolling); setPixPolling(null); }
  };

  const addSplit = () => setSplits((s) => [...s, { forma: "DINHEIRO", valor: Math.max(0, falta) }]);
  const setSplit = (i: number, patch: Partial<Split>) => setSplits((s) => s.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const rmSplit = (i: number) => setSplits((s) => s.filter((_, k) => k !== i));

  // ============== Finalizar venda (Dinheiro / Cartão) ==============
  const vendaMutacao = useMutation({
    mutationFn: (modo: VendaPdvInput["modo"]) => {
      const pagamentos = splitOn && splits.length ? splits : [{ forma, valor: total }];
      return vendaPdvFila({
        modo,
        clienteNome: cliente?.nome || undefined,
        clienteTel: cliente?.tel || undefined,
        desconto: +(descontoTotal + descItens).toFixed(2),
        itens: linhas.map((l) => ({ produtoId: l.produto.produtoId, quantidade: l.quantidade })),
        pagamentos,
      });
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
        clienteNome: cliente?.nome || undefined,
        clienteTel: cliente?.tel || undefined,
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

  // ------ Lógica de EAN / código de barras ------
  /** Detecta se o texto digitado parece um código de barras numérico (8-14 dígitos) */
  const pareceEan = (txt: string) => /^\d{8,14}$/.test(txt.trim());

  /** Ao pressionar Enter no campo de busca: se parecer EAN, tenta busca direta por barcode */
  const tentarBuscarPorEan = async (codigo: string) => {
    if (!pareceEan(codigo)) return false;
    try {
      const prod = await lojaBuscarPorBarcode(codigo);
      // Produto encontrado! Adiciona ao carrinho e limpa busca
      const pdvProd = (produtos.data ?? []).find((p) => p.produtoId === prod.id);
      if (pdvProd) {
        add(pdvProd);
        setBusca("");
        return true;
      }
      // Produto existe mas não está na lista PDV (ex: sem estoque/vendePdv=false)
      setBusca("");
      return true;
    } catch {
      // 404 → EAN não cadastrado
      setEanPendente({ ean: codigo });
      setModal("ean_nao_encontrado");
      setBusca("");
      return true;
    }
  };

  // -------- Atalhos de teclado --------
  // F1 = Cliente  |  F2 = Retirada QR  |  F3 = Retirada por código  |
  // F6 = Focar busca/scanner  |  F7 = Pagar  |  F9 = Cancelar venda  |  F10 = Desconto total
  // "-" = Desconto do item selecionado  |  Delete/F8 = Remover item selecionado
  const ATALHOS: { tecla: string; label: string; onClick: () => void; ativo: boolean }[] = [
    { tecla: "F1",  label: "Cliente",         onClick: () => setModal("cliente"),        ativo: true },
    { tecla: "F2",  label: "Retirada QR",     onClick: () => setModal("retiradaQr"),     ativo: true },
    { tecla: "F3",  label: "Retirada código", onClick: () => setModal("retiradaCod"),    ativo: true },
    { tecla: "F6",  label: "Produto",         onClick: focarBusca,                       ativo: true },
    { tecla: "F7",  label: "Pagar",           onClick: abrirModalPagamento,              ativo: podeFinalizar },
    { tecla: "F8",  label: "Desc. item",      onClick: () => setModal("descItem"),       ativo: !!selecionado },
    { tecla: "F9",  label: "Cancelar venda",  onClick: () => setModal("cancelar"),       ativo: temItens },
    { tecla: "F10", label: "Desconto total",  onClick: () => setModal("descTotal"),      ativo: temItens },
  ];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignora auto-repeat de tecla segurada: manter F6 pressionado dispararia
      // focus()/select() centenas de vezes/s e podia travar a aba.
      if (e.repeat) return;
      if (modal) { if (e.key === "Escape") { e.preventDefault(); if (modal !== "pagamento" || estadoPgto.tipo === "aguardando") fecharModal(); } return; }
      const a = ATALHOS.find((x) => x.tecla === e.key);
      if (a) { e.preventDefault(); if (a.ativo) { try { a.onClick(); } catch { /* nunca deixa um atalho travar a tela */ } } return; }
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
          <button
            className={`bal-cliente-chip ${cliente ? "on" : ""}`}
            onClick={() => setModal("cliente")}
            title={cliente ? "Editar cliente (F1)" : "Identificar cliente (F1)"}
          >
            {cliente ? <User size={15} /> : <UserPlus size={15} />}
            <span>{cliente ? cliente.nome : "Cliente"}</span>
          </button>
          <div className="bal-op"><small>Atendimento</small><b>{perfil?.nome?.split(/[\s.]+/)[0] ?? "Operador"}</b></div>
          <button className="bal-iconbtn" title="Retirada por QR Code (F2)" onClick={() => setModal("retiradaQr")}><QrCode size={18} /></button>
          <button className="bal-iconbtn" title="Retirada por código de 3 dígitos (F3)" onClick={() => setModal("retiradaCod")}><KeyRound size={18} /></button>
          <button className="bal-iconbtn" title="Ler código de barras / buscar produto (F6)" onClick={focarBusca}><ScanLine size={18} /></button>
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
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Tenta EAN primeiro (Scanner bipa e dispara Enter)
                  const eanOk = await tentarBuscarPorEan(busca);
                  if (!eanOk && lista.length === 1) { add(lista[0]); setBusca(""); }
                  else if (!eanOk && lista.length > 1) { /* continua mostrando a lista */ }
                }
              }} />
            <button className="bal-scan" title="Focar busca / escanear (F6)" onClick={focarBusca}><ScanLine size={16} /></button>
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
            {/* ---- Destaques: bebidas + emDestaque (só quando não há busca/categoria ativa) ---- */}
            {destaquesBal.length > 0 && !busca && !categoria && (
              <div className="bal-destaques">
                <div className="bal-destaques-head">
                  <span className="bal-destaques-star">⭐</span>
                  <span>Destaques &amp; Bebidas</span>
                </div>
                <div className="bal-destaques-rail">
                  {destaquesBal.map((p) => (
                    <CardProdutoBalcao
                      key={p.produtoId}
                      produto={p}
                      podeGerir={podeGerir}
                      onAdd={() => add(p)}
                      onLongPress={() => podeGerir && setEditarProduto(p)}
                      onToggleDestaque={() => toggleDestaque(p)}
                      onAbrirCadastro={() => abrirCadastro(p)}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="bal-grid">
              {lista.map((p) => (
                <CardProdutoBalcao
                  key={p.produtoId}
                  produto={p}
                  podeGerir={podeGerir}
                  onAdd={() => add(p)}
                  onLongPress={() => podeGerir && setEditarProduto(p)}
                  onToggleDestaque={() => toggleDestaque(p)}
                  onAbrirCadastro={() => abrirCadastro(p)}
                />
              ))}
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
                        <Select aria-label="Forma de pagamento" value={s.forma} onChange={(v) => setSplit(i, { forma: v as FormaPagamento })} style={{ flex: 1 }}
                          options={[...FORMAS.map((f) => ({ value: f.forma, label: f.label })), { value: "CARTAO_DEBITO", label: "Débito" }]} />
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
          {/* "-" e Delete são atalhos de teclado extras (não constam no array ATALHOS) */}
          <button className={`bal-atalho ${selecionado ? "" : "off"}`} onClick={() => selecionado && setModal("descItem")} title="Atalho de teclado: tecla − (hífen)">
            <kbd>−</kbd><span>Desc. item</span>
          </button>
          <button className={`bal-atalho ${selecionado ? "" : "off"}`} onClick={removerSelecionado} title="Atalho de teclado: Delete">
            <kbd>Del</kbd><span>Remover</span>
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
      {modal === "cliente" && (
        <ModalCliente
          inicial={cliente}
          onFechar={() => setModal(null)}
          onSalvar={(c) => { setCliente(c); setModal(null); }}
          onLimpar={() => { setCliente(null); setModal(null); }}
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
      {(modal === "retiradaQr" || modal === "retiradaCod") && (
        <div className="bal-modal-bg" onClick={() => setModal(null)}>
          <div className="bal-modal bal-modal-retirada" onClick={(e) => e.stopPropagation()}>
            <button className="bal-iconbtn bal-modal-x" onClick={() => setModal(null)} title="Fechar (Esc)"><X size={18} /></button>
            <div className="bal-modal-retirada-corpo">
              {modal === "retiradaQr" ? <RetiradaLoja /> : <AtenderCodigo />}
            </div>
          </div>
        </div>
      )}
      {modal === "ean_nao_encontrado" && eanPendente && (
        <ModalAssociarEan
          ean={eanPendente.ean}
          produtos={produtos.data ?? []}
          onFechar={() => { setModal(null); setEanPendente(null); focarBusca(); }}
          onAssociado={() => {
            setModal(null);
            setEanPendente(null);
            qc.invalidateQueries({ queryKey: ["pdv-produtos"] });
            qc.invalidateQueries({ queryKey: ["loja"] });
            focarBusca();
          }}
          onAdicionarDireto={(prod) => {
            add(prod);
            setModal(null);
            setEanPendente(null);
          }}
        />
      )}

      {/* ---- Modal edição rápida de produto (long-press no card) ---- */}
      {editarProduto && (
        <ModalEditarProdutoPdv
          produto={editarProduto}
          categorias={categorias.data ?? []}
          onFechar={() => setEditarProduto(null)}
          onSalvo={(atualizado) => {
            // Atualiza o produto na lista local sem precisar recarregar tudo
            qc.invalidateQueries({ queryKey: ["pdv-produtos"] });
            qc.invalidateQueries({ queryKey: ["loja"] });
            setEditarProduto(null);
          }}
        />
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
            Use &quot;Confirmar recebimento&quot; se o cliente pagou mas o sistema ainda não detectou.
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
// Modal de identificação do cliente (F1) — nome + telefone opcionais
// =====================================================================
function ModalCliente({ inicial, onFechar, onSalvar, onLimpar }: {
  inicial: Cliente | null;
  onFechar: () => void;
  onSalvar: (c: Cliente) => void;
  onLimpar: () => void;
}) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [tel, setTel] = useState(inicial?.tel ?? "");
  const nomeRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => nomeRef.current?.focus(), 60); }, []);

  // Máscara leve de telefone (BR)
  const fmtTel = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const salvar = () => {
    const n = nome.trim();
    if (!n) { nomeRef.current?.focus(); return; }
    onSalvar({ nome: n, tel: tel.replace(/\D/g, "") });
  };

  return (
    <div className="bal-modal-bg" onClick={onFechar}>
      <div className="bal-modal" onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); salvar(); } if (e.key === "Escape") { e.preventDefault(); onFechar(); } }}>
        <h3>Identificar cliente</h3>
        <p>Vincula o nome ao pedido, comprovante e WhatsApp de aviso.</p>
        <label className="bal-cli-label">Nome do cliente</label>
        <input ref={nomeRef} className="bal-desc-input bal-cli-input" value={nome}
          onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Silva" autoComplete="off" />
        <label className="bal-cli-label">Telefone / WhatsApp <span className="bal-cli-opt">(opcional)</span></label>
        <input className="bal-desc-input bal-cli-input" inputMode="numeric" value={fmtTel(tel)}
          onChange={(e) => setTel(e.target.value)} placeholder="(71) 90000-0000" autoComplete="off" />
        <div className="fim">
          {inicial
            ? <button className="bal-mbtn perigo" onClick={onLimpar}>Remover</button>
            : <button className="bal-mbtn" onClick={onFechar}>Cancelar <kbd>ESC</kbd></button>}
          <button className="bal-mbtn ouro" onClick={salvar} disabled={!nome.trim()}>Salvar <kbd>Enter</kbd></button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Modal de associação de EAN — produto não encontrado pelo barcode
// =====================================================================
/**
 * Aparece quando o operador bipa um EAN que não está cadastrado.
 * Mostra o EAN bipado, lista os produtos do PDV para o operador
 * escolher qual produto corresponde a esse EAN, e salva a associação
 * (PATCH /loja/produtos/:id/codigo-barras). Na próxima bipada, o produto
 * será encontrado direto.
 */
function ModalAssociarEan({
  ean, produtos, onFechar, onAssociado, onAdicionarDireto,
}: {
  ean: string;
  produtos: PdvProduto[];
  onFechar: () => void;
  onAssociado: () => void;
  onAdicionarDireto: (p: PdvProduto) => void;
}) {
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<PdvProduto | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [eanNovoInput, setEanNovoInput] = useState(ean); // permite redigitar/bipar outro EAN
  const eanRef = useRef<HTMLInputElement>(null);

  const buscaRef = useRef<HTMLInputElement>(null);
  useEffect(() => { buscaRef.current?.focus(); }, []);

  const lista = useMemo(() => {
    if (!busca.trim()) return produtos.filter((p) => !p.controlaEstoque || p.vendeSemEstoque || p.disponivel > 0);
    const q = busca.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return produtos.filter((p) => {
      const n = (p.descricao ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return n.includes(q) || (p.codigo ?? "").includes(busca);
    });
  }, [produtos, busca]);

  const associar = useMutation({
    mutationFn: () => lojaAtualizarCodigoBarras(selecionado!.produtoId, eanNovoInput.trim()),
    onSuccess: onAssociado,
    onError: (e) => setErro(e instanceof Error ? e.message : "Falha ao associar."),
  });

  return (
    <div className="bal-modal-bg" onClick={onFechar}>
      <div className="bal-modal lg bal-ean-modal" onClick={(e) => e.stopPropagation()}>
        <div className="bal-ean-header">
          <Barcode size={20} />
          <div>
            <h3>EAN não encontrado no cadastro</h3>
            <p>Código bipado: <code className="bal-ean-code">{ean}</code></p>
          </div>
          <button className="bal-iconbtn" onClick={onFechar}><X size={18} /></button>
        </div>

        <p className="bal-ean-instrucao">
          <strong>Selecione o produto correspondente</strong> na lista abaixo para associar este código de barras.
          Na próxima vez que bipar, o produto será encontrado automaticamente.
        </p>

        {/* Campo para redigitar/bipar outro EAN (caso o operador tenha bipado errado) */}
        <div className="bal-ean-recode">
          <label>Código de barras a associar</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              ref={eanRef}
              className="bal-desc-input"
              value={eanNovoInput}
              placeholder="Bipe o produto novamente…"
              onChange={(e) => setEanNovoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); buscaRef.current?.focus(); } }}
              style={{ flex: 1 }}
            />
            <button type="button" className="bal-mbtn" style={{ whiteSpace: "nowrap" }} onClick={() => { eanRef.current?.focus(); eanRef.current?.select(); }}>
              <ScanLine size={14} /> Bipar novamente
            </button>
          </div>
          <small style={{ color: "var(--muted)", fontSize: 11 }}>Ou bipe o produto diretamente neste campo para usar o EAN correto</small>
        </div>

        {/* Busca de produto */}
        <label className="bal-busca" style={{ margin: "12px 0 8px" }}>
          <Search size={14} />
          <input ref={buscaRef} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar produto por nome ou SKU…" />
        </label>

        <div className="bal-ean-lista">
          {lista.slice(0, 30).map((p) => (
            <button
              key={p.produtoId}
              className={`bal-ean-item ${selecionado?.produtoId === p.produtoId ? "sel" : ""}`}
              onClick={() => setSelecionado(p)}
            >
              {p.imagemUrl
                ? <img src={p.imagemUrl} alt="" className="bal-ean-thumb" />
                : <div className="bal-ean-thumb ph"><Barcode size={14} /></div>}
              <div className="bal-ean-item-info">
                <b>{p.descricao}</b>
                <small>{p.categoria ?? "—"}{p.codigo ? ` · ${p.codigo}` : ""}</small>
              </div>
              <div className="bal-ean-item-preco">
                {brl(p.preco)}
                {selecionado?.produtoId === p.produtoId && <Check size={14} style={{ color: "var(--up)" }} />}
              </div>
            </button>
          ))}
          {lista.length === 0 && <p className="bal-empty">Nenhum produto encontrado.</p>}
        </div>

        {selecionado && (
          <div className="bal-ean-sel-info">
            <Link2 size={14} />
            <span><b>{selecionado.descricao}</b> receberá o código <code>{eanNovoInput.trim()}</code></span>
          </div>
        )}

        {erro && <p className="bal-err">{erro}</p>}

        <div className="fim" style={{ marginTop: 12 }}>
          <button className="bal-mbtn" onClick={onFechar}>Cancelar</button>
          {selecionado && (
            <button className="bal-mbtn" onClick={() => onAdicionarDireto(selecionado)}>
              <Plus size={14} /> Só adicionar (sem associar EAN)
            </button>
          )}
          <button
            className="bal-mbtn ouro"
            disabled={!selecionado || !eanNovoInput.trim() || associar.isPending}
            onClick={() => associar.mutate()}
          >
            {associar.isPending ? <Loader2 size={14} className="spin-icon" /> : <Link2 size={14} />}
            {associar.isPending ? "Associando…" : "Associar EAN e adicionar ao carrinho"}
          </button>
        </div>
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

// =====================================================================
// Componente card de produto — isola o hook useLongPressProps do .map()
// =====================================================================
function CardProdutoBalcao({
  produto: p, onAdd, onLongPress, podeGerir = false, onToggleDestaque, onAbrirCadastro,
}: {
  produto: PdvProduto;
  onAdd: () => void;
  onLongPress: () => void;
  podeGerir?: boolean;
  onToggleDestaque?: () => void;
  onAbrirCadastro?: () => void;
}) {
  const s = selo(p);
  // Impede que clicar nos botões-satélite dispare add / long-press do card.
  const isolar = (fn?: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); fn?.(); };
  const pararPress = (e: React.MouseEvent) => e.stopPropagation();
  const esgotado = !!p.controlaEstoque && !p.vendeSemEstoque && p.disponivel <= 0;
  // useLongPressProps já retorna um onClick que bloqueia o click quando long-press dispara
  // precisamos mesclar com onAdd: chamamos onAdd após a checagem do hook
  const { onClick: longPressClick, ...longPressRest } = useLongPressProps(onLongPress);
  const handleClick = (e: React.MouseEvent) => {
    longPressClick(e); // bloqueia quando long-press
    if (!e.defaultPrevented) onAdd();
  };
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onLongPress();
  };
  return (
    <button
      className={`bal-card grupo-${grupoDe(p.categoria)}`}
      disabled={esgotado}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      {...longPressRest}
    >
      <div className="bal-thumb">
        {p.imagemUrl ? <img src={p.imagemUrl} alt="" /> : <span className="ph">🛍️</span>}
      </div>
      {podeGerir && (
        <span className="bal-card-tools" onMouseDown={pararPress}>
          {onToggleDestaque && (
            <span
              className={`bal-fav${p.emDestaque ? " on" : ""}`}
              role="button" tabIndex={-1}
              title={p.emDestaque ? "Remover dos destaques" : "Marcar como favorito (vai para o carrossel)"}
              onClick={isolar(onToggleDestaque)} onContextMenu={isolar()}
            >
              <Star size={14} />
            </span>
          )}
          {onAbrirCadastro && (
            <span
              className="bal-cad"
              role="button" tabIndex={-1}
              title="Abrir cadastro completo do produto"
              onClick={isolar(onAbrirCadastro)} onContextMenu={isolar()}
            >
              <SquarePen size={13} />
            </span>
          )}
        </span>
      )}
      {!esgotado && <span className="bal-add"><Plus size={16} /></span>}
      <div className="bal-info">
        <p className="nome">{p.descricao}</p>
        <p className="cat">{p.categoria ?? "—"}</p>
        {s && <div className={`bal-est ${s.cls}`}>{s.txt}</div>}
        <div className="preco">{brl(p.preco)}</div>
      </div>
    </button>
  );
}

// =====================================================================
// Hook: useLongPressProps
// Retorna props para um elemento que dispara onLongPress após 500ms.
// Funciona tanto em touch (mobile) quanto em mouse (desktop).
// =====================================================================
function useLongPressProps(onLongPress: () => void, delay = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  const start = useCallback(() => {
    fired.current = false;
    timer.current = setTimeout(() => {
      fired.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const cancel = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); start(); },
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    // Bloqueia o click normal quando long-press foi disparado
    onClick: (e: React.MouseEvent) => { if (fired.current) { e.preventDefault(); e.stopPropagation(); fired.current = false; } },
  };
}

// =====================================================================
// Modal de edição rápida de produto (acionado por long-press no PDV)
// =====================================================================
function ModalEditarProdutoPdv({
  produto: prodInicial,
  categorias,
  onFechar,
  onSalvo,
}: {
  produto: PdvProduto;
  categorias: { id: string; nome: string; ativo: boolean }[];
  onFechar: () => void;
  onSalvo: (atualizado: LojaProduto) => void;
}) {
  const [nome, setNome] = useState(prodInicial.descricao ?? "");
  const [ean, setEan] = useState("");
  const [preco, setPreco] = useState(String(prodInicial.preco / 100 > 1 ? prodInicial.preco : prodInicial.preco));
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [exibeCardapio, setExibeCardapio] = useState(true);
  const [imagemUrl, setImagemUrl] = useState(prodInicial.imagemUrl ?? "");
  const [enviandoImg, setEnviandoImg] = useState(false);
  const [erroImg, setErroImg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Carrega EAN atual do produto (vem da API completa)
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
      // Atualiza nome e preço se ainda estiverem com os valores iniciais
      if (nome === prodInicial.descricao) setNome(prodQuery.data.nome);
      const precoApi = Number(prodQuery.data.preco);
      if (!isNaN(precoApi)) setPreco(precoApi.toFixed(2).replace(".", ","));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prodQuery.data]);

  async function processarImagem(arquivo: File) {
    setErroImg(null);
    const urlLocal = URL.createObjectURL(arquivo);
    setImagemUrl(urlLocal);
    setEnviandoImg(true);
    try {
      URL.revokeObjectURL(urlLocal);
      const { url } = await lojaEnviarImagemProduto(arquivo, arquivo.name || "produto.png");
      setImagemUrl(url);
    } catch (e) {
      URL.revokeObjectURL(urlLocal);
      setImagemUrl(prodInicial.imagemUrl ?? "");
      setErroImg(e instanceof Error ? e.message : "Falha ao enviar imagem.");
    } finally {
      setEnviandoImg(false);
      if (fileRef.current) fileRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
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
        emDestaque: prodData.emDestaque,
        estoqueMinimo: Number(prodData.estoqueMinimo) ?? 0,
      };
      return lojaAtualizarProduto(prodData.id, payload);
    },
    onSuccess: onSalvo,
    onError: (e) => setErro(e instanceof Error ? e.message : "Falha ao salvar."),
  });

  const carregando = prodQuery.isLoading;

  return (
    <div className="bal-modal-bg" onClick={onFechar}>
      <div className="bal-modal bal-edprod" onClick={(e) => e.stopPropagation()}>
        {/* cabeçalho */}
        <div className="bal-edprod-head">
          <Pencil size={18} />
          <div>
            <h3>Editar produto</h3>
            <p className="bal-edprod-sub">{prodInicial.descricao}</p>
          </div>
          <button className="bal-iconbtn" onClick={onFechar}><X size={18} /></button>
        </div>

        {carregando ? (
          <div className="bal-edprod-loading"><Loader2 size={28} className="spin-icon" /> Carregando…</div>
        ) : (
          <>
            {/* Imagem */}
            <div className="bal-edprod-img-area">
              <div
                className={`bal-edprod-preview ${imagemUrl ? "" : "vazio"}`}
                onClick={() => !enviandoImg && fileRef.current?.click()}
              >
                {imagemUrl ? (
                  <img src={imagemUrl} alt="" />
                ) : (
                  <span><ImageOff size={32} /><small>Sem imagem</small></span>
                )}
                {enviandoImg && (
                  <div className="bal-edprod-sending">
                    <Loader2 size={28} className="spin-icon" />
                  </div>
                )}
              </div>

              <div className="bal-edprod-img-btns">
                {/* Câmera (mobile: abre câmera diretamente) */}
                <button
                  type="button"
                  className="bal-mbtn ouro"
                  disabled={enviandoImg}
                  onClick={() => cameraRef.current?.click()}
                >
                  <Camera size={15} /> Tirar foto
                </button>
                {/* Galeria / arquivo */}
                <button
                  type="button"
                  className="bal-mbtn"
                  disabled={enviandoImg}
                  onClick={() => fileRef.current?.click()}
                >
                  {imagemUrl ? "Trocar" : "Galeria"}
                </button>
                {imagemUrl && (
                  <button
                    type="button"
                    className="bal-mbtn"
                    disabled={enviandoImg}
                    onClick={() => setImagemUrl("")}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {erroImg && <p className="bal-err">{erroImg}</p>}

              {/* inputs file ocultos */}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void processarImagem(f); }} />
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void processarImagem(f); }} />
            </div>

            {/* Campos */}
            <div className="bal-edprod-campos">
              <label>
                <span>Nome do produto</span>
                <input
                  className="bal-desc-input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do produto"
                />
              </label>

              <label>
                <span>Código de barras (EAN)</span>
                <div className="bal-edprod-ean-row">
                  <input
                    className="bal-desc-input"
                    value={ean}
                    onChange={(e) => setEan(e.target.value)}
                    placeholder="Ex: 7891234567890"
                    inputMode="numeric"
                  />
                  <button
                    type="button"
                    className="bal-mbtn"
                    title="Escanear EAN"
                    onClick={() => {
                      // Tenta usar câmera para scanner (fallback: campo de texto)
                      cameraRef.current?.click();
                    }}
                  >
                    <Barcode size={15} />
                  </button>
                </div>
              </label>

              <label>
                <span>Categoria</span>
                <Select
                  className="bal-desc-input"
                  aria-label="Categoria"
                  style={{ width: "100%" }}
                  value={categoriaId}
                  onChange={setCategoriaId}
                  options={[{ value: "", label: "Sem categoria" }, ...categorias.filter((c) => c.ativo).map((c) => ({ value: c.id, label: c.nome }))]}
                />
              </label>

              <label>
                <span>Preço (R$)</span>
                <input
                  className="bal-desc-input"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0,00"
                  inputMode="decimal"
                />
              </label>

              <label className="bal-edprod-check">
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

            {erro && <p className="bal-err">{erro}</p>}

            <div className="fim" style={{ marginTop: 16 }}>
              <button className="bal-mbtn" onClick={onFechar}>Cancelar</button>
              <button
                className="bal-mbtn ouro"
                disabled={salvar.isPending || enviandoImg}
                onClick={() => salvar.mutate()}
              >
                {salvar.isPending ? <Loader2 size={14} className="spin-icon" /> : <Check size={14} />}
                {salvar.isPending ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
