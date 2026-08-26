"use client";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Plus, Settings2 } from "lucide-react";
import { finAtualizarLancamento, finCadastros, finCriarLancamento, finExcluirLancamento, finIndicadores, finLancamentos, finPagarLancamento } from "@/services/api/financeiro-erp";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { ErroApi } from "@/services/api/client";
import type { FinLancamento } from "@/types/financeiro-erp";
import { ModalConfirmar } from "@/components/ui/ModalConfirmar";
import { CadastrosFinanceiro } from "./CadastrosFinanceiro";
import "@/app/financeiro-erp.css";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const hoje = () => new Date().toISOString().slice(0, 10);
const restante = (l: FinLancamento) => Number(l.valor) + Number(l.juros) + Number(l.multa) - Number(l.valorPago);
const vencido = (l: FinLancamento) => l.situacao === "pendente" && l.dataVencimento.slice(0, 10) < hoje();

export function CentralFinanceiro() {
  const qc = useQueryClient();
  const perfil = usePerfil(useSessao());
  const podeGerir = pode(perfil.data, "financeiro.gerenciar");
  const [aba, setAba] = useState<"receber" | "pagar">("receber");
  const [novo, setNovo] = useState(false);
  const [cadastros, setCadastros] = useState(false);

  const ind = useQuery({ queryKey: ["fin", "indicadores"], queryFn: finIndicadores });
  const lanc = useQuery({ queryKey: ["fin", "lancamentos", aba], queryFn: () => finLancamentos(aba) });
  const i = ind.data;

  return (
    <main className="fin-page">
      <header className="fin-hero">
        <div>
          <span className="tag">FINANCEIRO ERP</span>
          <h1>Contas a pagar e receber</h1>
          <p>Central financeira do ERP: títulos, baixas e fluxo de caixa. Vendas do PDV entram aqui automaticamente.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/financeiro-erp/dre" className="fin-btn"><BarChart3 size={15} /> DRE</Link>
          {podeGerir && <button className="fin-btn" onClick={() => setCadastros(true)}><Settings2 size={15} /> Cadastros</button>}
          {podeGerir && <button className="fin-btn ouro" onClick={() => setNovo(true)}><Plus size={15} /> Novo lançamento</button>}
        </div>
      </header>

      <section className="fin-kpis">
        <article><small>A RECEBER</small><b className="up">{brl(i?.aReceber ?? 0)}</b><span>em aberto</span></article>
        <article><small>A PAGAR</small><b className="warn">{brl(i?.aPagar ?? 0)}</b><span>em aberto</span></article>
        <article><small>VENCIDO</small><b className="down">{brl((i?.vencidoReceber ?? 0) + (i?.vencidoPagar ?? 0))}</b><span>títulos atrasados</span></article>
        <article><small>CAIXA REALIZADO</small><b>{brl(i?.caixaRealizado ?? 0)}</b><span>recebido − pago</span></article>
      </section>

      <section className="fin-card">
        <header>
          <div className="fin-tabs">
            <button className={`fin-tab ${aba === "receber" ? "ativo" : ""}`} onClick={() => setAba("receber")}>A receber</button>
            <button className={`fin-tab ${aba === "pagar" ? "ativo" : ""}`} onClick={() => setAba("pagar")}>A pagar</button>
          </div>
        </header>
        <TabelaLancamentos lancamentos={lanc.data ?? []} carregando={lanc.isLoading} podeGerir={podeGerir} aoMudar={() => qc.invalidateQueries({ queryKey: ["fin"] })} />
      </section>

      {novo && <ModalLancamento operacao={aba} aoFechar={() => setNovo(false)} aoCriar={() => { setNovo(false); qc.invalidateQueries({ queryKey: ["fin"] }); }} />}
      {cadastros && <CadastrosFinanceiro aoFechar={() => setCadastros(false)} />}
    </main>
  );
}

function TabelaLancamentos({ lancamentos, carregando, podeGerir, aoMudar }: { lancamentos: FinLancamento[]; carregando: boolean; podeGerir: boolean; aoMudar: () => void }) {
  const [pagar, setPagar] = useState<FinLancamento | null>(null);
  const [editar, setEditar] = useState<FinLancamento | null>(null);
  const [excluirAlvo, setExcluirAlvo] = useState<FinLancamento | null>(null);
  const excluir = useMutation({
    mutationFn: (id: string) => finExcluirLancamento(id),
    onSuccess: () => { setExcluirAlvo(null); aoMudar(); },
  });
  return (
    <>
      <table className="fin-table">
        <thead><tr><th>Descrição</th><th>Contraparte</th><th>Vencimento</th><th className="num">Valor</th><th className="num">Em aberto</th><th>Situação</th>{podeGerir && <th></th>}</tr></thead>
        <tbody>
          {lancamentos.map((l) => {
            const editavel = l.origem !== "pdv" && l.situacao !== "pago";
            return (
            <tr key={l.id}>
              <td><b>{l.descricao}</b>{l.origem === "pdv" && <span className="fin-badge pend" style={{ marginLeft: 6 }}>PDV</span>}</td>
              <td>{l.contraparte || "—"}</td>
              <td>{new Date(l.dataVencimento).toLocaleDateString("pt-BR")}</td>
              <td className="num">{brl(Number(l.valor) + Number(l.juros) + Number(l.multa))}</td>
              <td className="num">{brl(restante(l))}</td>
              <td><span className={`fin-badge ${l.situacao === "pago" ? "pago" : vencido(l) ? "venc" : "pend"}`}>{l.situacao === "pago" ? "pago" : vencido(l) ? "vencido" : "pendente"}</span></td>
              {podeGerir && <td style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {l.situacao !== "pago" && <button className="fin-btn" style={{ padding: "5px 9px" }} onClick={() => setPagar(l)}>Registrar pagamento</button>}
                {editavel && <button className="fin-btn" style={{ padding: "5px 9px" }} onClick={() => setEditar(l)}>Editar</button>}
                {editavel && <button className="fin-btn" style={{ padding: "5px 9px", color: "var(--down)" }} disabled={excluir.isPending} onClick={() => setExcluirAlvo(l)}>Excluir</button>}
              </td>}
            </tr>
          );})}
        </tbody>
      </table>
      {!carregando && !lancamentos.length && <p className="fin-empty">Nenhum título neste filtro.</p>}
      {pagar && <ModalPagar lancamento={pagar} aoFechar={() => setPagar(null)} aoPagar={() => { setPagar(null); aoMudar(); }} />}
      {editar && <ModalEditarLancamento lancamento={editar} aoFechar={() => setEditar(null)} aoSalvar={() => { setEditar(null); aoMudar(); }} />}
      {excluirAlvo && (
        <ModalConfirmar
          titulo="Excluir lançamento"
          mensagem={<>Excluir o lançamento <b>{excluirAlvo.descricao}</b>? Esta ação não pode ser desfeita.</>}
          rotuloConfirmar="Excluir"
          perigo
          carregando={excluir.isPending}
          onConfirmar={() => excluir.mutate(excluirAlvo.id)}
          onFechar={() => setExcluirAlvo(null)}
        />
      )}
    </>
  );
}

function ModalEditarLancamento({ lancamento, aoFechar, aoSalvar }: { lancamento: FinLancamento; aoFechar: () => void; aoSalvar: () => void }) {
  const cadastros = useQuery({ queryKey: ["fin", "cadastros"], queryFn: finCadastros });
  const [descricao, setDescricao] = useState(lancamento.descricao);
  const [valor, setValor] = useState(String(lancamento.valor));
  const [contraparte, setContraparte] = useState(lancamento.contraparte ?? "");
  const [competencia, setCompetencia] = useState(String(lancamento.dataCompetencia).slice(0, 10));
  const [vencimento, setVencimento] = useState(String(lancamento.dataVencimento).slice(0, 10));
  const [conta, setConta] = useState(lancamento.contaBancaria?.id ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const salvar = useMutation({
    mutationFn: () => finAtualizarLancamento(lancamento.id, {
      descricao, valor: Number(valor) || undefined, contraparte, dataCompetencia: competencia, dataVencimento: vencimento, contaBancariaId: conta || undefined,
    }),
    onSuccess: aoSalvar,
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao salvar."),
  });
  return (
    <div className="fin-modal-bg" onClick={aoFechar}>
      <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Editar lançamento</h3>
        <label>Descrição</label>
        <input className="fin-input" value={descricao} onChange={(e) => setDescricao(e.target.value)} autoFocus />
        <div className="row">
          <div><label>Valor (R$)</label><input className="fin-input" type="number" min={0.01} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
          <div><label>Contraparte</label><input className="fin-input" value={contraparte} onChange={(e) => setContraparte(e.target.value)} /></div>
        </div>
        <div className="row">
          <div><label>Competência</label><input className="fin-input" type="date" value={competencia} onChange={(e) => setCompetencia(e.target.value)} /></div>
          <div><label>Vencimento</label><input className="fin-input" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} /></div>
        </div>
        <div><label>Conta bancária</label><select className="fin-select" value={conta} onChange={(e) => setConta(e.target.value)}><option value="">—</option>{(cadastros.data?.contas ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
        {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
        <div className="fim"><button className="fin-btn" onClick={aoFechar}>Cancelar</button><button className="fin-btn ouro" disabled={salvar.isPending || !descricao || !valor} onClick={() => { setErro(null); salvar.mutate(); }}>Salvar</button></div>
      </div>
    </div>
  );
}

function ModalPagar({ lancamento, aoFechar, aoPagar }: { lancamento: FinLancamento; aoFechar: () => void; aoPagar: () => void }) {
  const cadastros = useQuery({ queryKey: ["fin", "cadastros"], queryFn: finCadastros });
  const aberto = restante(lancamento);
  const [valor, setValor] = useState(String(aberto));
  const [forma, setForma] = useState("Pix");
  const [conta, setConta] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const pagar = useMutation({
    mutationFn: () => finPagarLancamento(lancamento.id, { valor: Number(valor) || 0, pagoEm: hoje(), formaPagamento: forma, contaBancariaId: conta || undefined }),
    onSuccess: aoPagar,
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao registrar a baixa."),
  });
  return (
    <div className="fin-modal-bg" onClick={aoFechar}>
      <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Registrar pagamento</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>{lancamento.descricao} · em aberto {brl(aberto)}</p>
        <label>Valor pago (R$)</label>
        <input className="fin-input" type="number" min={0.01} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
        <div className="row">
          <div><label>Forma</label><select className="fin-select" value={forma} onChange={(e) => setForma(e.target.value)}>{["Pix", "Dinheiro", "Cartão de Débito", "Cartão de Crédito", "Boleto", "Transferência"].map((f) => <option key={f}>{f}</option>)}</select></div>
          <div><label>Conta</label><select className="fin-select" value={conta} onChange={(e) => setConta(e.target.value)}><option value="">—</option>{(cadastros.data?.contas ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
        </div>
        {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
        <div className="fim"><button className="fin-btn" onClick={aoFechar}>Cancelar</button><button className="fin-btn ouro" disabled={pagar.isPending} onClick={() => { setErro(null); pagar.mutate(); }}>Confirmar pagamento</button></div>
      </div>
    </div>
  );
}

function ModalLancamento({ operacao, aoFechar, aoCriar }: { operacao: string; aoFechar: () => void; aoCriar: () => void }) {
  const cadastros = useQuery({ queryKey: ["fin", "cadastros"], queryFn: finCadastros });
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [contraparte, setContraparte] = useState("");
  const [competencia, setCompetencia] = useState(hoje());
  const [vencimento, setVencimento] = useState(hoje());
  const [planoContaId, setPlano] = useState("");
  const [centroCustoId, setCentro] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const planos = cadastros.data?.planos ?? [];
  const centros = cadastros.data?.centros ?? [];

  const criar = useMutation({
    mutationFn: () => finCriarLancamento({
      operacao, descricao, valor: Number(valor) || 0, contraparte, dataCompetencia: competencia, dataVencimento: vencimento,
      ...(planoContaId && centroCustoId ? { rateios: [{ planoContaId, centroCustoId, valor: Number(valor) || 0 }] } : {}),
    }),
    onSuccess: aoCriar,
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao criar o lançamento."),
  });

  return (
    <div className="fin-modal-bg" onClick={aoFechar}>
      <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Novo lançamento · {operacao === "receber" ? "a receber" : "a pagar"}</h3>
        <label>Descrição</label>
        <input className="fin-input" value={descricao} onChange={(e) => setDescricao(e.target.value)} autoFocus />
        <div className="row">
          <div><label>Valor (R$)</label><input className="fin-input" type="number" min={0.01} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
          <div><label>{operacao === "receber" ? "De quem recebe" : "A quem paga"}</label><input className="fin-input" value={contraparte} onChange={(e) => setContraparte(e.target.value)} /><small className="fin-help">Nome da pessoa ou empresa.</small></div>
        </div>
        <div className="row">
          <div><label>Competência</label><input className="fin-input" type="date" value={competencia} onChange={(e) => setCompetencia(e.target.value)} /><small className="fin-help">Mês a que o valor se refere.</small></div>
          <div><label>Vencimento</label><input className="fin-input" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} /><small className="fin-help">Data limite para pagar/receber.</small></div>
        </div>
        <div className="row">
          <div><label>Conta contábil (DRE)</label><select className="fin-select" value={planoContaId} onChange={(e) => setPlano(e.target.value)}><option value="">—</option>{planos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}</select><small className="fin-help">Em qual categoria entra no resultado. Opcional.</small></div>
          <div><label>Centro de custo</label><select className="fin-select" value={centroCustoId} onChange={(e) => setCentro(e.target.value)}><option value="">—</option>{centros.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select><small className="fin-help">A qual área/setor pertence. Opcional.</small></div>
        </div>
        {erro && <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{erro}</p>}
        <div className="fim"><button className="fin-btn" onClick={aoFechar}>Cancelar</button><button className="fin-btn ouro" disabled={criar.isPending || !descricao || !valor} onClick={() => { setErro(null); criar.mutate(); }}>Criar lançamento</button></div>
      </div>
    </div>
  );
}
