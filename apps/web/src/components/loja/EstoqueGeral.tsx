"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Boxes, ClipboardList, Search, ShoppingCart, TriangleAlert } from "lucide-react";
import {
  lojaIndicadores,
  lojaProdutos,
  lojaReposicao,
  lojaTransferirEstoque,
} from "@/services/api/loja-produtos";
import { InventarioLoja } from "@/components/loja/InventarioLoja";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import type { LojaLocal, LojaProduto, ReposicaoItem } from "@/types/loja-produtos";
import "@/app/loja.css";

const num = (n: number | string) => Number(n).toLocaleString("pt-BR");
const NOME_LOCAL: Record<LojaLocal, string> = { LOJA: "Loja", DEPOSITO: "Depósito" };

export function EstoqueGeral() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao());
  const podeGerir = pode(perfil.data, "loja.produtos.gerenciar");

  const [aba, setAba] = useState<"saldos" | "inventario" | "reposicao">("saldos");
  const [busca, setBusca] = useState("");
  const [transferir, setTransferir] = useState<{ produto: LojaProduto; origem: LojaLocal; destino: LojaLocal } | null>(null);

  const ind = useQuery({ queryKey: ["loja", "indicadores"], queryFn: lojaIndicadores });
  const prods = useQuery({
    queryKey: ["loja", "produtos", "estoque", busca],
    queryFn: () => lojaProdutos({ busca: busca || undefined, situacao: "ativos" }),
  });
  const repo = useQuery({ queryKey: ["loja", "reposicao"], queryFn: lojaReposicao, enabled: aba === "reposicao" });

  const i = ind.data;
  const invalidar = () => qc.invalidateQueries({ queryKey: ["loja"] });

  return (
    <main className="loja-page">
      <header className="loja-hero">
        <div>
          <span className="tag">ESTOQUE · LOJA E DEPÓSITO</span>
          <h1>Estoque geral</h1>
          <p>Saldos por local, <b>inventário</b> (contagem que ajusta o saldo, bipando o código de barras), transferência entre <b>Loja</b> e <b>Depósito</b> e sugestão de reposição. Para cadastrar produto, use Loja → Produtos.</p>
        </div>
      </header>

      <section className="loja-kpis">
        {(i?.porLocal ?? []).map((l) => (
          <article key={l.local}><small>SALDO · {NOME_LOCAL[l.local].toUpperCase()}</small><b>{num(l.saldoFisico)}</b><span>{num(l.reservado)} reservado</span></article>
        ))}
        <article><small>PRODUTOS ATIVOS</small><b>{i?.ativos ?? 0}</b><span>de {i?.totalProdutos ?? 0}</span></article>
        <article><small>ESTOQUE BAIXO</small><b className={i?.abaixoMinimo ? "down" : ""}>{i?.abaixoMinimo ?? 0}</b><span>abaixo do mínimo</span></article>
      </section>

      <section className="loja-card">
        <div className="loja-filtros" style={{ marginBottom: 12 }}>
          <button className={`loja-chip ${aba === "saldos" ? "ativo" : ""}`} onClick={() => setAba("saldos")}><Boxes size={13} /> Saldos por local</button>
          <button className={`loja-chip ${aba === "inventario" ? "ativo" : ""}`} onClick={() => setAba("inventario")}><ClipboardList size={13} /> Inventário</button>
          <button className={`loja-chip ${aba === "reposicao" ? "ativo" : ""}`} onClick={() => setAba("reposicao")}><TriangleAlert size={13} /> Sugestão de reposição {i?.abaixoMinimo ? `(${i.abaixoMinimo})` : ""}</button>
        </div>

        {aba === "saldos" && (
          <>
            <header>
              <label className="loja-busca"><Search size={15} /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, SKU ou código de barras" /></label>
            </header>
            <div className="loja-tabela-wrap">
              <table className="loja-tabela">
                <thead>
                  <tr><th>Produto</th><th className="dir">Loja</th><th className="dir">Depósito</th><th className="dir">Disponível</th><th className="dir">Mínimo</th>{podeGerir && <th></th>}</tr>
                </thead>
                <tbody>
                  {(prods.data ?? []).map((p) => {
                    const loja = p.estoque.porLocal.LOJA;
                    const dep = p.estoque.porLocal.DEPOSITO;
                    const baixo = Number(p.estoqueMinimo) > 0 && p.estoque.saldoTotal <= Number(p.estoqueMinimo);
                    return (
                      <tr key={p.id} className={baixo ? "baixo" : ""}>
                        <td><b>{p.nome}</b>{p.sku && <small style={{ display: "block", color: "var(--muted)" }}>{p.sku}</small>}</td>
                        <td className="dir">{num(loja.saldoFisico)}{loja.reservado > 0 && <small style={{ display: "block", color: "var(--muted)" }}>{num(loja.reservado)} res.</small>}</td>
                        <td className="dir">{num(dep.saldoFisico)}{dep.reservado > 0 && <small style={{ display: "block", color: "var(--muted)" }}>{num(dep.reservado)} res.</small>}</td>
                        <td className="dir"><b>{num(p.estoque.disponivelTotal)}</b></td>
                        <td className="dir">{Number(p.estoqueMinimo) > 0 ? num(p.estoqueMinimo) : "—"}</td>
                        {podeGerir && (
                          <td className="dir">
                            <button className="loja-btn" title="Transferir entre Loja e Depósito"
                              onClick={() => setTransferir({ produto: p, origem: "DEPOSITO", destino: "LOJA" })}>
                              <ArrowLeftRight size={14} /> Transferir
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {prods.isError && <p className="loja-empty" style={{ color: "var(--down)" }}>Não foi possível carregar o estoque. Verifique sua conexão e tente novamente.</p>}
              {!prods.isLoading && !prods.isError && !(prods.data ?? []).length && <p className="loja-empty">{busca ? "Nenhum produto encontrado para essa busca." : "Nenhum produto cadastrado ainda."}</p>}
            </div>
          </>
        )}

        {aba === "inventario" && (
          <InventarioLoja podeGerir={podeGerir} />
        )}

        {aba === "reposicao" && (
          <PainelReposicao
            itens={repo.data?.itens ?? []}
            carregando={repo.isLoading}
            erro={repo.isError}
            podeGerir={podeGerir}
            aoTransferir={(it) => {
              const prod = (prods.data ?? []).find((p) => p.id === it.id);
              if (prod) setTransferir({ produto: prod, origem: "DEPOSITO", destino: "LOJA" });
            }}
          />
        )}
      </section>

      {transferir && podeGerir && (
        <ModalTransferencia
          {...transferir}
          aoFechar={() => setTransferir(null)}
          aoConcluir={() => { invalidar(); qc.invalidateQueries({ queryKey: ["loja", "reposicao"] }); setTransferir(null); }}
        />
      )}
    </main>
  );
}

function PainelReposicao({
  itens, carregando, erro, podeGerir, aoTransferir,
}: {
  itens: ReposicaoItem[];
  carregando: boolean;
  erro?: boolean;
  podeGerir: boolean;
  aoTransferir: (it: ReposicaoItem) => void;
}) {
  if (carregando) return <p className="loja-empty">Calculando reposição…</p>;
  if (erro) return <p className="loja-empty" style={{ color: "var(--down)" }}>Não foi possível calcular a reposição. Tente novamente.</p>;
  if (!itens.length)
    return <p className="loja-empty">✓ Nenhum item abaixo do mínimo. Defina o <b>estoque mínimo</b> nos produtos para ativar as sugestões.</p>;
  return (
    <div className="loja-tabela-wrap">
      <table className="loja-tabela">
        <thead>
          <tr><th>Produto</th><th className="dir">Total</th><th className="dir">Mínimo</th><th className="dir">Repor</th><th className="dir">Depósito</th><th></th></tr>
        </thead>
        <tbody>
          {itens.map((it) => (
            <tr key={it.id} className="baixo">
              <td><b>{it.nome}</b>{it.categoria && <small style={{ display: "block", color: "var(--muted)" }}>{it.categoria}</small>}</td>
              <td className="dir">{num(it.saldoTotal)}</td>
              <td className="dir">{num(it.minimo)}</td>
              <td className="dir"><b className="down">{num(it.sugestaoRepor)} {it.unidade}</b></td>
              <td className="dir">{num(it.saldoDeposito)}</td>
              <td className="dir">
                <div style={{ display: "inline-flex", gap: 6 }}>
                  {podeGerir && it.podeTransferirDoDeposito && (
                    <button className="loja-btn" title="Transferir do Depósito para a Loja" onClick={() => aoTransferir(it)}>
                      <ArrowLeftRight size={13} /> Do depósito
                    </button>
                  )}
                  <Link className="loja-btn ouro" href="/compras/nova" title="Abrir Solicitação de Compra">
                    <ShoppingCart size={13} /> Comprar
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModalTransferencia({
  produto, origem: origemInicial, destino: destinoInicial, aoFechar, aoConcluir,
}: {
  produto: LojaProduto;
  origem: LojaLocal;
  destino: LojaLocal;
  aoFechar: () => void;
  aoConcluir: () => void;
}) {
  const [origem, setOrigem] = useState<LojaLocal>(origemInicial);
  const [destino, setDestino] = useState<LojaLocal>(destinoInicial);
  const [qtd, setQtd] = useState("");
  const [obs, setObs] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const disponivelOrigem = produto.estoque.porLocal[origem].disponivel;
  const transferir = useMutation({
    mutationFn: () => lojaTransferirEstoque(produto.id, { origem, destino, quantidade: Number(qtd) || 0, observacao: obs || undefined }),
    onSuccess: aoConcluir,
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha na transferência."),
  });

  const inverter = () => { setOrigem(destino); setDestino(origem); };

  return (
    <div className="loja-modal-bg" onClick={aoFechar}>
      <div className="loja-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Transferir estoque · {produto.nome}</h3>
        <div className="loja-locais" style={{ marginBottom: 12 }}>
          {(["LOJA", "DEPOSITO"] as LojaLocal[]).map((loc) => (
            <article key={loc} className="loja-card" style={{ flex: 1, padding: 12 }}>
              <small style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700 }}>{NOME_LOCAL[loc].toUpperCase()}</small>
              <b style={{ display: "block", fontSize: 22 }}>{num(produto.estoque.porLocal[loc].disponivel)}</b>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>{num(produto.estoque.porLocal[loc].saldoFisico)} físico</span>
            </article>
          ))}
        </div>

        <div className="loja-grid2" style={{ alignItems: "end" }}>
          <div><label>De</label><select className="loja-select" value={origem} onChange={(e) => setOrigem(e.target.value as LojaLocal)}><option value="LOJA">Loja</option><option value="DEPOSITO">Depósito</option></select></div>
          <div><label>Para</label><select className="loja-select" value={destino} onChange={(e) => setDestino(e.target.value as LojaLocal)}><option value="LOJA">Loja</option><option value="DEPOSITO">Depósito</option></select></div>
        </div>
        <div style={{ margin: "8px 0" }}>
          <button className="loja-btn" onClick={inverter}><ArrowLeftRight size={13} /> Inverter sentido</button>
        </div>
        <label>Quantidade <small style={{ color: "var(--muted)" }}>(disponível em {NOME_LOCAL[origem]}: {num(disponivelOrigem)})</small></label>
        <input className="loja-input" type="number" min={0.001} step="0.001" max={disponivelOrigem} value={qtd} onChange={(e) => setQtd(e.target.value)} autoFocus />
        <label>Observação</label>
        <input className="loja-input" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Motivo da transferência (opcional)" />
        {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
        <div className="fim">
          <button className="loja-btn" onClick={aoFechar}>Cancelar</button>
          <button className="loja-btn ouro" disabled={transferir.isPending || !qtd || origem === destino || Number(qtd) > disponivelOrigem}
            onClick={() => { setErro(null); transferir.mutate(); }}>
            Transferir
          </button>
        </div>
      </div>
    </div>
  );
}
