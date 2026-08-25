"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, Search, Trash2, Truck, ChefHat, Check } from "lucide-react";
import { pdvProdutos } from "@/services/api/pdv";
import { vendaPdvFila } from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import type { FormaPagamento, VendaPdvInput } from "@/types/loja-pedidos";
import "@/app/loja.css";
import "@/app/fila.css";

/** Forma do produto vendável do balcão (o endpoint /pdv/produtos devolve isto). */
interface ProdutoBalcao {
  produtoId: string;
  descricao: string;
  preco: number;
  disponivel: number;
  controlaEstoque?: boolean;
  precisaPreparacao?: boolean;
}

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const FORMAS: { forma: FormaPagamento; label: string }[] = [
  { forma: "DINHEIRO", label: "Dinheiro" },
  { forma: "PIX", label: "PIX" },
  { forma: "CARTAO_DEBITO", label: "Débito" },
  { forma: "CARTAO_CREDITO", label: "Crédito" },
];

interface LinhaCarrinho { produto: ProdutoBalcao; quantidade: number; }
interface Split { forma: FormaPagamento; valor: number; }

export function BalcaoPdv() {
  const qc = useQueryClient();
  const podeOperar = pode(usePerfil(useSessao()).data, "loja.pedidos.operar");
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<Record<string, LinhaCarrinho>>({});
  const [desconto, setDesconto] = useState(0);
  const [splits, setSplits] = useState<Split[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const produtos = useQuery({
    queryKey: ["pdv-produtos", busca],
    queryFn: async (): Promise<ProdutoBalcao[]> => {
      const rows = await pdvProdutos(busca);
      return rows.map((p) => ({
        produtoId: p.produtoId,
        descricao: p.descricao ?? "",
        preco: p.preco,
        disponivel: p.disponivel,
        controlaEstoque: (p as { controlaEstoque?: boolean }).controlaEstoque,
        precisaPreparacao: (p as { precisaPreparacao?: boolean }).precisaPreparacao,
      }));
    },
  });

  const linhas = Object.values(carrinho);
  const subtotal = useMemo(() => linhas.reduce((s, l) => s + l.produto.preco * l.quantidade, 0), [linhas]);
  const total = Math.max(0, +(subtotal - desconto).toFixed(2));
  const pago = +splits.reduce((s, p) => s + p.valor, 0).toFixed(2);
  const falta = +(total - pago).toFixed(2);

  const add = (p: ProdutoBalcao) => setCarrinho((c) => {
    const atual = c[p.produtoId];
    return { ...c, [p.produtoId]: { produto: p, quantidade: (atual?.quantidade ?? 0) + 1 } };
  });
  const setQty = (id: string, q: number) => setCarrinho((c) => {
    if (q <= 0) { const cp = { ...c }; delete cp[id]; return cp; }
    return { ...c, [id]: { ...c[id], quantidade: q } };
  });

  const addSplit = (forma: FormaPagamento) => setSplits((s) => [...s, { forma, valor: Math.max(0, falta) }]);
  const setSplitValor = (i: number, valor: number) => setSplits((s) => s.map((x, k) => (k === i ? { ...x, valor } : x)));
  const rmSplit = (i: number) => setSplits((s) => s.filter((_, k) => k !== i));

  const limpar = () => { setCarrinho({}); setSplits([]); setDesconto(0); };

  const venda = useMutation({
    mutationFn: (modo: VendaPdvInput["modo"]) => {
      const pagamentos = splits.length ? splits : [{ forma: "DINHEIRO" as FormaPagamento, valor: total }];
      return vendaPdvFila({
        modo, desconto,
        itens: linhas.map((l) => ({ produtoId: l.produto.produtoId, quantidade: l.quantidade })),
        pagamentos,
      });
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
  const podeFinalizar = linhas.length > 0 && (splits.length === 0 || Math.abs(falta) < 0.01);

  return (
    <div className="fila-page">
      <header className="fila-hero">
        <div>
          <span className="tag">LOJA · PDV BALCÃO</span>
          <h1>Venda rápida</h1>
          <p>Busca → carrinho → pagamento (split) → entregar agora ou enviar para preparação. Mesma fila e mesmo estoque.</p>
        </div>
      </header>

      {erro && <div className="fila-erro">{erro}</div>}
      {ok && <div className="fila-erro" style={{ color: "var(--gold)", borderColor: "var(--gold)" }}>{ok}</div>}

      <div className="balcao-grid">
        {/* catálogo */}
        <section className="loja-card">
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <Search style={{ width: 16, opacity: .6 }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, SKU ou código de barras"
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid var(--card-line)", background: "var(--card)", color: "inherit", fontSize: 14 }} />
          </div>
          <div className="balcao-produtos">
            {(produtos.data ?? []).map((p) => (
              <button key={p.produtoId} className="balcao-produto" disabled={p.disponivel <= 0 && p.controlaEstoque} onClick={() => add(p)}>
                <b>{p.descricao}</b>
                <span>{brl(p.preco)}</span>
                {p.controlaEstoque && <small>{p.disponivel} disp.</small>}
              </button>
            ))}
            {produtos.data?.length === 0 && <p className="fila-vazio">Nenhum produto.</p>}
          </div>
        </section>

        {/* carrinho + pagamento */}
        <section className="loja-card" style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <h3 style={{ margin: 0 }}>Carrinho</h3>
          {linhas.length === 0 && <p className="fila-vazio">Toque num produto para adicionar.</p>}
          {linhas.map((l) => (
            <div key={l.produto.produtoId} className="balcao-linha">
              <span style={{ flex: 1 }}>{l.produto.descricao}</span>
              <div className="qty">
                <button onClick={() => setQty(l.produto.produtoId, l.quantidade - 1)}><Minus size={14} /></button>
                <b>{l.quantidade}</b>
                <button className="add" onClick={() => setQty(l.produto.produtoId, l.quantidade + 1)}><Plus size={14} /></button>
              </div>
              <span style={{ width: 78, textAlign: "right" }}>{brl(l.produto.preco * l.quantidade)}</span>
            </div>
          ))}

          {linhas.length > 0 && (
            <>
              <div className="balcao-linha"><span style={{ flex: 1 }}>Desconto</span>
                <input type="number" min={0} value={desconto} onChange={(e) => setDesconto(Math.max(0, Number(e.target.value)))}
                  style={{ width: 100, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--card-line)", background: "var(--card)", color: "inherit", textAlign: "right" }} />
              </div>
              <div className="balcao-total"><span>Total</span><b>{brl(total)}</b></div>

              <div>
                <h3 style={{ margin: "6px 0 8px", fontSize: 13 }}>Pagamento {splits.length > 0 && <small style={{ color: falta === 0 ? "var(--gold)" : "var(--muted)" }}>· falta {brl(Math.max(0, falta))}</small>}</h3>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {FORMAS.map((f) => (
                    <button key={f.forma} className="loja-btn mini" onClick={() => addSplit(f.forma)}>+ {f.label}</button>
                  ))}
                </div>
                {splits.map((s, i) => (
                  <div key={i} className="balcao-linha">
                    <span style={{ flex: 1 }}>{FORMAS.find((f) => f.forma === s.forma)?.label}</span>
                    <input type="number" min={0} value={s.valor} onChange={(e) => setSplitValor(i, Number(e.target.value))}
                      style={{ width: 100, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--card-line)", background: "var(--card)", color: "inherit", textAlign: "right" }} />
                    <button className="loja-btn perigo mini" onClick={() => rmSplit(i)}><Trash2 size={13} /></button>
                  </div>
                ))}
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>Sem forma escolhida = dinheiro pelo total.</p>
              </div>

              {podeOperar && (
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button className="loja-btn ouro" style={{ flex: 1, justifyContent: "center" }} disabled={!podeFinalizar || venda.isPending}
                    onClick={() => venda.mutate("ENTREGAR_AGORA")}>
                    <Truck size={15} /> Entregar agora
                  </button>
                  {precisaPreparo && (
                    <button className="loja-btn" style={{ flex: 1, justifyContent: "center" }} disabled={!podeFinalizar || venda.isPending}
                      onClick={() => venda.mutate("ENVIAR_PREPARACAO")}>
                      <ChefHat size={15} /> Enviar p/ preparo
                    </button>
                  )}
                </div>
              )}
              <button className="loja-btn mini" onClick={limpar}>Limpar</button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
