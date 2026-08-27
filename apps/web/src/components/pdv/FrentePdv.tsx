"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Lock, Plus, Search, ShoppingCart, Trash2, Unlock } from "lucide-react";
import {
  pdvAbrirCaixa, pdvFecharCaixa, pdvMovimentarCaixa, pdvProdutos,
  pdvRegistrarVenda, pdvResumoSessao, pdvSessaoAtual, pdvTerminais,
} from "@/services/api/pdv";
import type { ItemCarrinho, PdvProduto } from "@/types/pdv";
import { ErroApi } from "@/services/api/client";
import { Select } from "@/components/ui/Select";
import "@/app/pdv.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const FORMAS = ["Dinheiro", "Pix", "Cartão de Débito", "Cartão de Crédito", "Boleto", "Transferência"];

export function FrentePdv() {
  const qc = useQueryClient();
  const sessao = useQuery({ queryKey: ["pdv", "sessao"], queryFn: pdvSessaoAtual });
  const s = sessao.data;

  if (sessao.isLoading) return <main className="pdv-page"><p className="pdv-empty">Carregando…</p></main>;
  if (!s) return <AbrirCaixa aoAbrir={() => qc.invalidateQueries({ queryKey: ["pdv", "sessao"] })} />;
  return <CaixaAberto sessao={s} />;
}

function AbrirCaixa({ aoAbrir }: { aoAbrir: () => void }) {
  const terminais = useQuery({ queryKey: ["pdv", "terminais"], queryFn: pdvTerminais });
  const [terminalId, setTerminalId] = useState("");
  const [fundo, setFundo] = useState("0");
  const [erro, setErro] = useState<string | null>(null);
  const abrir = useMutation({
    mutationFn: () => pdvAbrirCaixa(terminalId || terminais.data?.[0]?.id || "", Number(fundo) || 0),
    onSuccess: aoAbrir,
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao abrir o caixa."),
  });
  return (
    <main className="pdv-page">
      <div className="pdv-fechado">
        <Unlock size={26} style={{ color: "var(--gold)" }} />
        <h2>Caixa fechado</h2>
        <p>Abra um caixa para começar a vender. O fundo de troco entra no fechamento.</p>
        <div style={{ maxWidth: 320, margin: "0 auto", display: "grid", gap: 12, textAlign: "left" }}>
          <label style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>Terminal</label>
          <Select className="pdv-select" aria-label="Terminal" value={terminalId} onChange={setTerminalId} style={{ width: "100%" }}
            options={(terminais.data ?? []).map((t) => ({ value: t.id, label: t.nome }))} />
          <label style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>Fundo de troco (R$)</label>
          <input className="pdv-input" type="number" min={0} step="0.01" value={fundo} onChange={(e) => setFundo(e.target.value)} />
          {erro && <span style={{ color: "var(--down)", fontSize: 12 }}>{erro}</span>}
          <button className="pdv-btn ouro" disabled={abrir.isPending} onClick={() => { setErro(null); abrir.mutate(); }} style={{ justifyContent: "center" }}>
            <Unlock size={15} /> Abrir caixa
          </button>
        </div>
      </div>
    </main>
  );
}

function CaixaAberto({ sessao }: { sessao: NonNullable<Awaited<ReturnType<typeof pdvSessaoAtual>>> }) {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [forma, setForma] = useState(FORMAS[0]);
  const [cliente, setCliente] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "fechar" | "sangria" | "reforco">(null);

  const produtos = useQuery({ queryKey: ["pdv", "produtos", busca], queryFn: () => pdvProdutos(busca) });

  const subtotal = useMemo(() => carrinho.reduce((n, i) => n + i.quantidade * i.precoUnit, 0), [carrinho]);
  const total = Math.max(0, subtotal - desconto);

  function adicionar(p: PdvProduto) {
    setCarrinho((c) => {
      const i = c.findIndex((x) => x.produtoId === p.produtoId);
      if (i >= 0) { const cp = [...c]; cp[i] = { ...cp[i], quantidade: cp[i].quantidade + 1 }; return cp; }
      return [...c, { produtoId: p.produtoId, descricao: p.descricao ?? "Produto", quantidade: 1, precoUnit: p.preco }];
    });
  }
  const setQtd = (i: number, q: number) => setCarrinho((c) => c.map((x, k) => (k === i ? { ...x, quantidade: Math.max(0.001, q) } : x)));
  const remover = (i: number) => setCarrinho((c) => c.filter((_, k) => k !== i));

  const vender = useMutation({
    mutationFn: () => pdvRegistrarVenda({
      sessaoId: sessao.id, clienteNome: cliente || undefined, desconto,
      itens: carrinho.map((i) => ({ produtoId: i.produtoId, descricao: i.descricao, quantidade: i.quantidade, precoUnit: i.precoUnit })),
      pagamentos: [{ formaPagamento: forma, valor: total }],
    }),
    onSuccess: (v) => {
      setOk(`Venda ${v.numero} registrada · ${brl(Number(v.total))}`);
      setCarrinho([]); setDesconto(0); setCliente("");
      produtos.refetch();
      qc.invalidateQueries({ queryKey: ["pdv"] });
      setTimeout(() => setOk(null), 3500);
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao registrar a venda."),
  });

  return (
    <main className="pdv-page">
      <header className="pdv-hero">
        <div>
          <span className="tag">PDV · CAIXA ABERTO</span>
          <h1>Frente de caixa</h1>
          <p>{sessao.terminal?.nome ?? "Terminal"} · aberto por {sessao.abertoPorNome} · fundo {brl(Number(sessao.fundoAbertura))}</p>
        </div>
        <div className="acoes">
          <button className="pdv-btn" onClick={() => setModal("reforco")}><ArrowUpCircle size={15} /> Reforço</button>
          <button className="pdv-btn" onClick={() => setModal("sangria")}><ArrowDownCircle size={15} /> Sangria</button>
          <button className="pdv-btn perigo" onClick={() => setModal("fechar")}><Lock size={15} /> Fechar caixa</button>
        </div>
      </header>

      {ok && <div className="pdv-card" style={{ borderColor: "rgb(var(--up-rgb,111 207 151)/.5)", color: "var(--up)", fontWeight: 700 }}>{ok}</div>}

      <div className="pdv-grid">
        <section className="pdv-card">
          <header>
            <h2>Produtos</h2>
            <label className="pdv-busca"><Search size={15} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Código ou descrição" /></label>
          </header>
          <div>
            {(produtos.data ?? []).map((p) => (
              <div key={p.produtoId} className="pdv-prod" onClick={() => adicionar(p)}>
                <div>
                  <b>{p.descricao || "Sem descrição"}</b>
                  <small>{p.codigo || `#${p.produtoId}`} · <span className="disp">disp. {p.disponivel.toLocaleString("pt-BR")}</span></small>
                </div>
                <span className="preco">{brl(p.preco)}</span>
              </div>
            ))}
            {!produtos.isLoading && !(produtos.data ?? []).length && <p className="pdv-empty">Nenhum produto encontrado.</p>}
          </div>
        </section>

        <aside className="pdv-card">
          <header><h2><ShoppingCart size={15} style={{ verticalAlign: "-2px" }} /> Carrinho</h2><span style={{ fontSize: 11, color: "var(--muted)" }}>{carrinho.length} item(ns)</span></header>
          <div className="pdv-cart">
            {carrinho.map((i, k) => (
              <div key={k} className="linha">
                <div><b>{i.descricao}</b><small style={{ color: "var(--muted)", fontSize: 10 }}>{brl(i.precoUnit)}</small></div>
                <input type="number" min={0.001} step="1" value={i.quantidade} onChange={(e) => setQtd(k, Number(e.target.value))} />
                <span style={{ fontWeight: 700 }}>{brl(i.quantidade * i.precoUnit)}</span>
                <button className="rm" onClick={() => remover(k)}><Trash2 size={15} /></button>
              </div>
            ))}
            {!carrinho.length && <p className="pdv-empty">Clique num produto para adicionar.</p>}
          </div>

          {carrinho.length > 0 && (
            <>
              <div className="pdv-tot"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
              <div className="pdv-tot">
                <span>Desconto</span>
                <input className="pdv-input" style={{ width: 110, textAlign: "right" }} type="number" min={0} step="0.01" value={desconto} onChange={(e) => setDesconto(Math.max(0, Number(e.target.value)))} />
              </div>
              <div className="pdv-tot grande"><span>Total</span><b>{brl(total)}</b></div>
              <input className="pdv-input" style={{ marginTop: 10 }} placeholder="Cliente (opcional)" value={cliente} onChange={(e) => setCliente(e.target.value)} />
              <div className="pdv-pag">
                <Select className="pdv-select" aria-label="Forma" value={forma} onChange={setForma} style={{ width: "100%" }} options={FORMAS.map((f) => ({ value: f, label: f }))} />
                <button className="pdv-btn ouro" disabled={vender.isPending || total <= 0} onClick={() => { setErro(null); vender.mutate(); }}>Finalizar</button>
              </div>
              {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
            </>
          )}
        </aside>
      </div>

      {modal && <ModalCaixa tipo={modal} sessaoId={sessao.id} aoFechar={() => setModal(null)} aoConcluir={() => { setModal(null); qc.invalidateQueries({ queryKey: ["pdv", "sessao"] }); }} />}
    </main>
  );
}

function ModalCaixa({ tipo, sessaoId, aoFechar, aoConcluir }: { tipo: "fechar" | "sangria" | "reforco"; sessaoId: string; aoFechar: () => void; aoConcluir: () => void }) {
  const resumo = useQuery({ queryKey: ["pdv", "resumo", sessaoId], queryFn: () => pdvResumoSessao(sessaoId), enabled: tipo === "fechar" });
  const [valor, setValor] = useState("0");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const acao = useMutation({
    mutationFn: () => tipo === "fechar"
      ? pdvFecharCaixa(sessaoId, { contadoDinheiro: Number(valor) || 0 })
      : pdvMovimentarCaixa(sessaoId, { tipo, valor: Number(valor) || 0, motivo }),
    onSuccess: aoConcluir,
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha na operação."),
  });

  const titulo = tipo === "fechar" ? "Fechar caixa" : tipo === "sangria" ? "Sangria (retirada)" : "Reforço (aporte)";
  return (
    <div className="pdv-modal-bg" onClick={aoFechar}>
      <div className="pdv-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        {tipo === "fechar" && resumo.data && (
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 6 }}>
            <div>Esperado em dinheiro: <b style={{ color: "var(--text)" }}>{brl(resumo.data.esperadoDinheiro)}</b></div>
            {resumo.data.formas.map((f) => <div key={f.forma}>{f.forma}: {brl(f.valor)} ({f.transacoes})</div>)}
          </div>
        )}
        <label>{tipo === "fechar" ? "Dinheiro contado (R$)" : "Valor (R$)"}</label>
        <input className="pdv-input" type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} autoFocus />
        {tipo !== "fechar" && (<><label>Motivo</label><input className="pdv-input" value={motivo} onChange={(e) => setMotivo(e.target.value)} /></>)}
        {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
        <div className="fim">
          <button className="pdv-btn" onClick={aoFechar}>Cancelar</button>
          <button className="pdv-btn ouro" disabled={acao.isPending} onClick={() => { setErro(null); acao.mutate(); }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
