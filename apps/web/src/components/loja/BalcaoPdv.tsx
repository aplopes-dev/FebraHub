"use client";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote, Bell, Check, ChefHat, CreditCard, MoreVertical, Plus, QrCode,
  ScanLine, Search, Trash2, Truck, X,
} from "lucide-react";
import { pdvProdutos } from "@/services/api/pdv";
import { lojaCategorias } from "@/services/api/loja-produtos";
import { lojaPedidosIndicadores, vendaPdvFila } from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import type { PdvProduto } from "@/types/pdv";
import type { FormaPagamento, VendaPdvInput } from "@/types/loja-pedidos";
import "@/app/balcao.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const FORMAS: { forma: FormaPagamento; label: string; Icone: typeof Banknote }[] = [
  { forma: "DINHEIRO", label: "Dinheiro", Icone: Banknote },
  { forma: "CARTAO_CREDITO", label: "Cartão", Icone: CreditCard },
  { forma: "PIX", label: "PIX", Icone: QrCode },
];

interface LinhaCarrinho { produto: PdvProduto; quantidade: number }
interface Split { forma: FormaPagamento; valor: number }

/** Selo de estoque conforme o disponível (mesma semântica do mockup). */
function selo(p: PdvProduto): { txt: string; cls: string } | null {
  if (!p.controlaEstoque) return null;
  if (p.disponivel <= 0) return { txt: "Esgotado", cls: "zero" };
  if (p.disponivel <= 5) return { txt: "Últimas unidades", cls: "baixo" };
  return { txt: "Em estoque", cls: "ok" };
}

export function BalcaoPdv() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao()).data;
  const podeOperar = pode(perfil, "loja.pedidos.operar");

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("");
  const [carrinho, setCarrinho] = useState<Record<string, LinhaCarrinho>>({});
  const [desconto, setDesconto] = useState(0);
  const [forma, setForma] = useState<FormaPagamento>("DINHEIRO");
  const [splitOn, setSplitOn] = useState(false);
  const [splits, setSplits] = useState<Split[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => { const t = setInterval(() => setAgora(new Date()), 30_000); return () => clearInterval(t); }, []);

  const categorias = useQuery({ queryKey: ["loja", "categorias"], queryFn: lojaCategorias });
  const indicadores = useQuery({ queryKey: ["loja-pedidos", "indicadores"], queryFn: () => lojaPedidosIndicadores(), refetchInterval: 15_000 });
  const produtos = useQuery({ queryKey: ["pdv-produtos", busca], queryFn: () => pdvProdutos(busca) });

  const lista = useMemo(() => {
    const rows = produtos.data ?? [];
    return categoria ? rows.filter((p) => p.categoria === categoria) : rows;
  }, [produtos.data, categoria]);

  const linhas = Object.values(carrinho);
  const subtotal = useMemo(() => linhas.reduce((s, l) => s + l.produto.preco * l.quantidade, 0), [linhas]);
  const total = Math.max(0, +(subtotal - desconto).toFixed(2));
  const pago = +splits.reduce((s, p) => s + p.valor, 0).toFixed(2);
  const falta = +(total - pago).toFixed(2);
  const qtdItens = linhas.reduce((s, l) => s + l.quantidade, 0);

  const add = (p: PdvProduto) => setCarrinho((c) => ({ ...c, [p.produtoId]: { produto: p, quantidade: (c[p.produtoId]?.quantidade ?? 0) + 1 } }));
  const setQty = (id: string, q: number) => setCarrinho((c) => {
    if (q <= 0) { const cp = { ...c }; delete cp[id]; return cp; }
    return { ...c, [id]: { ...c[id], quantidade: q } };
  });
  const remover = (id: string) => setCarrinho((c) => { const cp = { ...c }; delete cp[id]; return cp; });
  const limpar = () => { setCarrinho({}); setSplits([]); setDesconto(0); setSplitOn(false); };

  const addSplit = () => setSplits((s) => [...s, { forma: "DINHEIRO", valor: Math.max(0, falta) }]);
  const setSplit = (i: number, patch: Partial<Split>) => setSplits((s) => s.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const rmSplit = (i: number) => setSplits((s) => s.filter((_, k) => k !== i));

  const venda = useMutation({
    mutationFn: (modo: VendaPdvInput["modo"]) => {
      const pagamentos = splitOn && splits.length ? splits : [{ forma, valor: total }];
      return vendaPdvFila({ modo, desconto, itens: linhas.map((l) => ({ produtoId: l.produto.produtoId, quantidade: l.quantidade })), pagamentos });
    },
    onSuccess: (p) => {
      setErro(null); setOk(`Pedido #${p.numero} registrado.`);
      limpar();
      qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
      qc.invalidateQueries({ queryKey: ["pdv-produtos"] });
      setTimeout(() => setOk(null), 4000);
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao registrar a venda."),
  });

  const precisaPreparo = linhas.some((l) => l.produto.precisaPreparacao);
  const pagamentoOk = splitOn ? (splits.length > 0 && Math.abs(falta) < 0.01) : true;
  const podeFinalizar = linhas.length > 0 && pagamentoOk;

  const ind = indicadores.data;

  return (
    <div className="bal-page">
      {/* ---------------- topo ---------------- */}
      <header className="bal-top">
        <div>
          <h1>PDV · <b>Venda rápida</b></h1>
          <p>Venda no balcão com split de pagamento — mesma fila e estoque</p>
        </div>
        <div className="bal-topright">
          <span className="bal-caixa"><span className="dot" /> CAIXA ABERTO</span>
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
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <label className="bal-busca">
            <Search />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, SKU ou código de barras" />
            <button className="bal-scan" title="Escanear"><ScanLine size={16} /></button>
          </label>

          <div className="bal-chips">
            <button className={`bal-chip ${!categoria ? "on" : ""}`} onClick={() => setCategoria("")}>Todos</button>
            {(categorias.data ?? []).filter((c) => c.ativo).map((c) => (
              <button key={c.id} className={`bal-chip ${categoria === c.nome ? "on" : ""}`} onClick={() => setCategoria(c.nome)}>{c.nome}</button>
            ))}
          </div>

          <div className="bal-scroll">
            <div className="bal-grid">
              {lista.map((p) => {
                const s = selo(p);
                const esgotado = !!p.controlaEstoque && p.disponivel <= 0;
                return (
                  <button key={p.produtoId} className="bal-card" disabled={esgotado} onClick={() => add(p)}>
                    <div className="bal-thumb">
                      {p.imagemUrl ? <img src={p.imagemUrl} alt="" /> : <span className="ph">🛍️</span>}
                    </div>
                    {!esgotado && <span className="bal-add"><Plus size={17} /></span>}
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
            {lista.length > 0 && (
              <div className="bal-vermais"><button>Ver mais produtos</button></div>
            )}
          </div>
        </div>

        {/* carrinho */}
        <aside className="bal-cart">
          <div className="bal-cart-head">
            <h2>Carrinho <small>({qtdItens} {qtdItens === 1 ? "item" : "itens"})</small></h2>
            {linhas.length > 0 && <button className="bal-limpar" onClick={limpar}>Limpar <Trash2 size={13} /></button>}
          </div>

          <div className="bal-itens">
            {linhas.length === 0 && <p className="bal-empty">Toque num produto para adicionar.</p>}
            {linhas.map((l) => (
              <div key={l.produto.produtoId} className="bal-item">
                <div className="bal-item-thumb">{l.produto.imagemUrl ? <img src={l.produto.imagemUrl} alt="" /> : <span>🛍️</span>}</div>
                <div>
                  <div className="nome">{l.produto.descricao}<button className="x" onClick={() => remover(l.produto.produtoId)}><X size={16} /></button></div>
                  <div className="un">{brl(l.produto.preco)}</div>
                  <div className="bal-item-foot">
                    <div className="bal-step">
                      <button onClick={() => setQty(l.produto.produtoId, l.quantidade - 1)}>−</button>
                      <b>{l.quantidade}</b>
                      <button onClick={() => setQty(l.produto.produtoId, l.quantidade + 1)}>+</button>
                    </div>
                    <span className="lt">{brl(l.produto.preco * l.quantidade)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {linhas.length > 0 && (
            <>
              <div className="bal-tot">
                <div className="row"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
                <div className="row"><span>Desconto</span>
                  <input type="number" min={0} step="0.01" value={desconto} onChange={(e) => setDesconto(Math.max(0, Number(e.target.value)))} />
                </div>
                <div className="row grande"><span>Total</span><span>{brl(total)}</span></div>
              </div>

              <div className="bal-pay">
                <label>Pagamento</label>
                <div className="bal-formas">
                  {FORMAS.map((f) => (
                    <button key={f.forma} className={`bal-forma ${!splitOn && forma === f.forma ? "on" : ""}`} disabled={splitOn} onClick={() => setForma(f.forma)}>
                      <f.Icone /> {f.label}
                    </button>
                  ))}
                </div>

                <div className="bal-split-toggle">
                  <div>
                    <b>Split de pagamento</b>
                    <small>Permitir mais de uma forma de pagamento</small>
                  </div>
                  <button className={`bal-switch ${splitOn ? "on" : ""}`} onClick={() => { setSplitOn((v) => !v); setSplits([]); }}><span className="knob" /></button>
                </div>

                {splitOn && (
                  <div>
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
                    <button className="bal-addsplit" onClick={addSplit}>+ Adicionar forma {falta > 0 ? `· falta ${brl(falta)}` : ""}</button>
                  </div>
                )}

                {podeOperar ? (
                  <>
                    <button className="bal-finalizar ouro" disabled={!podeFinalizar || venda.isPending} onClick={() => venda.mutate("ENTREGAR_AGORA")}>
                      <Truck size={17} /> {precisaPreparo ? "Entregar agora" : "Finalizar venda"} <Check size={16} />
                    </button>
                    {precisaPreparo && (
                      <button className="bal-finalizar dupla" disabled={!podeFinalizar || venda.isPending} onClick={() => venda.mutate("ENVIAR_PREPARACAO")}>
                        <ChefHat size={17} /> Enviar para preparação
                      </button>
                    )}
                  </>
                ) : (
                  <button className="bal-finalizar" disabled>Sem permissão para operar o caixa</button>
                )}

                {ok && <p className="bal-ok">{ok}</p>}
                {erro && <p className="bal-err">{erro}</p>}
                {!ok && !erro && <p className="bal-hint">{podeFinalizar ? "Pronto para finalizar" : splitOn && !pagamentoOk ? "Ajuste o split para fechar o total" : "Selecione a forma de pagamento para continuar"}</p>}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ---------------- barra de status ---------------- */}
      <footer className="bal-status">
        <span className="it"><ChefHat size={16} /> Fila: <b>{ind?.aguardandoFila ?? 0} pedidos</b></span>
        <span className="prox">Em preparo: {ind?.emPreparacao ?? 0}</span>
        <span className="it"><Check size={16} /> Pedidos prontos: <b>{ind?.prontos ?? 0}</b></span>
      </footer>
    </div>
  );
}
