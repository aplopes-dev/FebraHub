"use client";
import "@/app/pedagogico.css";
import { useCallback, useEffect, useState } from "react";
import { pedagogico, type PedagogicoMatricula, type PedagogicoTurma } from "@/services/api/pedagogico";
import { Select } from "@/components/ui/Select";

export default function PresencaPage() {
  const [turmas, setTurmas] = useState<PedagogicoTurma[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [matriculas, setMatriculas] = useState<PedagogicoMatricula[]>([]);
  const [diaNume, setDiaNume] = useState(1);
  const [sessao, setSessao] = useState("manha");
  const [carregandoTurmas, setCarregandoTurmas] = useState(true);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);
  const [registrando, setRegistrando] = useState<string | null>(null);
  const [marcados, setMarcados] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      setCarregandoTurmas(true);
      try {
        const res = await pedagogico.turmas({ porPagina: 200 });
        setTurmas(res.itens ?? []);
      } catch (e: unknown) {
        setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao carregar turmas." });
      } finally {
        setCarregandoTurmas(false);
      }
    })();
  }, []);

  const carregarAlunos = useCallback(async (id: string) => {
    if (!id) { setMatriculas([]); return; }
    setCarregandoAlunos(true);
    setMarcados({});
    try {
      const res = await pedagogico.turma(id);
      setMatriculas(res.matriculas ?? []);
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao carregar alunos." });
    } finally {
      setCarregandoAlunos(false);
    }
  }, []);

  useEffect(() => { void carregarAlunos(turmaId); }, [turmaId, carregarAlunos]);

  const registrar = async (m: PedagogicoMatricula, status: "presente" | "ausente") => {
    setRegistrando(m.id);
    setFeedback(null);
    try {
      await pedagogico.registrarPresenca({ matriculaId: m.id, diaNume, sessao, status });
      setMarcados((prev) => ({ ...prev, [m.id]: status }));
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao registrar presença." });
    } finally {
      setRegistrando(null);
    }
  };

  const presentes = Object.values(marcados).filter((s) => s === "presente").length;
  const ausentes = Object.values(marcados).filter((s) => s === "ausente").length;

  return (
    <div className="ped-page">
      <div className="ped-page-header">
        <h1>Registro de Presença</h1>
        <p className="ped-page-sub">Selecione a turma, o dia e a sessão, depois marque presença ou ausência de cada aluno.</p>
      </div>

      {feedback && <div className={`ped-feedback ${feedback.tipo}`}>{feedback.msg}</div>}

      <div className="ped-filtros-row">
        <label className="ped-label" style={{ minWidth: 260 }}>
          Turma
          <Select className="ped-select" aria-label="Turma" value={turmaId} onChange={setTurmaId} disabled={carregandoTurmas}
            placeholder={carregandoTurmas ? "Carregando…" : "Selecionar turma…"}
            options={[{ value: "", label: carregandoTurmas ? "Carregando…" : "Selecionar turma…" }, ...turmas.map((t) => ({ value: t.id, label: t.nome }))]} />
        </label>
        <label className="ped-label" style={{ width: 120 }}>
          Dia
          <input type="number" min={1} className="ped-input" value={diaNume} onChange={(e) => setDiaNume(Number(e.target.value) || 1)} />
        </label>
        <label className="ped-label" style={{ width: 160 }}>
          Sessão
          <Select className="ped-select" aria-label="Sessão" value={sessao} onChange={setSessao}
            options={[
              { value: "manha", label: "Manhã" },
              { value: "tarde", label: "Tarde" },
              { value: "noite", label: "Noite" },
              { value: "integral", label: "Integral" },
            ]} />
        </label>
      </div>

      {turmaId && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", fontSize: ".85rem" }}>
          <span className="ped-badge presente">Presentes: {presentes}</span>
          <span className="ped-badge ausente">Ausentes: {ausentes}</span>
          <span className="ped-badge inativo">Total: {matriculas.length}</span>
        </div>
      )}

      {!turmaId ? (
        <div className="ped-empty">Selecione uma turma para registrar presença.</div>
      ) : carregandoAlunos ? (
        <div className="ped-loading"><span className="ped-spinner" />Carregando alunos…</div>
      ) : matriculas.length === 0 ? (
        <div className="ped-empty">Nenhum aluno matriculado nesta turma.</div>
      ) : (
        <div className="ped-tabela-wrapper">
          <table className="ped-tabela">
            <thead>
              <tr><th>Aluno</th><th>CPF</th><th>Status matrícula</th><th style={{ width: 200 }}>Presença</th></tr>
            </thead>
            <tbody>
              {matriculas.map((m) => {
                const marca = marcados[m.id];
                return (
                  <tr key={m.id}>
                    <td><strong>{m.pessoaNome ?? "—"}</strong></td>
                    <td>{m.pessoaCpf ?? "—"}</td>
                    <td><span className="ped-badge inativo">{m.status}</span></td>
                    <td>
                      <div className="ped-acoes-row">
                        <button
                          className={`ped-btn-xs ${marca === "presente" ? "ativo" : ""}`}
                          disabled={registrando === m.id}
                          onClick={() => void registrar(m, "presente")}
                        >
                          ✓ Presente
                        </button>
                        <button
                          className={`ped-btn-xs ${marca === "ausente" ? "perigo" : ""}`}
                          disabled={registrando === m.id}
                          onClick={() => void registrar(m, "ausente")}
                        >
                          ✕ Ausente
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
