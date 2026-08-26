"use client";
import "@/app/pedagogico.css";
import { useCallback, useEffect, useState } from "react";
import { pedagogico, type PedagogicoMatricula } from "@/services/api/pedagogico";

const fmtData = (s?: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");

type Solicitacao = {
  id: string;
  tipo: string;
  status: string;
  prioridade: string;
  descricao?: string | null;
  resposta?: string | null;
  pessoaId: string;
  prazo?: string | null;
  criadoEm?: string | null;
  matricula?: { id: string; pessoaNome?: string | null; cursoNome?: string | null } | null;
};

const TIPOS = ["certificado", "transferencia", "segunda_via", "suporte", "reembolso", "outro"];
const STATUS = ["aberta", "em_analise", "concluida", "cancelada"];

export default function SolicitacoesPage() {
  const [lista, setLista] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nova, setNova] = useState({ tipo: "certificado", pessoaId: "", matriculaId: "", descricao: "", prioridade: "normal" });
  const [salvando, setSalvando] = useState(false);

  // Seletor de aluno (substitui o antigo campo "ID da pessoa" que exigia colar UUID)
  const [alunoBusca, setAlunoBusca] = useState("");
  const [alunoResultados, setAlunoResultados] = useState<PedagogicoMatricula[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<PedagogicoMatricula | null>(null);
  const [buscandoAluno, setBuscandoAluno] = useState(false);

  useEffect(() => {
    const q = alunoBusca.trim();
    if (alunoSelecionado || q.length < 2) { setAlunoResultados([]); return; }
    let cancelado = false;
    setBuscandoAluno(true);
    const t = setTimeout(async () => {
      try {
        const res = await pedagogico.matriculas({ busca: q, porPagina: 8 });
        if (!cancelado) setAlunoResultados(res?.itens ?? []);
      } catch {
        if (!cancelado) setAlunoResultados([]);
      } finally {
        if (!cancelado) setBuscandoAluno(false);
      }
    }, 300);
    return () => { cancelado = true; clearTimeout(t); };
  }, [alunoBusca, alunoSelecionado]);

  const escolherAluno = (m: PedagogicoMatricula) => {
    setAlunoSelecionado(m);
    setNova((n) => ({ ...n, pessoaId: m.pessoaId, matriculaId: m.id }));
    setAlunoBusca("");
    setAlunoResultados([]);
  };
  const limparAluno = () => {
    setAlunoSelecionado(null);
    setNova((n) => ({ ...n, pessoaId: "", matriculaId: "" }));
  };

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const q: Record<string, string> = {};
      if (filtroStatus) q.status = filtroStatus;
      if (filtroTipo) q.tipo = filtroTipo;
      const res = (await pedagogico.solicitacoes(Object.keys(q).length ? q : undefined)) as Solicitacao[];
      setLista(res ?? []);
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao carregar solicitações." });
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus, filtroTipo]);

  useEffect(() => { void carregar(); }, [carregar]);

  const criar = async () => {
    if (!nova.pessoaId.trim()) {
      setFeedback({ tipo: "erro", msg: "Selecione o aluno da solicitação." });
      return;
    }
    setSalvando(true);
    setFeedback(null);
    try {
      await pedagogico.criarSolicitacao({
        tipo: nova.tipo,
        pessoaId: nova.pessoaId.trim(),
        matriculaId: nova.matriculaId.trim() || undefined,
        descricao: nova.descricao.trim() || undefined,
        prioridade: nova.prioridade,
      });
      setFeedback({ tipo: "ok", msg: "Solicitação aberta." });
      setNova({ tipo: "certificado", pessoaId: "", matriculaId: "", descricao: "", prioridade: "normal" });
      setAlunoSelecionado(null);
      setAlunoBusca("");
      setMostrarForm(false);
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao abrir solicitação." });
    } finally {
      setSalvando(false);
    }
  };

  const mudarStatus = async (s: Solicitacao, status: string) => {
    let resposta: string | undefined;
    if (status === "concluida") {
      resposta = prompt("Resposta / resolução (opcional):") ?? undefined;
    }
    try {
      await pedagogico.atualizarSolicitacao(s.id, status, resposta);
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao atualizar solicitação." });
    }
  };

  const excluir = async (s: Solicitacao) => {
    if (!confirm(`Excluir definitivamente a solicitação (${s.tipo}) de ${s.matricula?.pessoaNome ?? s.pessoaId}?`)) return;
    try {
      await pedagogico.removerSolicitacao(s.id);
      setFeedback({ tipo: "ok", msg: "Solicitação excluída." });
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao excluir solicitação." });
    }
  };

  const abertas = lista.filter((s) => ["aberta", "em_analise"].includes(s.status)).length;

  return (
    <div className="ped-page">
      <div className="ped-page-topo">
        <div className="ped-page-header" style={{ marginBottom: 0 }}>
          <h1>Solicitações</h1>
          <p className="ped-page-sub">Secretaria: certificados, transferências, segundas-vias e suporte ao aluno.</p>
        </div>
        <button className="ped-btn-primario" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Fechar" : "+ Nova solicitação"}
        </button>
      </div>

      {abertas > 0 && (
        <div className="ped-atencao-box">{abertas} solicitação(ões) em aberto aguardando atendimento.</div>
      )}

      {feedback && <div className={`ped-feedback ${feedback.tipo}`}>{feedback.msg}</div>}

      {mostrarForm && (
        <div className="ped-form-card" style={{ marginBottom: "1.25rem" }}>
          <div className="ped-form-grid">
            <label className="ped-label">
              Tipo
              <select className="ped-select" value={nova.tipo} onChange={(e) => setNova({ ...nova, tipo: e.target.value })}>
                {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="ped-label">
              Prioridade
              <select className="ped-select" value={nova.prioridade} onChange={(e) => setNova({ ...nova, prioridade: e.target.value })}>
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </label>
            <label className="ped-label ped-full">
              Aluno*
              {alunoSelecionado ? (
                <div className="ped-aluno-selecionado">
                  <div>
                    <strong>{alunoSelecionado.pessoaNome ?? "Aluno"}</strong>
                    <span>
                      {[alunoSelecionado.cursoNome, alunoSelecionado.pessoaCpf].filter(Boolean).join(" · ") || "Matrícula selecionada"}
                    </span>
                  </div>
                  <button type="button" className="ped-btn-xs" onClick={limparAluno}>Trocar</button>
                </div>
              ) : (
                <div className="ped-aluno-picker">
                  <input
                    className="ped-input"
                    value={alunoBusca}
                    onChange={(e) => setAlunoBusca(e.target.value)}
                    placeholder="Buscar aluno por nome ou CPF…"
                    autoComplete="off"
                  />
                  {alunoBusca.trim().length >= 2 && (
                    <div className="ped-aluno-lista">
                      {buscandoAluno && <div className="ped-aluno-vazio">Buscando…</div>}
                      {!buscandoAluno && alunoResultados.length === 0 && (
                        <div className="ped-aluno-vazio">Nenhum aluno encontrado.</div>
                      )}
                      {alunoResultados.map((m) => (
                        <button
                          type="button"
                          key={m.id}
                          className="ped-aluno-opcao"
                          onClick={() => escolherAluno(m)}
                        >
                          <strong>{m.pessoaNome ?? "—"}</strong>
                          <span>{[m.cursoNome, m.pessoaCpf].filter(Boolean).join(" · ") || m.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </label>
            <label className="ped-label ped-full">
              Descrição
              <textarea className="ped-textarea" value={nova.descricao} onChange={(e) => setNova({ ...nova, descricao: e.target.value })} />
            </label>
          </div>
          <div className="ped-form-acoes">
            <button className="ped-btn-primario" disabled={salvando} onClick={() => void criar()}>
              {salvando ? "Salvando…" : "Abrir solicitação"}
            </button>
            <button className="ped-btn-outline" onClick={() => setMostrarForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="ped-filtros-row">
        <select className="ped-select" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="ped-select" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="ped-total-label">{lista.length} solicitação(ões)</span>
      </div>

      {carregando ? (
        <div className="ped-loading"><span className="ped-spinner" />Carregando solicitações…</div>
      ) : lista.length === 0 ? (
        <div className="ped-empty">Nenhuma solicitação encontrada.</div>
      ) : (
        <div className="ped-tabela-wrapper">
          <table className="ped-tabela">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Tipo</th>
                <th>Prioridade</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Aberta em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((s) => (
                <tr key={s.id} className={["aberta", "em_analise"].includes(s.status) ? "ped-row-atencao" : ""}>
                  <td><strong>{s.matricula?.pessoaNome ?? s.pessoaId}</strong>{s.matricula?.cursoNome && <div style={{ fontSize: ".75rem", color: "var(--muted-foreground)" }}>{s.matricula.cursoNome}</div>}</td>
                  <td>{s.tipo}</td>
                  <td><span className={`ped-badge ${s.prioridade}`}>{s.prioridade}</span></td>
                  <td style={{ maxWidth: 280 }}>{s.descricao ?? "—"}</td>
                  <td><span className={`ped-badge ${s.status}`}>{s.status}</span></td>
                  <td>{fmtData(s.criadoEm)}</td>
                  <td>
                    <div className="ped-acoes-row">
                      {s.status === "aberta" && (
                        <button className="ped-btn-xs" onClick={() => void mudarStatus(s, "em_analise")}>Em análise</button>
                      )}
                      {["aberta", "em_analise"].includes(s.status) && (
                        <>
                          <button className="ped-btn-xs ativo" onClick={() => void mudarStatus(s, "concluida")}>Concluir</button>
                          <button className="ped-btn-xs perigo" onClick={() => void mudarStatus(s, "cancelada")}>Cancelar</button>
                        </>
                      )}
                      <button className="ped-btn-xs perigo" onClick={() => void excluir(s)}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
