"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound, Search, RotateCcw, Plus, Minus, Trash2, Printer, Save, X, PackageCheck, AlertTriangle,
} from "lucide-react";
import {
  buscarPedidoPorCodigo, editarItensPedido, imprimirCupomPedido, impressoraStatus, lojaProdutosBalcao,
} from "@/services/api/loja-pedidos";
import { ErroApi } from "@/services/api/client";
import type { LojaPedido } from "@/types/loja-pedidos";
import type { PdvProduto } from "@/types/pdv";
import "@/app/loja.css";
import "@/app/codigo.css";

const brl = (n: number | string) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Uma linha do carrinho em edição (estado local). */
interface Linha { produtoId: string; descricao: string; quantidade: number; precoUnit: number; observacao: string }

const STATUS_ROTULO: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  PAGAMENTO_CONFIRMADO: "Pagamento confirmado",
  NA_FILA: "Na fila",
  PROXIMO: "Próximo",
  EM_PREPARACAO: "Em preparação",
  PRONTO: "Pronto",
  RETIRADO: "Retirado",
  CANCELADO: "Cancelado",
};

const EDITAVEL = ["AGUARDANDO_PAGAMENTO", "NA_FILA", "PROXIMO", "EM_PREPARACAO"];

export function AtenderCodigo() {
  const qc = useQueryClient();
  const [codigo, setCodigo] = useState("");
  const [buscado, setBuscado] = useState<string | null>(null); // código efetivamente buscado
  const [pedido, setPedido] = useState<LojaPedido | null>(null);
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [editando, setEditando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [buscaProd, setBuscaProd] = useState("");

  // Estado da impressora (para habilitar o botão de imprimir).
  const impressora = useQuery({ queryKey: ["impressora-status"], queryFn: impressoraStatus, refetchInterval: 30000, retry: false });

  // Produtos do balcão (para adicionar itens ao pedido).
  const produtos = useQuery({
    queryKey: ["balcao-produtos", buscaProd],
    queryFn: () => lojaProdutosBalcao(buscaProd || undefined),
    enabled: editando,
  });

  const busca = useMutation({
    mutationFn: (c: string) => buscarPedidoPorCodigo(c),
    onMutate: () => { setErro(null); setAviso(null); },
    onSuccess: (p) => {
      setPedido(p);
      carregarPedido(p);
      if (p.ambiguo) setAviso("Mais de um pedido ativo com este código — mostrando o mais recente.");
    },
    onError: (e) => {
      setPedido(null);
      setErro(e instanceof ErroApi ? e.mensagem : "Não foi possível buscar o pedido.");
    },
  });

  const salvar = useMutation({
    mutationFn: () => editarItensPedido(pedido!.id, {
      itens: linhas.map((l) => ({ produtoId: l.produtoId, quantidade: l.quantidade, observacao: l.observacao || undefined })),
      desconto,
    }),
    onSuccess: (p) => {
      setPedido(p);
      carregarPedido(p);
      setEditando(false);
      setErro(null);
      qc.invalidateQueries({ queryKey: ["loja-pedidos"] });
    },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao salvar as alterações."),
  });

  const imprimir = useMutation({
    mutationFn: () => imprimirCupomPedido(pedido!.id),
    onMutate: () => { setErro(null); setAviso(null); },
    onSuccess: () => setAviso("Cupom enviado para a impressora."),
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao imprimir o cupom."),
  });

  function carregarPedido(p: LojaPedido) {
    setLinhas(p.itens.map((it) => ({
      produtoId: it.produtoId, descricao: it.descricao,
      quantidade: Number(it.quantidade), precoUnit: Number(it.precoUnit), observacao: it.observacao ?? "",
    })));
    setDesconto(Number(p.desconto));
    setEditando(false);
  }

  function submeterBusca() {
    const c = codigo.replace(/\D/g, "").slice(0, 3);
    if (c.length !== 3) { setErro("Digite os 3 dígitos do código."); return; }
    setBuscado(c);
    busca.mutate(c);
  }

  function reiniciar() {
    setCodigo(""); setBuscado(null); setPedido(null); setLinhas([]); setDesconto(0);
    setEditando(false); setErro(null); setAviso(null); setBuscaProd("");
    busca.reset(); salvar.reset(); imprimir.reset();
  }

  function ajustarQtd(produtoId: string, delta: number) {
    setLinhas((ls) => ls
      .map((l) => (l.produtoId === produtoId ? { ...l, quantidade: Math.max(0, +(l.quantidade + delta).toFixed(3)) } : l))
      .filter((l) => l.quantidade > 0));
  }
  function removerLinha(produtoId: string) {
    setLinhas((ls) => ls.filter((l) => l.produtoId !== produtoId));
  }
  function adicionarProduto(p: PdvProduto) {
    setLinhas((ls) => {
      const existe = ls.find((l) => l.produtoId === p.produtoId);
      if (existe) return ls.map((l) => (l.produtoId === p.produtoId ? { ...l, quantidade: +(l.quantidade + 1).toFixed(3) } : l));
      return [...ls, { produtoId: p.produtoId, descricao: p.descricao ?? "Produto", quantidade: 1, precoUnit: Number(p.preco), observacao: "" }];
    });
  }
  function setObs(produtoId: string, obs: string) {
    setLinhas((ls) => ls.map((l) => (l.produtoId === produtoId ? { ...l, observacao: obs } : l)));
  }

  const subtotal = useMemo(() => +linhas.reduce((s, l) => s + l.precoUnit * l.quantidade, 0).toFixed(2), [linhas]);
  const total = Math.max(0, +(subtotal - desconto).toFixed(2));
  const podeEditar = !!pedido && EDITAVEL.includes(pedido.status);
  const impressoraOk = impressora.data?.ok !== false; // otimista se ainda não sabe

  return (
    <div className="cod-page">
      <header className="cod-hero">
        <div>
          <span className="tag">LOJA · ATENDIMENTO</span>
          <h1>Atender por código</h1>
          <p>Digite o código de 3 dígitos do cliente para ver, editar e imprimir o pedido.</p>
        </div>
        {pedido && <button className="loja-btn" onClick={reiniciar}><RotateCcw /> Novo atendimento</button>}
      </header>

      {/* ---------- BUSCA POR CÓDIGO ---------- */}
      {!pedido && (
        <section className="cod-busca">
          <label>Código do cliente</label>
          <div className="cod-busca-linha">
            <div className="cod-input-cod">
              <KeyRound />
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 3))}
                onKeyDown={(e) => e.key === "Enter" && submeterBusca()}
                placeholder="000"
                inputMode="numeric"
                enterKeyHint="search"
                autoComplete="off"
                maxLength={3}
                autoFocus
              />
            </div>
            <button className="loja-btn ouro" onClick={submeterBusca} disabled={codigo.length !== 3 || busca.isPending}>
              <Search /> {busca.isPending ? "Buscando…" : "Buscar pedido"}
            </button>
          </div>
          {erro && <p className="cod-erro">{erro}</p>}
          <p className="cod-dica">O código de 3 dígitos aparece no comprovante do cliente após o pagamento.</p>
        </section>
      )}

      {/* ---------- PEDIDO ENCONTRADO ---------- */}
      {pedido && (
        <section className="cod-pedido">
          <div className="cod-pedido-topo">
            <div>
              <span className="cod-codigo">Código {buscado}</span>
              <h2>Pedido #{pedido.numero}</h2>
              <p className="cod-meta">
                {pedido.clienteNome || "Consumidor"}
                {pedido.senhaFila != null && <> · Senha {String(pedido.senhaFila).padStart(2, "0")}</>}
              </p>
            </div>
            <span className={`cod-status s-${pedido.status.toLowerCase()}`}>{STATUS_ROTULO[pedido.status] ?? pedido.status}</span>
          </div>

          {aviso && <p className="cod-aviso"><AlertTriangle /> {aviso}</p>}
          {erro && <p className="cod-erro">{erro}</p>}

          {/* ----- CARRINHO ----- */}
          <ul className="cod-itens">
            {linhas.length === 0 && <li className="cod-vazio">Nenhum item no pedido.</li>}
            {linhas.map((l) => (
              <li key={l.produtoId} className="cod-item">
                <div className="cod-item-info">
                  <span className="cod-item-desc">{l.descricao}</span>
                  <span className="cod-item-preco">{brl(l.precoUnit)} un</span>
                </div>

                {editando ? (
                  <div className="cod-item-edit">
                    <div className="cod-qtd">
                      <button onClick={() => ajustarQtd(l.produtoId, -1)} aria-label="Diminuir"><Minus /></button>
                      <span>{l.quantidade}</span>
                      <button onClick={() => ajustarQtd(l.produtoId, +1)} aria-label="Aumentar"><Plus /></button>
                    </div>
                    <input
                      className="cod-obs"
                      value={l.observacao}
                      onChange={(e) => setObs(l.produtoId, e.target.value)}
                      placeholder="Observação (ex.: sem açúcar)"
                    />
                    <button className="cod-remove" onClick={() => removerLinha(l.produtoId)} aria-label="Remover"><Trash2 /></button>
                  </div>
                ) : (
                  <div className="cod-item-view">
                    <span className="cod-item-qtd">{l.quantidade}×</span>
                    {l.observacao && <span className="cod-item-obs">» {l.observacao}</span>}
                    <span className="cod-item-total">{brl(l.precoUnit * l.quantidade)}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* ----- ADICIONAR PRODUTO (só em edição) ----- */}
          {editando && (
            <div className="cod-add">
              <div className="cod-add-busca">
                <Search />
                <input
                  value={buscaProd}
                  onChange={(e) => setBuscaProd(e.target.value)}
                  placeholder="Adicionar produto ao pedido…"
                />
              </div>
              {produtos.data && produtos.data.length > 0 && (
                <div className="cod-add-lista">
                  {produtos.data.slice(0, 12).map((p) => (
                    <button key={p.produtoId} className="cod-add-item" onClick={() => adicionarProduto(p)}>
                      <span>{p.descricao}</span>
                      <b>{brl(p.preco)}</b>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ----- TOTAIS ----- */}
          <div className="cod-totais">
            <div className="cod-linha"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
            <div className="cod-linha cod-desc">
              <span>Desconto</span>
              {editando ? (
                <div className="cod-desc-input">
                  <span>R$</span>
                  <input
                    type="number" min={0} step="0.01"
                    value={desconto || ""}
                    onChange={(e) => setDesconto(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0,00"
                  />
                </div>
              ) : (
                <span>− {brl(desconto)}</span>
              )}
            </div>
            <div className="cod-linha cod-total"><span>Total</span><b>{brl(total)}</b></div>
          </div>

          {/* ----- AÇÕES ----- */}
          <div className="cod-acoes">
            {!editando && podeEditar && (
              <button className="loja-btn" onClick={() => setEditando(true)}><Plus /> Editar pedido</button>
            )}
            {editando && (
              <>
                <button className="loja-btn" onClick={() => { carregarPedido(pedido); }}><X /> Cancelar</button>
                <button className="loja-btn ouro" onClick={() => salvar.mutate()} disabled={salvar.isPending || linhas.length === 0}>
                  <Save /> {salvar.isPending ? "Salvando…" : "Salvar alterações"}
                </button>
              </>
            )}
            {!editando && (
              <button
                className="cod-imprimir"
                onClick={() => imprimir.mutate()}
                disabled={imprimir.isPending || !impressoraOk}
                title={impressoraOk ? "Imprimir cupom" : "Impressora indisponível"}
              >
                <Printer /> {imprimir.isPending ? "Imprimindo…" : "Imprimir cupom"}
              </button>
            )}
          </div>
          {!impressoraOk && !editando && (
            <p className="cod-aviso"><AlertTriangle /> Impressora indisponível no momento.</p>
          )}
          {imprimir.isSuccess && <p className="cod-ok"><PackageCheck /> Cupom enviado à impressora.</p>}
        </section>
      )}
    </div>
  );
}
