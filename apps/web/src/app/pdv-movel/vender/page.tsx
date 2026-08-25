"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X, Minus, Plus, Banknote, CreditCard, QrCode, Copy, Check } from "lucide-react";
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

export default function Vender() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [carrinho, setCarrinho] = useState<Record<string, { p: PdvProduto; q: number }>>({});
  const [sheet, setSheet] = useState(false);
  const [forma, setForma] = useState<FormaPagamento>("DINHEIRO");
  const [estado, setEstado] = useState<Estado>({ t: "carrinho" });
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const categorias = useQuery({ queryKey: ["loja", "categorias"], queryFn: lojaCategorias });
  const produtos = useQuery({ queryKey: ["pdv-movel-produtos", busca], queryFn: () => lojaProdutosBalcao(busca) });

  const lista = useMemo(() => {
    const rows = produtos.data ?? [];
    return categoria ? rows.filter((p) => p.categoria === categoria) : rows;
  }, [produtos.data, categoria]);

  const linhas = Object.values(carrinho);
  const total = useMemo(() => linhas.reduce((s, l) => s + l.p.preco * l.q, 0), [linhas]);
  const qtd = linhas.reduce((s, l) => s + l.q, 0);
  const precisaPreparo = linhas.some((l) => l.p.precisaPreparacao);

  const add = (p: PdvProduto) => {
    if (p.controlaEstoque && p.disponivel <= 0) return;
    setCarrinho((c) => ({ ...c, [p.produtoId]: { p, q: (c[p.produtoId]?.q ?? 0) + 1 } }));
  };
  const setQ = (id: string, q: number) =>
    setCarrinho((c) => {
      if (q <= 0) { const cp = { ...c }; delete cp[id]; return cp; }
      return { ...c, [id]: { ...c[id], q } };
    });
  const limpar = () => { setCarrinho({}); setEstado({ t: "carrinho" }); setErro(null); };

  const finalizar = useMutation({
    mutationFn: () =>
      vendaPdvFila({
        modo: precisaPreparo ? "ENVIAR_PREPARACAO" : "ENTREGAR_AGORA",
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
      const pedido = await checkout({ canal: "PDV", itens: linhas.map((l) => ({ produtoId: l.p.produtoId, quantidade: l.q })) });
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
          return (
            <button key={p.produtoId} className="pm-prod" disabled={esgotado} onClick={() => add(p)}>
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

      {qtd > 0 && (
        <div className="pm-carrinho-bar">
          <button className="pm-carrinho-btn" onClick={() => { setSheet(true); setEstado({ t: "carrinho" }); }}>
            <span><span className="c">{qtd}</span> no carrinho</span>
            <span>{brl(total)} →</span>
          </button>
        </div>
      )}

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
                <div className="pm-sheet-body">
                  {linhas.map((l) => (
                    <div key={l.p.produtoId} className="pm-linha-item">
                      <span className="nome">{l.p.descricao}</span>
                      <div className="pm-stepper">
                        <button onClick={() => setQ(l.p.produtoId, l.q - 1)}><Minus size={16} /></button>
                        <b>{l.q}</b>
                        <button onClick={() => setQ(l.p.produtoId, l.q + 1)} disabled={!!l.p.controlaEstoque && l.q >= l.p.disponivel}><Plus size={16} /></button>
                      </div>
                      <span className="preco">{brl(l.p.preco * l.q)}</span>
                    </div>
                  ))}
                </div>
                <div className="pm-sheet-foot">
                  <div className="pm-total-linha big"><span>Total</span><span>{brl(total)}</span></div>
                  {precisaPreparo && <p className="pm-total-linha muted" style={{ margin: 0 }}>Vai para a fila de preparação.</p>}
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
    </>
  );
}
