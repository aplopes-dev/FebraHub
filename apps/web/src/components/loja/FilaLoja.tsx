"use client";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell, ChefHat, CheckCircle2, Clock, PackageCheck, Ban, RefreshCw, QrCode,
  Search, Phone, User, GripVertical, ArrowRight, MoreVertical, Pencil, X,
  Plus, Minus, MoveUp, MoveDown, MoveHorizontal,
} from "lucide-react";
import { useLojaPedidosStream } from "@/hooks/loja-pedidos-stream";
import {
  cancelarPedido, confirmarPagamento, confirmarRetirada, iniciarPreparacao,
  lojaPedidos, lojaPedidosDashboard, lojaPedidosIndicadores, marcarProximo, marcarPronto,
  moverPedidoStatus, editarItensPedido, lojaProdutosBalcao,
} from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import { ModalPrompt } from "@/components/ui/ModalPrompt";
import { ModalConfirmar } from "@/components/ui/ModalConfirmar";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import type { LojaPedido, LojaPedidoStatus } from "@/types/loja-pedidos";
import type { PdvProduto } from "@/types/pdv";
import "@/app/loja.css";
import "@/app/fila.css";

const brl = (n: number | string) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLUNAS: { status: LojaPedidoStatus; titulo: string; Icone: typeof Clock }[] = [
  { status: "AGUARDANDO_PAGAMENTO", titulo: "Aguardando pagamento", Icone: Clock },
  { status: "NA_FILA", titulo: "Na fila", Icone: Bell },
  { status: "EM_PREPARACAO", titulo: "Em preparação", Icone: ChefHat },
  { status: "PRONTO", titulo: "Prontos", Icone: PackageCheck },
];

/** Status fake para a zona de drop "Retirar" que aparece durante arrasto de PRONTO */
const STATUS_RETIRAR = "RETIRADO" as LojaPedidoStatus;

/** Mapeamento de transições válidas via drag: "ORIGEM->DESTINO" → fn */
type TransicaoFn = (id: string) => Promise<unknown>;
const TRANSICOES: Partial<Record<string, TransicaoFn>> = {
  "AGUARDANDO_PAGAMENTO->NA_FILA": (id) => confirmarPagamento(id),
  "NA_FILA->EM_PREPARACAO": (id) => iniciarPreparacao(id),
  "EM_PREPARACAO->PRONTO": (id) => marcarPronto(id),
  "PRONTO->RETIRADO": (id) => confirmarRetirada(id),
};

function transicaoFn(origem: LojaPedidoStatus, destino: LojaPedidoStatus): TransicaoFn | null {
  return TRANSICOES[`${origem}->${destino}`] ?? null;
}

/** Labels de ação para o destino (usados no tooltip da coluna) */
const LABEL_ACAO: Partial<Record<LojaPedidoStatus, string>> = {
  NA_FILA: "Confirmar pagamento",
  EM_PREPARACAO: "Iniciar preparação",
  PRONTO: "Marcar como pronto",
  RETIRADO: "Confirmar retirada",
};

function minutosDe(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

/** Normaliza texto para busca (remove acentos, lowercase) */
function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Verifica se um pedido bate com o termo de busca (senha, nome ou telefone) */
function bate(p: LojaPedido, termo: string): boolean {
  const t = norm(termo.trim());
  if (!t) return true;
  if (p.senhaFila != null && String(p.senhaFila).includes(t)) return true;
  if (p.senhaFila != null && String(p.senhaFila).padStart(2, "0").includes(t)) return true;
  if (p.clienteNome && norm(p.clienteNome).includes(t)) return true;
  if (p.clienteTel) {
    const digitos = p.clienteTel.replace(/\D/g, "");
    const termoDig = t.replace(/\D/g, "");
    if (termoDig && digitos.includes(termoDig)) return true;
    if (norm(p.clienteTel).includes(t)) return true;
  }
  return false;
}

/** Formata telefone BR: (XX) XXXXX-XXXX */
function fmtTel(t: string | null | undefined): string | null {
  if (!t) return null;
  const d = t.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return t;
}

// ─── Destinos de mover para cada status ───────────────────────────────────────
type MoverTarget = { label: string; paraStatus: "NA_FILA" | "EM_PREPARACAO" | "PRONTO"; Icone: typeof MoveUp };
const MOVER_OPCOES: Partial<Record<LojaPedidoStatus, MoverTarget[]>> = {
  NA_FILA: [
    { label: "Em preparação", paraStatus: "EM_PREPARACAO", Icone: MoveUp },
    { label: "Pronto", paraStatus: "PRONTO", Icone: MoveUp },
  ],
  EM_PREPARACAO: [
    { label: "Voltar à fila", paraStatus: "NA_FILA", Icone: MoveDown },
    { label: "Pronto", paraStatus: "PRONTO", Icone: MoveUp },
  ],
  PRONTO: [
    { label: "Voltar à fila", paraStatus: "NA_FILA", Icone: MoveDown },
    { label: "Voltar para preparação", paraStatus: "EM_PREPARACAO", Icone: MoveDown },
  ],
  AGUARDANDO_PAGAMENTO: [],
};

// ─── Item do carrinho de edição ───────────────────────────────────────────────
interface ItemEditar {
  produtoId: string;
  descricao: string;
  preco: number;
  quantidade: number;
  observacao: string;
}

// ─── Modal de edição de itens ─────────────────────────────────────────────────
function ModalEditarItens({
  pedido,
  onFechar,
  onSalvo,
}: {
  pedido: LojaPedido;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const qc = useQueryClient();
  const [itens, setItens] = useState<ItemEditar[]>(() =>
    pedido.itens.map((it) => ({
      produtoId: it.produtoId,
      descricao: it.descricao,
      preco: Number(it.precoUnit),
      quantidade: Number(it.quantidade),
      observacao: it.observacao ?? "",
    }))
  );
  const [desconto, setDesconto] = useState(Number(pedido.desconto));
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const produtos = useQuery({
    queryKey: ["loja-pedidos", "balcao-produtos"],
    queryFn: () => lojaProdutosBalcao(),
    staleTime: 30000,
  });

  const produtosFiltrados = useMemo(() => {
    const lista = produtos.data ?? [];
    const t = norm(busca.trim());
    if (!t) return lista;
    return lista.filter((p) => norm(p.descricao ?? "").includes(t) || (p.codigo != null ? norm(p.codigo).includes(t) : false));
  }, [produtos.data, busca]);

  const subtotal = useMemo(() => itens.reduce((s, i) => s + i.preco * i.quantidade, 0), [itens]);
  const total = Math.max(0, subtotal - desconto);

  const salvar = useMutation({
    mutationFn: () =>
      editarItensPedido(pedido.id, {
        itens: itens.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade, observacao: i.observacao || undefined })),
        desconto: desconto || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
      onSalvo();
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Erro ao salvar itens."),
  });

  const addProduto = (p: PdvProduto) => {
    setItens((prev) => {
      const idx = prev.findIndex((i) => i.produtoId === p.produtoId);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], quantidade: copia[idx].quantidade + 1 };
        return copia;
      }
      return [...prev, { produtoId: p.produtoId, descricao: p.descricao ?? "", preco: p.preco, quantidade: 1, observacao: "" }];
    });
  };

  const altQtd = (idx: number, delta: number) => {
    setItens((prev) => {
      const copia = [...prev];
      const nova = copia[idx].quantidade + delta;
      if (nova <= 0) return copia.filter((_, i) => i !== idx);
      copia[idx] = { ...copia[idx], quantidade: nova };
      return copia;
    });
  };

  const remItem = (idx: number) => setItens((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="fila-modal-overlay" onClick={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="fila-modal">
        <header className="fila-modal-header">
          <div>
            <h2>Editar pedido #{pedido.numero}</h2>
            <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
              {pedido.clienteNome && `Cliente: ${pedido.clienteNome}`}
            </p>
          </div>
          <button className="fila-modal-fechar" onClick={onFechar} title="Fechar"><X size={18} /></button>
        </header>

        <div className="fila-modal-corpo">
          {/* Carrinho atual */}
          <section className="fila-modal-secao">
            <h3 className="fila-modal-titulo-secao">Itens do pedido</h3>
            {itens.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13, padding: "8px 0" }}>Nenhum item. Adicione abaixo.</p>
            ) : (
              <div className="fila-edit-itens">
                {itens.map((it, idx) => (
                  <div key={it.produtoId + idx} className="fila-edit-item">
                    <div className="fila-edit-item-info">
                      <span className="fila-edit-item-nome">{it.descricao}</span>
                      <span className="fila-edit-item-preco">{brl(it.preco)} un.</span>
                    </div>
                    <div className="fila-edit-item-ctrl">
                      <button onClick={() => altQtd(idx, -1)} className="fila-qty-btn"><Minus size={12} /></button>
                      <span className="fila-qty-val">{it.quantidade}</span>
                      <button onClick={() => altQtd(idx, +1)} className="fila-qty-btn"><Plus size={12} /></button>
                      <span className="fila-edit-item-total">{brl(it.preco * it.quantidade)}</span>
                      <button onClick={() => remItem(idx)} className="fila-qty-btn perigo" title="Remover"><X size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Desconto */}
            <div className="fila-edit-desconto">
              <label htmlFor="fila-desconto">Desconto (R$)</label>
              <input
                id="fila-desconto"
                type="number"
                min={0}
                step={0.01}
                value={desconto || ""}
                onChange={(e) => setDesconto(Number(e.target.value) || 0)}
                placeholder="0,00"
              />
            </div>

            {/* Totais */}
            <div className="fila-edit-totais">
              <span>Subtotal: <b>{brl(subtotal)}</b></span>
              {desconto > 0 && <span style={{ color: "var(--down)" }}>Desconto: <b>− {brl(desconto)}</b></span>}
              <span style={{ fontSize: 16, fontWeight: 800 }}>Total: <b>{brl(total)}</b></span>
            </div>
          </section>

          {/* Catálogo de produtos para adicionar */}
          <section className="fila-modal-secao">
            <h3 className="fila-modal-titulo-secao">Adicionar produtos</h3>
            <label className="fila-busca" style={{ marginBottom: 10 }}>
              <Search size={14} />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto…"
              />
              {busca && <button className="fila-busca-limpar" onClick={() => setBusca("")}>×</button>}
            </label>

            {produtos.isLoading ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>Carregando produtos…</p>
            ) : (
              <div className="fila-edit-catalogo">
                {produtosFiltrados.slice(0, 40).map((p) => (
                  <button
                    key={p.produtoId}
                    className="fila-edit-prod"
                    onClick={() => addProduto(p)}
                    disabled={p.controlaEstoque && !p.vendeSemEstoque && p.disponivel <= 0}
                    title={p.controlaEstoque && !p.vendeSemEstoque && p.disponivel <= 0 ? "Sem estoque" : undefined}
                  >
                    <span className="fila-edit-prod-nome">{p.descricao}</span>
                    <span className="fila-edit-prod-preco">{brl(p.preco)}</span>
                    {p.controlaEstoque && (
                      <span className={`fila-edit-prod-estoque${p.disponivel <= 0 ? " esgotado" : ""}`}>
                        {p.disponivel <= 0 ? "Esgotado" : `${p.disponivel} un.`}
                      </span>
                    )}
                  </button>
                ))}
                {produtosFiltrados.length === 0 && (
                  <p style={{ color: "var(--muted)", fontSize: 12 }}>Nenhum produto encontrado.</p>
                )}
              </div>
            )}
          </section>
        </div>

        {erro && <div className="fila-erro" style={{ margin: "0 0 10px" }}>{erro}</div>}

        <footer className="fila-modal-footer">
          <button className="loja-btn" onClick={onFechar} disabled={salvar.isPending}>Cancelar</button>
          <button
            className="loja-btn ouro"
            onClick={() => salvar.mutate()}
            disabled={salvar.isPending || itens.length === 0}
          >
            {salvar.isPending ? "Salvando…" : "Salvar alterações"}
          </button>
        </footer>
      </div>
    </div>
  );
}

// ─── Menu de ações (⋮) de um card ────────────────────────────────────────────
function MenuAcoes({
  pedido,
  onMover,
  onEditar,
  onCancelar,
  loading,
}: {
  pedido: LojaPedido;
  onMover: (paraStatus: "NA_FILA" | "EM_PREPARACAO" | "PRONTO") => void;
  onEditar: () => void;
  onCancelar: () => void;
  loading: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const opcoesMover = MOVER_OPCOES[pedido.status] ?? [];
  const podeEditar = !["RETIRADO", "CANCELADO"].includes(pedido.status);
  const podeCancelar = !["RETIRADO", "CANCELADO"].includes(pedido.status);

  if (!opcoesMover.length && !podeEditar && !podeCancelar) return null;

  return (
    <div className="fila-menu-wrapper">
      <button
        className="fila-menu-btn"
        onClick={(e) => { e.stopPropagation(); setAberto((v) => !v); }}
        title="Mais ações"
        disabled={loading}
      >
        <MoreVertical size={14} />
      </button>
      {aberto && (
        <>
          <div className="fila-menu-backdrop" onClick={() => setAberto(false)} />
          <div className="fila-menu-dropdown">
            {podeEditar && (
              <button className="fila-menu-item" onClick={() => { setAberto(false); onEditar(); }}>
                <Pencil size={13} /> Editar itens
              </button>
            )}
            {opcoesMover.length > 0 && (
              <>
                {podeEditar && <div className="fila-menu-sep" />}
                <div className="fila-menu-grupo">Mover para</div>
                {opcoesMover.map((op) => (
                  <button
                    key={op.paraStatus}
                    className="fila-menu-item"
                    onClick={() => { setAberto(false); onMover(op.paraStatus); }}
                    disabled={loading}
                  >
                    <MoveHorizontal size={13} /> {op.label}
                  </button>
                ))}
              </>
            )}
            {podeCancelar && (
              <>
                <div className="fila-menu-sep" />
                <button
                  className="fila-menu-item perigo"
                  onClick={() => { setAberto(false); onCancelar(); }}
                  disabled={loading}
                >
                  <Ban size={13} /> Cancelar pedido
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function FilaLoja() {
  const qc = useQueryClient();
  const podeOperar = pode(usePerfil(useSessao()).data, "loja.pedidos.operar");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [verDash, setVerDash] = useState(false);
  const [busca, setBusca] = useState("");
  const [pedidoEditando, setPedidoEditando] = useState<LojaPedido | null>(null);
  // Cancelamento e movimentação usam modais do app (substituem prompt()/confirm() nativos).
  const [pedidoCancelar, setPedidoCancelar] = useState<LojaPedido | null>(null);
  const [pedidoMover, setPedidoMover] = useState<{ pedido: LojaPedido; paraStatus: "NA_FILA" | "EM_PREPARACAO" | "PRONTO" } | null>(null);

  // Drag-and-drop state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingStatus, setDraggingStatus] = useState<LojaPedidoStatus | null>(null);
  const [overStatus, setOverStatus] = useState<LojaPedidoStatus | null>(null);
  // ref para uso nos handlers sem re-render
  const draggingStatusRef = useRef<LojaPedidoStatus | null>(null);

  const indicadores = useQuery({
    queryKey: ["loja-pedidos", "indicadores"],
    queryFn: () => lojaPedidosIndicadores(),
    refetchInterval: 8000,
  });
  const pedidos = useQuery({
    queryKey: ["loja-pedidos", "fila"],
    queryFn: () => lojaPedidos(),
    refetchInterval: 5000,
  });

  useLojaPedidosStream(useCallback(() => {
    qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
  }, [qc]));

  const dashboard = useQuery({
    queryKey: ["loja-pedidos", "dashboard"],
    queryFn: () => lojaPedidosDashboard(),
    refetchInterval: 15000,
    enabled: verDash,
  });

  const porStatus = useMemo(() => {
    const map: Record<string, LojaPedido[]> = {};
    for (const c of COLUNAS) map[c.status] = [];
    for (const p of pedidos.data ?? []) {
      if (map[p.status] && bate(p, busca)) map[p.status].push(p);
    }
    return map;
  }, [pedidos.data, busca]);

  const acao = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      setErro(null);
      qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha na operação."),
  });

  const rodar = (fn: () => Promise<unknown>) => () => acao.mutate(fn);

  const prepararEImprimir = (pedidoId: string) => () => {
    acao.mutate(() => iniciarPreparacao(pedidoId), {
      onSuccess: () => {
        setAviso("🖨️ Cupom enviado à impressora.");
        window.setTimeout(() => setAviso(null), 4000);
      },
    });
  };

  const handleCancelar = (p: LojaPedido) => setPedidoCancelar(p);
  const handleMover = (p: LojaPedido, paraStatus: "NA_FILA" | "EM_PREPARACAO" | "PRONTO") =>
    setPedidoMover({ pedido: p, paraStatus });

  // ---- Drag handlers ----

  const handleDragStart = useCallback((e: React.DragEvent, pedido: LojaPedido) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("pedidoId", pedido.id);
    e.dataTransfer.setData("pedidoStatus", pedido.status);
    setDraggingId(pedido.id);
    setDraggingStatus(pedido.status);
    draggingStatusRef.current = pedido.status;
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
    setDraggingStatus(null);
    setOverStatus(null);
    draggingStatusRef.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colStatus: LojaPedidoStatus) => {
    const origemStatus = draggingStatusRef.current;
    if (!origemStatus) return;
    if (transicaoFn(origemStatus, colStatus) != null) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setOverStatus(colStatus);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setOverStatus(null);
    }
  }, []);

  const executarTransicao = useCallback((pedidoId: string, origemStatus: LojaPedidoStatus, destStatus: LojaPedidoStatus) => {
    const fn = transicaoFn(origemStatus, destStatus);
    if (!fn) return;

    if (origemStatus === "NA_FILA" && destStatus === "EM_PREPARACAO") {
      acao.mutate(() => iniciarPreparacao(pedidoId), {
        onSuccess: () => {
          setAviso("🖨️ Cupom enviado à impressora.");
          window.setTimeout(() => setAviso(null), 4000);
          qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
        },
      });
    } else {
      acao.mutate(() => fn(pedidoId));
    }
  }, [acao, qc]);

  const handleDrop = useCallback((e: React.DragEvent, destStatus: LojaPedidoStatus) => {
    e.preventDefault();
    setOverStatus(null);
    const pedidoId = e.dataTransfer.getData("pedidoId");
    const origemStatus = e.dataTransfer.getData("pedidoStatus") as LojaPedidoStatus;
    if (!pedidoId || !origemStatus || origemStatus === destStatus) return;
    executarTransicao(pedidoId, origemStatus, destStatus);
  }, [executarTransicao]);

  const i = indicadores.data;

  // Zona de retirada: visível quando está arrastando um card PRONTO
  const mostrarZonaRetirada = podeOperar && draggingStatus === "PRONTO";
  const zonaRetiradaOver = overStatus === STATUS_RETIRAR;

  return (
    <div className="fila-page">
      <header className="fila-hero">
        <div>
          <span className="tag">LOJA · OPERAÇÃO</span>
          <h1>Fila de preparação</h1>
          <p>Pagamento → fila → preparação → pronto → retirada, em tempo real.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {podeOperar && (
            <span className="fila-dica-drag">
              <GripVertical size={13} /> Arraste para avançar
            </span>
          )}
          {podeOperar && (
            <Link className="loja-btn ouro" href="/loja/retirada">
              <QrCode /> Escanear retirada
            </Link>
          )}
          <button className="loja-btn" onClick={() => qc.invalidateQueries({ queryKey: ["loja-pedidos"] })}>
            <RefreshCw /> Atualizar
          </button>
        </div>
      </header>

      {i && (
        <section className="fila-kpis">
          <article><small>Faturamento hoje</small><b>{brl(i.faturamentoHoje)}</b><span>{i.pedidosHoje} pedidos</span></article>
          <article><small>Na fila</small><b>{i.aguardandoFila}</b><span>aguardando preparação</span></article>
          <article><small>Em preparação</small><b>{i.emPreparacao}</b><span>sendo montados</span></article>
          <article><small>Prontos</small><b className="warn">{i.prontos}</b><span>aguardando retirada</span></article>
        </section>
      )}

      {erro && <div className="fila-erro">{erro}</div>}
      {aviso && <div className="fila-aviso">{aviso}</div>}

      {/* ---- Barra de busca ---- */}
      <label className="fila-busca">
        <Search size={16} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por senha, nome do cliente ou telefone…"
        />
        {busca && (
          <button className="fila-busca-limpar" onClick={() => setBusca("")} title="Limpar busca">×</button>
        )}
      </label>

      <div>
        <button className="loja-btn mini" onClick={() => setVerDash((v) => !v)}>
          {verDash ? "Ocultar indicadores" : "Ver indicadores da operação"}
        </button>
      </div>

      {verDash && dashboard.data && (
        <section className="fila-dash">
          <div className="fila-dash-card">
            <h3>Mais vendidos</h3>
            {dashboard.data.maisVendidos.length === 0 && <p className="fila-vazio">Sem vendas ainda.</p>}
            {dashboard.data.maisVendidos.map((m) => (
              <div key={m.descricao} className="fila-dash-linha"><span>{m.descricao}</span><b>{m.quantidade}</b></div>
            ))}
          </div>
          <div className="fila-dash-card">
            <h3>Formas de pagamento</h3>
            {dashboard.data.formas.map((f) => (
              <div key={f.forma} className="fila-dash-linha"><span>{f.forma}</span><b>{brl(f.valor)}</b></div>
            ))}
          </div>
          <div className="fila-dash-card">
            <h3>Por canal</h3>
            {dashboard.data.canais.map((c) => (
              <div key={c.canal} className="fila-dash-linha"><span>{c.canal === "PDV" ? "PDV" : "Cardápio"}</span><b>{brl(c.valor)} · {c.pedidos}</b></div>
            ))}
            <div className="fila-dash-linha" style={{ marginTop: 8, borderTop: "1px solid var(--card-line)", paddingTop: 8 }}>
              <span>Tempo médio de preparação</span><b>{dashboard.data.tempoMedioPreparacaoMin} min</b>
            </div>
            <div className="fila-dash-linha"><span>Tempo médio de espera</span><b>{dashboard.data.tempoMedioEsperaMin} min</b></div>
          </div>
        </section>
      )}

      {/* ---- Zona de retirada: aparece quando arrasta um card PRONTO ---- */}
      {mostrarZonaRetirada && (
        <div
          className={`fila-zona-retirada${zonaRetiradaOver ? " over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOverStatus(STATUS_RETIRAR); }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, STATUS_RETIRAR)}
        >
          <CheckCircle2 size={20} />
          <span>Soltar aqui para <b>confirmar retirada</b></span>
          <ArrowRight size={16} />
        </div>
      )}

      <section className="fila-board">
        {COLUNAS.map((col) => {
          const lista = porStatus[col.status] ?? [];
          const origemAtual = draggingStatusRef.current;
          const podeReceberDrop = podeOperar && draggingId !== null &&
            origemAtual !== null &&
            origemAtual !== col.status &&
            transicaoFn(origemAtual, col.status) != null;
          const estaOver = overStatus === col.status;
          const acaoLabel = podeReceberDrop ? LABEL_ACAO[col.status] : undefined;

          return (
            <div
              key={col.status}
              className={`fila-coluna${podeReceberDrop ? " fila-coluna-drop-alvo" : ""}${estaOver ? " fila-coluna-over" : ""}`}
              onDragOver={podeOperar ? (e) => handleDragOver(e, col.status) : undefined}
              onDragLeave={podeOperar ? handleDragLeave : undefined}
              onDrop={podeOperar ? (e) => handleDrop(e, col.status) : undefined}
            >
              <header>
                <col.Icone /> {col.titulo}
                <span>{lista.length}</span>
              </header>

              {/* Indicador de ação ao passar o mouse sobre coluna destino */}
              {podeReceberDrop && acaoLabel && (
                <div className={`fila-drop-hint${estaOver ? " visivel" : ""}`}>
                  <ArrowRight size={12} /> {acaoLabel}
                </div>
              )}

              <div className="fila-cards">
                {lista.length === 0 && (
                  <p className={`fila-vazio${estaOver ? " fila-vazio-over" : ""}${podeReceberDrop && !estaOver ? " fila-vazio-alvo" : ""}`}>
                    {estaOver ? "↓ Soltar aqui" : podeReceberDrop ? "Arraste aqui" : busca ? "Nenhum resultado" : "—"}
                  </p>
                )}
                {lista.map((p) => {
                  const tel = fmtTel(p.clienteTel);
                  const temCliente = !!(p.clienteNome || tel);
                  const arrastando = draggingId === p.id;

                  return (
                    <article
                      key={p.id}
                      className={`fila-card${p.status === "PROXIMO" ? " proximo" : ""}${arrastando ? " fila-card-arrastando" : ""}${podeOperar ? " fila-card-drag" : ""}`}
                      draggable={podeOperar}
                      onDragStart={podeOperar ? (e) => handleDragStart(e, p) : undefined}
                      onDragEnd={podeOperar ? handleDragEnd : undefined}
                    >
                      <div className="fila-card-topo">
                        {p.senhaFila != null ? (
                          <b className="fila-senha">Senha {String(p.senhaFila).padStart(2, "0")}<small>#{p.numero}</small></b>
                        ) : (
                          <b>#{p.numero}</b>
                        )}
                        <span className="fila-canal">{p.canal === "PDV" ? "PDV" : "Cardápio"}</span>
                        {/* Handle visual de drag — mostra no hover */}
                        {podeOperar && (
                          <span className="fila-drag-handle" aria-hidden="true">
                            <GripVertical size={13} />
                          </span>
                        )}
                        {/* Menu ⋮ de ações */}
                        {podeOperar && (
                          <MenuAcoes
                            pedido={p}
                            loading={acao.isPending}
                            onMover={(paraStatus) => handleMover(p, paraStatus)}
                            onEditar={() => setPedidoEditando(p)}
                            onCancelar={() => handleCancelar(p)}
                          />
                        )}
                      </div>

                      {temCliente && (
                        <div className="fila-cliente">
                          {p.clienteNome && (
                            <span className="fila-cli-nome"><User size={11} /> {p.clienteNome}</span>
                          )}
                          {tel && (
                            <span className="fila-cli-tel"><Phone size={11} /> {tel}</span>
                          )}
                        </div>
                      )}

                      <div className="fila-itens">
                        {p.itens.map((it) => (
                          <span key={it.id}>{Number(it.quantidade)}× {it.descricao}</span>
                        ))}
                      </div>
                      <div className="fila-card-meta">
                        <span>{brl(p.total)}</span>
                        <span><Clock /> {minutosDe(p.criadoEm)} min</span>
                      </div>
                      {podeOperar && (
                        <div className="fila-acoes">
                          {p.status === "AGUARDANDO_PAGAMENTO" && (
                            <button className="loja-btn ouro mini" disabled={acao.isPending} onClick={rodar(() => confirmarPagamento(p.id))}>
                              <CheckCircle2 /> Confirmar pagamento
                            </button>
                          )}
                          {p.status === "NA_FILA" && (
                            <>
                              <button className="loja-btn mini" disabled={acao.isPending} onClick={rodar(() => marcarProximo(p.id))}><Bell /> Chamar</button>
                              <button className="loja-btn ouro mini" disabled={acao.isPending} onClick={prepararEImprimir(p.id)}><ChefHat /> Preparar</button>
                            </>
                          )}
                          {p.status === "PROXIMO" && (
                            <>
                              <button className="loja-btn ouro mini" disabled={acao.isPending} onClick={prepararEImprimir(p.id)}><ChefHat /> Preparar</button>
                              <button className="loja-btn ouro mini" disabled={acao.isPending} onClick={rodar(() => marcarPronto(p.id))}><PackageCheck /> Pronto</button>
                            </>
                          )}
                          {p.status === "EM_PREPARACAO" && (
                            <button className="loja-btn ouro mini" disabled={acao.isPending} onClick={rodar(() => marcarPronto(p.id))}><PackageCheck /> Pronto</button>
                          )}
                          {p.status === "PRONTO" && (
                            <button className="loja-btn ouro mini" disabled={acao.isPending} onClick={rodar(() => confirmarRetirada(p.id))}><CheckCircle2 /> Retirar</button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* Modal de edição de itens */}
      {pedidoEditando && (
        <ModalEditarItens
          pedido={pedidoEditando}
          onFechar={() => setPedidoEditando(null)}
          onSalvo={() => {
            setPedidoEditando(null);
            setAviso("✅ Pedido atualizado com sucesso.");
            window.setTimeout(() => setAviso(null), 4000);
          }}
        />
      )}

      {/* Cancelamento com motivo obrigatório (substitui o prompt() nativo). */}
      {pedidoCancelar && (
        <ModalPrompt
          titulo={`Cancelar pedido #${pedidoCancelar.numero}`}
          descricao="Informe o motivo do cancelamento — fica registrado na auditoria."
          rotulo="Motivo"
          placeholder="Ex.: cliente desistiu, item em falta…"
          rotuloConfirmar="Confirmar cancelamento"
          perigo
          carregando={acao.isPending}
          onConfirmar={(motivo) =>
            acao.mutate(() => cancelarPedido(pedidoCancelar.id, motivo), {
              onSuccess: () => setPedidoCancelar(null),
            })
          }
          onFechar={() => setPedidoCancelar(null)}
        />
      )}

      {/* Movimentação manual entre colunas (substitui o confirm() nativo). */}
      {pedidoMover && (
        <ModalConfirmar
          titulo="Mover pedido"
          mensagem={`Mover pedido #${pedidoMover.pedido.numero} para "${LABEL_COLUNA[pedidoMover.paraStatus]}"?`}
          rotuloConfirmar="Mover"
          carregando={acao.isPending}
          onConfirmar={() =>
            acao.mutate(() => moverPedidoStatus(pedidoMover.pedido.id, pedidoMover.paraStatus), {
              onSuccess: () => setPedidoMover(null),
            })
          }
          onFechar={() => setPedidoMover(null)}
        />
      )}
    </div>
  );
}

const LABEL_COLUNA: Record<"NA_FILA" | "EM_PREPARACAO" | "PRONTO", string> = {
  NA_FILA: "Na fila",
  EM_PREPARACAO: "Em preparação",
  PRONTO: "Pronto",
};
