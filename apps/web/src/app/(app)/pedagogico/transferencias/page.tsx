"use client";
import "@/app/pedagogico.css";
import { useCallback, useEffect, useState } from "react";
import { pedagogico, type PedagogicoMatricula, type PedagogicoTurma } from "@/services/api/pedagogico";

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

  const cancelar = async (m: PedagogicoMatricula) => {
    if (!confirm(`Cancelar a solicitação de transferência de ${m.pessoaNome ?? "aluno"}?`)) return;
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
      <div className="ped-page-header">
        <h1>Transferências</h1>
        <p className="ped-page-sub">
          Solicitações de transferência de turma pendentes. Escolha a turma de destino e efetive, ou cancele.
        </p>
      </div>

      {feedback && <div className={`ped-feedback ${feedback.tipo}`}>{feedback.msg}</div>}

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
                    <select
                      className="ped-select"
                      value={destinoPorAluno[m.id] ?? ""}
                      onChange={(e) => setDestinoPorAluno((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    >
                      <option value="">Selecionar turma…</option>
                      {turmas
                        .filter((t) => t.id !== m.turma?.id)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nome} {t.dataInicio ? `— ${fmtData(t.dataInicio)}` : ""}
                          </option>
                        ))}
                    </select>
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
                        onClick={() => void cancelar(m)}
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
    </div>
  );
}
