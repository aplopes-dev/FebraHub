"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { finCadastros, finCriarCentro, finCriarConta, finCriarPlano } from "@/services/api/financeiro-erp";
import { ErroApi } from "@/services/api/client";

type Aba = "contas" | "centros" | "planos";

/** Gestão dos cadastros base do Financeiro: contas bancárias, centros de custo
 *  e o plano de contas. Sem estes cadastros os selects do lançamento ficam
 *  vazios — esta tela é o que os popula. Só criação/listagem: a API ainda não
 *  expõe editar/excluir (cadastros de sistema não devem sumir). */
export function CadastrosFinanceiro({ aoFechar }: { aoFechar: () => void }) {
  const qc = useQueryClient();
  const [aba, setAba] = useState<Aba>("contas");
  const cadastros = useQuery({ queryKey: ["fin", "cadastros"], queryFn: finCadastros });
  const invalidar = () => qc.invalidateQueries({ queryKey: ["fin"] });
  const c = cadastros.data;

  return (
    <div className="fin-modal-bg" onClick={aoFechar}>
      <div className="fin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <h3>Cadastros do financeiro</h3>
        <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px" }}>
          Estes cadastros alimentam os campos do lançamento. Crie-os aqui uma vez e eles aparecem nas listas de conta, centro de custo e plano de contas.
        </p>

        <div className="fin-tabs" style={{ marginBottom: 14 }}>
          <button className={`fin-tab ${aba === "contas" ? "ativo" : ""}`} onClick={() => setAba("contas")}>Contas bancárias</button>
          <button className={`fin-tab ${aba === "centros" ? "ativo" : ""}`} onClick={() => setAba("centros")}>Centros de custo</button>
          <button className={`fin-tab ${aba === "planos" ? "ativo" : ""}`} onClick={() => setAba("planos")}>Plano de contas</button>
        </div>

        {aba === "contas" && <FormConta contas={c?.contas ?? []} aoCriar={invalidar} />}
        {aba === "centros" && <FormCentro centros={c?.centros ?? []} aoCriar={invalidar} />}
        {aba === "planos" && <FormPlano planos={c?.planos ?? []} grupos={c?.grupos ?? []} aoCriar={invalidar} />}

        <div className="fim"><button className="fin-btn" onClick={aoFechar}>Fechar</button></div>
      </div>
    </div>
  );
}

function Erro({ msg }: { msg: string | null }) {
  return msg ? <p style={{ color: "var(--down)", fontSize: 12, marginTop: 8 }}>{msg}</p> : null;
}

const brl = (n: number | string) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function ListaExistentes({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "4px 0 16px" }}>{children}</div>;
}
function ItemExistente({ nome, extra }: { nome: string; extra?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", border: "1px solid var(--card-line)", borderRadius: 9, fontSize: 13 }}>
      <b style={{ fontWeight: 600 }}>{nome}</b>
      {extra && <span style={{ fontSize: 11, color: "var(--muted)" }}>{extra}</span>}
    </div>
  );
}

function FormConta({ contas, aoCriar }: { contas: { id: string; nome: string; banco: string; saldoInicial: string }[]; aoCriar: () => void }) {
  const [nome, setNome] = useState("");
  const [banco, setBanco] = useState("");
  const [saldoInicial, setSaldo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const criar = useMutation({
    mutationFn: () => finCriarConta({ nome, banco: banco || undefined, saldoInicial: saldoInicial ? Number(saldoInicial) : undefined }),
    onSuccess: () => { setNome(""); setBanco(""); setSaldo(""); aoCriar(); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao criar a conta."),
  });
  return (
    <>
      {contas.length > 0 && <ListaExistentes>{contas.map((c) => <ItemExistente key={c.id} nome={c.nome} extra={[c.banco, Number(c.saldoInicial) ? brl(c.saldoInicial) : ""].filter(Boolean).join(" · ")} />)}</ListaExistentes>}
      <label>Nome da conta</label>
      <input className="fin-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Conta Corrente Itaú" autoFocus />
      <div className="row">
        <div><label>Banco</label><input className="fin-input" value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="Ex.: Itaú" /><small className="fin-help">Opcional.</small></div>
        <div><label>Saldo inicial (R$)</label><input className="fin-input" type="number" step="0.01" value={saldoInicial} onChange={(e) => setSaldo(e.target.value)} placeholder="0,00" /><small className="fin-help">Saldo do dia em que você começou a usar. Opcional.</small></div>
      </div>
      <Erro msg={erro} />
      <div className="fim"><button className="fin-btn ouro" disabled={criar.isPending || !nome.trim()} onClick={() => { setErro(null); criar.mutate(); }}><Plus size={15} /> Adicionar conta</button></div>
    </>
  );
}

function FormCentro({ centros, aoCriar }: { centros: { id: string; nome: string; sistema: boolean }[]; aoCriar: () => void }) {
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const criar = useMutation({
    mutationFn: () => finCriarCentro({ nome }),
    onSuccess: () => { setNome(""); aoCriar(); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao criar o centro de custo."),
  });
  return (
    <>
      {centros.length > 0 && <ListaExistentes>{centros.map((c) => <ItemExistente key={c.id} nome={c.nome} extra={c.sistema ? "do sistema" : undefined} />)}</ListaExistentes>}
      <label>Nome do centro de custo</label>
      <input className="fin-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Marketing, Loja, Administrativo" autoFocus />
      <small className="fin-help">A área ou setor a que o dinheiro pertence. Usado para saber onde cada custo/receita se origina.</small>
      <Erro msg={erro} />
      <div className="fim"><button className="fin-btn ouro" disabled={criar.isPending || !nome.trim()} onClick={() => { setErro(null); criar.mutate(); }}><Plus size={15} /> Adicionar centro</button></div>
    </>
  );
}

function FormPlano({ planos, grupos, aoCriar }: { planos: { id: string; nome: string; grupoId: string; disponivelPdv: boolean }[]; grupos: { id: string; nome: string; tipo: string }[]; aoCriar: () => void }) {
  const [nome, setNome] = useState("");
  const [grupoId, setGrupo] = useState("");
  const [disponivelPdv, setPdv] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const nomeGrupo = (id: string) => grupos.find((g) => g.id === id)?.nome ?? "";
  const criar = useMutation({
    mutationFn: () => finCriarPlano({ nome, grupoId, disponivelPdv }),
    onSuccess: () => { setNome(""); setPdv(false); aoCriar(); },
    onError: (e) => setErro(e instanceof ErroApi ? e.mensagem : "Falha ao criar a conta contábil."),
  });
  return (
    <>
      {planos.length > 0 && <ListaExistentes>{planos.map((p) => <ItemExistente key={p.id} nome={p.nome} extra={[nomeGrupo(p.grupoId), p.disponivelPdv ? "no PDV" : ""].filter(Boolean).join(" · ")} />)}</ListaExistentes>}
      <label>Nome da conta contábil</label>
      <input className="fin-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Vendas de produtos, Aluguel, Energia" autoFocus />
      <small className="fin-help">A categoria em que o valor entra no resultado (DRE).</small>
      <div style={{ marginTop: 4 }}>
        <label>Grupo</label>
        <select className="fin-select" value={grupoId} onChange={(e) => setGrupo(e.target.value)}>
          <option value="">Selecione o grupo…</option>
          {grupos.map((g) => <option key={g.id} value={g.id}>{g.nome}{g.tipo ? ` (${g.tipo})` : ""}</option>)}
        </select>
        <small className="fin-help">Em qual bloco do DRE esta conta se agrupa (receitas, custos, despesas…).</small>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
        <input type="checkbox" checked={disponivelPdv} onChange={(e) => setPdv(e.target.checked)} />
        Disponível para uso no PDV
      </label>
      <Erro msg={erro} />
      {!grupos.length && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Nenhum grupo cadastrado ainda. Os grupos do DRE são criados na configuração inicial do financeiro.</p>}
      <div className="fim"><button className="fin-btn ouro" disabled={criar.isPending || !nome.trim() || !grupoId} onClick={() => { setErro(null); criar.mutate(); }}><Plus size={15} /> Adicionar conta contábil</button></div>
    </>
  );
}
