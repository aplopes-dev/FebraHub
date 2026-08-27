"use client";
import "@/app/pedagogico.css";
import { useCallback, useEffect, useState } from "react";
import { pedagogico, type PedagogicoMatricula, type PedagogicoTurma } from "@/services/api/pedagogico";
import { ModalConfirmar } from "@/components/ui/ModalConfirmar";
import { Select } from "@/components/ui/Select";

const fmtData = (s?: string | null) => (s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—");

type JornadaTransf = {
  id: string;
  status: string;
  turmaDestino?: { id: string; nome: string } | null;
};

export default function TransferenciasPage() {
  const [matriculas, setMatriculas] = useState<PedagogicoMatricula[]>([]);
  const [turmas, setTurmas] = useState<PedagogicoTurma[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [destinoPorAluno, setDestinoPorAluno] = useState<Record<string, string>>({});

  // solicitar nova transferência
  const [mostrarSolicitar, setMostrarSolicitar] = useState(false);
  const [buscaAluno, setBuscaAluno] = useState("");
  const [candidatos, setCandidatos] = useState<PedagogicoMatricula[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [selecionada, setSelecionada] = useState<PedagogicoMatricula | null>(null);
  const [destinoNovo, setDestinoNovo] = useState("");
  const [motivoNovo, setMotivoNovo] = useState("");
  const [solicitando, setSolicitando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [solicitadas, tur] = await Promise.all([
        pedagogico.matriculas({ status: "Transferência Solicitada", porPagina: 100 }),
        pedagogico.turmas({ status: "Confirmada", porPagina: 200 }),
      ]);
      setMatriculas(solicitadas.itens ?? []);
      setTurmas(tur.itens ?? []);
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao carregar transferências." });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  // Busca a transferência pendente do aluno via jornada
  async function acharTransferenciaPendente(pessoaId: string): Promise<JornadaTransf | null> {
    const jornada = await pedagogico.jornada(pessoaId) as {
      matriculas?: Array<{ transferencias?: JornadaTransf[] }>;
    };
    for (const m of jornada.matriculas ?? []) {
      const pend = (m.transferencias ?? []).find((t) => ["solicitada", "aprovada"].includes(t.status));
      if (pend) return pend;
    }
    return null;
  }

  const buscarAluno = async () => {
    if (buscaAluno.trim().length < 2) return;
    setBuscando(true);
    setFeedback(null);
    try {
      const res = await pedagogico.matriculas({ busca: buscaAluno.trim(), porPagina: 20 });
      // só matrículas ativas (com turma) que podem ser transferidas
      setCandidatos((res.itens ?? []).filter((m) => !["Cancelado", "Concluído", "Transferido"].includes(m.status)));
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro na busca." });
    } finally {
      setBuscando(false);
    }
  };

  const solicitar = async () => {
    if (!selecionada) return;
    if (!selecionada.turma?.id) {
      setFeedback({ tipo: "erro", msg: "Esta matrícula não tem turma de origem definida." });
      return;
    }
    setSolicitando(true);
    setFeedback(null);
    try {
      await pedagogico.solicitarTransferencia({
        matriculaId: selecionada.id,
        turmaOrigemId: selecionada.turma.id,
        turmaDestinoId: destinoNovo || undefined,
        motivo: motivoNovo.trim() || undefined,
      });
      setFeedback({ tipo: "ok", msg: `Transferência solicitada para ${selecionada.pessoaNome ?? "aluno"}.` });
      setMostrarSolicitar(false);
      setSelecionada(null);
      setCandidatos([]);
      setBuscaAluno("");
      setDestinoNovo("");
      setMotivoNovo("");
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao solicitar transferência." });
    } finally {
      setSolicitando(false);
    }
  };

  const efetivar = async (m: PedagogicoMatricula) => {
    const turmaDestinoId = destinoPorAluno[m.id];
    if (!turmaDestinoId) {
      setFeedback({ tipo: "erro", msg: "Selecione a turma de destino antes de efetivar." });
      return;
    }
    setProcessando(m.id);
    setFeedback(null);
    try {
      const transf = await acharTransferenciaPendente(m.pessoaId);
      if (!transf) {
        setFeedback({ tipo: "erro", msg: "Nenhuma solicitação de transferência pendente encontrada para este aluno." });
        return;
      }
      await pedagogico.efetivarTransferencia(transf.id, { turmaDestinoId });
      setFeedback({ tipo: "ok", msg: `Transferência de ${m.pessoaNome ?? "aluno"} efetivada.` });
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao efetivar transferência." });
    } finally {
      setProcessando(null);
    }
  };

  const [cancelandoTransf, setCancelandoTransf] = useState<PedagogicoMatricula | null>(null);
  const cancelar = async (m: PedagogicoMatricula) => {
    setCancelandoTransf(null);
    setProcessando(m.id);
    setFeedback(null);
    try {
      const transf = await acharTransferenciaPendente(m.pessoaId);
      if (!transf) {
        setFeedback({ tipo: "erro", msg: "Nenhuma solicitação pendente encontrada." });
        return;
      }
      await pedagogico.cancelarTransferencia(transf.id);
      setFeedback({ tipo: "ok", msg: `Transferência de ${m.pessoaNome ?? "aluno"} cancelada.` });
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao cancelar transferência." });
    } finally {
      setProcessando(null);
    }
  };

  return (
    <div className="ped-page">
      <div className="ped-page-topo">
        <div className="ped-page-header" style={{ marginBottom: 0 }}>
          <h1>Transferências</h1>
          <p className="ped-page-sub">
            Solicite uma transferência ou trate as pendentes: escolha a turma de destino e efetive, ou cancele.
          </p>
        </div>
        <button className="ped-btn-primario" onClick={() => setMostrarSolicitar((v) => !v)}>
          {mostrarSolicitar ? "Fechar" : "+ Solicitar transferência"}
        </button>
      </div>

      {feedback && <div className={`ped-feedback ${feedback.tipo}`}>{feedback.msg}</div>}

      {mostrarSolicitar && (
        <div className="ped-form-card" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ marginTop: 0 }}>Solicitar transferência</h3>
          <div className="ped-filtros-row">
            <input
              className="ped-input"
              placeholder="Buscar aluno por nome ou CPF…"
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void buscarAluno(); }}
            />
            <button className="ped-btn-outline" disabled={buscando || buscaAluno.trim().length < 2} onClick={() => void buscarAluno()}>
              {buscando ? "Buscando…" : "Buscar"}
            </button>
          </div>

          {candidatos.length > 0 && !selecionada && (
            <div className="ped-tabela-wrapper" style={{ marginBottom: "1rem" }}>
              <table className="ped-tabela">
                <thead><tr><th>Aluno</th><th>Curso</th><th>Turma atual</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {candidatos.map((m) => (
                    <tr key={m.id}>
                      <td><strong>{m.pessoaNome ?? "—"}</strong></td>
                      <td>{m.cursoNome ?? m.turma?.cursoNome ?? "—"}</td>
                      <td>{m.turma?.nome ?? "—"}</td>
                      <td><span className="ped-badge inativo">{m.status}</span></td>
                      <td><button className="ped-btn-xs ativo" disabled={!m.turma?.id} onClick={() => setSelecionada(m)}>Selecionar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selecionada && (
            <div>
              <div className="ped-atencao-box" style={{ background: "#eef2ff", borderColor: "#c7d2fe", color: "#3730a3" }}>
                Aluno: <strong>{selecionada.pessoaNome}</strong> · Turma de origem: <strong>{selecionada.turma?.nome ?? "—"}</strong>
                <button className="ped-btn-xs" style={{ marginLeft: ".75rem" }} onClick={() => setSelecionada(null)}>trocar aluno</button>
              </div>
              <div className="ped-form-grid">
                <label className="ped-label">
                  Turma de destino (opcional)
                  <Select className="ped-select" aria-label="Turma de destino" value={destinoNovo} onChange={setDestinoNovo}
                    options={[{ value: "", label: "Definir depois…" }, ...turmas.filter((t) => t.id !== selecionada.turma?.id).map((t) => ({ value: t.id, label: `${t.nome}${t.dataInicio ? ` — ${fmtData(t.dataInicio)}` : ""}` }))]} />
                </label>
                <label className="ped-label ped-full">
                  Motivo
                  <textarea className="ped-textarea" value={motivoNovo} onChange={(e) => setMotivoNovo(e.target.value)} />
                </label>
              </div>
              <div className="ped-form-acoes">
                <button className="ped-btn-primario" disabled={solicitando} onClick={() => void solicitar()}>
                  {solicitando ? "Solicitando…" : "✓ Solicitar transferência"}
                </button>
                <button className="ped-btn-outline" onClick={() => setMostrarSolicitar(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="ped-filtros-row">
        <button className="ped-btn-outline" onClick={() => void carregar()}>Atualizar</button>
        <span className="ped-total-label">{matriculas.length} pendente(s)</span>
      </div>

      {carregando ? (
        <div className="ped-loading"><span className="ped-spinner" />Carregando transferências…</div>
      ) : matriculas.length === 0 ? (
        <div className="ped-empty">Nenhuma transferência pendente.</div>
      ) : (
        <div className="ped-tabela-wrapper">
          <table className="ped-tabela">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Curso</th>
                <th>Turma atual</th>
                <th>Status</th>
                <th>Turma de destino</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {matriculas.map((m) => (
                <tr key={m.id} className="ped-row-atencao">
                  <td>
                    <strong>{m.pessoaNome ?? "—"}</strong>
                    {m.pessoaCpf && <div style={{ fontSize: ".75rem", color: "var(--muted-foreground)" }}>{m.pessoaCpf}</div>}
                  </td>
                  <td>{m.cursoNome ?? m.turma?.cursoNome ?? "—"}</td>
                  <td>{m.turma?.nome ?? "A definir"}</td>
                  <td><span className="ped-badge solicitada">{m.status}</span></td>
                  <td>
                    <Select
                      className="ped-select"
                      aria-label="Selecionar turma de destino"
                      value={destinoPorAluno[m.id] ?? ""}
                      onChange={(v) => setDestinoPorAluno((prev) => ({ ...prev, [m.id]: v }))}
                      options={[{ value: "", label: "Selecionar turma…" }, ...turmas.filter((t) => t.id !== m.turma?.id).map((t) => ({ value: t.id, label: `${t.nome}${t.dataInicio ? ` — ${fmtData(t.dataInicio)}` : ""}` }))]}
                    />
                  </td>
                  <td>
                    <div className="ped-acoes-row">
                      <button
                        className="ped-btn-xs ativo"
                        disabled={processando === m.id || !destinoPorAluno[m.id]}
                        onClick={() => void efetivar(m)}
                      >
                        {processando === m.id ? "…" : "Efetivar"}
                      </button>
                      <button
                        className="ped-btn-xs perigo"
                        disabled={processando === m.id}
                        onClick={() => setCancelandoTransf(m)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cancelandoTransf && (
        <ModalConfirmar
          titulo="Cancelar transferência"
          mensagem={<>Cancelar a solicitação de transferência de <b>{cancelandoTransf.pessoaNome ?? "aluno"}</b>?</>}
          rotuloConfirmar="Cancelar transferência"
          perigo
          carregando={processando === cancelandoTransf.id}
          onConfirmar={() => void cancelar(cancelandoTransf)}
          onFechar={() => setCancelandoTransf(null)}
        />
      )}
    </div>
  );
}
