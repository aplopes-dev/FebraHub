"use client";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote, Check, ChefHat, Copy, CreditCard, Minus, Percent,
  Plus, QrCode, Search, Trash2, User, UserPlus, X,
} from "lucide-react";
import {
  checkout, confirmarPagamento, iniciarPagamento, lojaPedido,
  lojaProdutosBalcao, vendaPdvFila,
} from "@/services/api/loja-pedidos";
import { lojaCategorias } from "@/services/api/loja-produtos";
import { ErroApi } from "@/services/api/client";
import type { PdvProduto } from "@/types/pdv";
import type { FormaPagamento, LojaPedido, LojaPedidoPagamento } from "@/types/loja-pedidos";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Estado =
  | { t: "carrinho" }
  | { t: "pix"; pedido: LojaPedido; pgto: LojaPedidoPagamento }
  | { t: "ok"; numero: number };

type ModalExtra = null | "cliente" | "descItem" | "descTotal" | "cancelar";

interface Cliente { nome: string; tel: string }
interface LinhaCarrinho { p: PdvProduto; q: number; descItem: number }

export default function Vender() {
  const qc = useQueryClient();
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

  const categorias = useQuery({ queryKey: ["loja", "categorias"], queryFn: lojaCategorias });
  const produtos = useQuery({ queryKey: ["pdv-movel-produtos", busca], queryFn: () => lojaProdutosBalcao(busca) });

  const lista = useMemo(() => {
    const rows = produtos.data ?? [];
    return categoria ? rows.filter((p) => p.categoria === categoria) : rows;
  }, [produtos.data, categoria]);

  const linhas = Object.values(carrinho);
  const bruto = useMemo(() => linhas.reduce((s, l) => s + l.p.preco * l.q, 0), [linhas]);
  const descItens = useMemo(() => linhas.reduce((s, l) => s + l.descItem, 0), [linhas]);
  const total = Math.max(0, +(bruto - descItens - descontoTotal).toFixed(2));
  const qtd = linhas.reduce((s, l) => s + l.q, 0);
  const precisaPreparo = linhas.some((l) => l.p.precisaPreparacao);

  const add = (p: PdvProduto) => {
    if (p.controlaEstoque && p.disponivel <= 0) return;
    setCarrinho((c) => ({ ...c, [p.produtoId]: { p, q: (c[p.produtoId]?.q ?? 0) + 1, descItem: c[p.produtoId]?.descItem ?? 0 } }));
  };
  const setQ = (id: string, q: number) =>
    setCarrinho((c) => {
      if (q <= 0) { const cp = { ...c }; delete cp[id]; return cp; }
      return { ...c, [id]: { ...c[id], q } };
    });
  const limpar = () => {
    setCarrinho({}); setEstado({ t: "carrinho" }); setErro(null);
    setDescontoTotal(0); setSelecionado(null); setCliente(null);
  };

  const finalizar = useMutation({
    mutationFn: () =>
      vendaPdvFila({
        modo: precisaPreparo ? "ENVIAR_PREPARACAO" : "ENTREGAR_AGORA",
        clienteNome: cliente?.nome || undefined,
        clienteTel: cliente?.tel || undefined,
        desconto: +(descontoTotal + descItens).toFixed(2),
        itens: linhas.map((l) => ({ produtoId: l.p.produtoId, quantidade: l.q })),
        pagamentos: [{ forma, valor: total }],
      }),
    onSuccess: (p) => {
      setEstado({ t: "ok", numero: (p as LojaPedido).numero });
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
            setEstado({ t: "ok", numero: at.numero });
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
      setEstado({ t: "ok", numero: (p as LojaPedido).numero });
      qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao confirmar PIX."),
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
  };

  const copiarPix = async () => {
    if (estado.t !== "pix" || !estado.pgto.pixCopiaCola) return;
    try { await navigator.clipboard.writeText(estado.pgto.pixCopiaCola); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* */ }
  };

  const badge = (p: PdvProduto) => {
    if (!p.controlaEstoque) return null;
    const cls = p.disponivel <= 0 ? "zero" : p.disponivel <= 3 ? "baixo" : "ok";
    const txt = p.disponivel <= 0 ? "esgotado" : `${p.disponivel}`;
    return <span className={`pm-prod-badge ${cls}`}>{txt}</span>;
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
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto…" inputMode="search" />
      </div>

      <div className="pm-chips">
        <button className={`pm-chip ${categoria === "" ? "on" : ""}`} onClick={() => setCategoria("")}>Todos</button>
        {(categorias.data ?? []).filter((c) => c.ativo).map((c) => (
          <button key={c.id} className={`pm-chip ${categoria === c.nome ? "on" : ""}`} onClick={() => setCategoria(c.nome)}>{c.nome}</button>
        ))}
      </div>

      {produtos.isLoading && <p className="pm-vazio">Carregando produtos…</p>}
      {produtos.data && lista.length === 0 && <p className="pm-vazio">Nenhum produto.</p>}

      <div className="pm-grid">
        {lista.map((p) => {
          const noCarrinho = carrinho[p.produtoId]?.q ?? 0;
          const esgotado = !!p.controlaEstoque && p.disponivel <= 0;
          const sel = selecionado === p.produtoId && noCarrinho > 0;
          return (
            <button
              key={p.produtoId}
              className={`pm-prod ${sel ? "sel" : ""}`}
              disabled={esgotado}
              onClick={() => { add(p); if (noCarrinho >= 0) setSelecionado(p.produtoId); }}
            >
              {noCarrinho > 0 && <span className="pm-prod-qtd">{noCarrinho}</span>}
              {badge(p)}
              {p.imagemUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className="pm-prod-img" src={p.imagemUrl} alt={p.descricao ?? ""} />
                : <div className="pm-prod-img" />}
              <span className="pm-prod-nome">{p.descricao}</span>
              <span className="pm-prod-preco">{brl(p.preco)}</span>
            </button>
          );
        })}
      </div>

      {/* ── Barra inferior: ações rápidas + carrinho ── */}
      {temItens && (
        <div className="pm-bottom-area">
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

      {/* ── Sheet do carrinho / pagamento ── */}
      {sheet && (
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
                      <div style={{ flex: 1 }}>
                        <span className="nome">{l.p.descricao}</span>
                        {l.descItem > 0 && <span className="pm-desc-chip">−{brl(l.descItem)}</span>}
                      </div>
                      <div className="pm-stepper">
                        <button onClick={(e) => { e.stopPropagation(); setQ(l.p.produtoId, l.q - 1); }}><Minus size={16} /></button>
                        <b>{l.q}</b>
                        <button onClick={(e) => { e.stopPropagation(); setQ(l.p.produtoId, l.q + 1); }} disabled={!!l.p.controlaEstoque && l.q >= l.p.disponivel}><Plus size={16} /></button>
                      </div>
                      <span className="preco">{brl(l.p.preco * l.q - l.descItem)}</span>
                    </div>
                  ))}
                </div>

                <div className="pm-sheet-foot">
                  {/* Ações rápidas dentro do sheet também */}
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

                  {precisaPreparo && (
                    <p className="pm-total-linha muted" style={{ margin: 0 }}>
                      <ChefHat size={13} /> Vai para a fila de preparação.
                    </p>
                  )}
                  <div className="pm-formas">
                    {([["DINHEIRO", Banknote, "Dinheiro"], ["CARTAO_CREDITO", CreditCard, "Cartão"], ["PIX", QrCode, "PIX"]] as const).map(([f, I, lbl]) => (
                      <button key={f} className={`pm-forma ${forma === f ? "on" : ""}`} onClick={() => setForma(f)}><I /> {lbl}</button>
                    ))}
                  </div>
                  {erro && <div className="pm-erro">{erro}</div>}
                  <button className="pm-btn verde bloco" disabled={finalizar.isPending || gerarPix.isPending} onClick={pagar}>
                    {finalizar.isPending || gerarPix.isPending ? "Processando…" : `Cobrar ${brl(total)}`}
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
            {estado.t === "ok" && (
              <div className="pm-sheet-body">
                <div className="pm-sucesso">
                  <div className="ico">🎉</div>
                  <h2>Pedido #{estado.numero}</h2>
                  <p>{precisaPreparo ? "Enviado para a fila de preparação." : "Venda concluída."}</p>
                  <button className="pm-btn ouro bloco" style={{ marginTop: 10 }} onClick={fecharSheet}>Nova venda</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modais extras ── */}
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
          onKeyDown={(e) => { if (e.key === "Enter") salvar(); }}
        />
        <label className="pm-modal-label">Telefone <span className="pm-modal-opt">(opcional)</span></label>
        <input
          className="pm-modal-input"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          placeholder="(71) 90000-0000"
          inputMode="tel"
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

        {/* Tipo: R$ | % */}
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
  );
}
