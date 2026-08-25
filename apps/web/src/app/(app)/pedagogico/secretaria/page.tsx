"use client";
import "@/app/pedagogico.css";
import { useCallback, useState } from "react";
import { pedagogico, type PedagogicoMatricula } from "@/services/api/pedagogico";

const fmtData = (s?: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");
const fmtDataHora = (s?: string | null) => (s ? new Date(s).toLocaleString("pt-BR") : "—");

type Historico = { id: string; tipo: string; descricao?: string | null; statusDe?: string | null; statusPara?: string | null; criadoEm?: string | null };
type Transferencia = { id: string; status: string; motivo?: string | null; criadoEm?: string | null; turmaOrigem?: { nome: string } | null; turmaDestino?: { nome: string } | null };
type Solicitacao = { id: string; tipo: string; status: string; criadoEm?: string | null };
type Presenca = { diaNume: number; sessao: string; status: string };
type MatriculaJornada = {
  id: string;
  status: string;
  cursoNome?: string | null;
  pessoaNome?: string | null;
  pessoaCpf?: string | null;
  pessoaTelefone?: string | null;
  pessoaEmail?: string | null;
  dataCompra?: string | null;
  validadeFim?: string | null;
  turma?: { id: string; nome: string; cursoNome?: string | null; dataInicio?: string | null; status?: string } | null;
  historico?: Historico[];
  transferencias?: Transferencia[];
  solicitacoes?: Solicitacao[];
  presencas?: Presenca[];
  credenciamento?: { criadoEm?: string | null } | null;
};
type Jornada = { pessoaId: string; total: number; matriculas: MatriculaJornada[] };

export default function SecretariaPage() {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<PedagogicoMatricula[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [carregandoJornada, setCarregandoJornada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    if (busca.trim().length < 2) return;
    setBuscando(true);
    setErro(null);
    setJornada(null);
    try {
      const res = await pedagogico.matriculas({ busca: busca.trim(), porPagina: 30 });
      // Deduplicar por pessoaId
      const vistos = new Set<string>();
      const unicos = (res.itens ?? []).filter((m) => {
        if (vistos.has(m.pessoaId)) return false;
        vistos.add(m.pessoaId);
        return true;
      });
      setResultados(unicos);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro na busca.");
    } finally {
      setBuscando(false);
    }
  }, [busca]);

  const abrirJornada = async (pessoaId: string) => {
    setCarregandoJornada(true);
    setErro(null);
    try {
      const res = (await pedagogico.jornada(pessoaId)) as Jornada;
      setJornada(res);
      setResultados([]);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar jornada.");
    } finally {
      setCarregandoJornada(false);
    }
  };

  const aluno = jornada?.matriculas[0];

  return (
    <div className="ped-page">
      <div className="ped-page-header">
        <h1>Secretaria Digital do Aluno</h1>
        <p className="ped-page-sub">Busque um aluno e veja a jornada completa: matrículas, presenças, transferências e solicitações.</p>
      </div>

      <div className="ped-filtros-row">
        <input
          className="ped-input"
          placeholder="Buscar por nome, CPF, telefone ou e-mail…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void buscar(); }}
        />
        <button className="ped-btn-primario" disabled={buscando || busca.trim().length < 2} onClick={() => void buscar()}>
          {buscando ? "Buscando…" : "Buscar"}
        </button>
        {jornada && <button className="ped-btn-outline" onClick={() => { setJornada(null); setBusca(""); }}>Nova busca</button>}
      </div>

      {erro && <div className="ped-erro">{erro}</div>}

      {/* Resultados de busca */}
      {resultados.length > 0 && !jornada && (
        <div className="ped-tabela-wrapper">
          <table className="ped-tabela">
            <thead>
              <tr><th>Aluno</th><th>CPF</th><th>Telefone</th><th>Curso</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {resultados.map((m) => (
                <tr key={m.pessoaId}>
                  <td><strong>{m.pessoaNome ?? "—"}</strong></td>
                  <td>{m.pessoaCpf ?? "—"}</td>
                  <td>{m.pessoaTelefone ?? "—"}</td>
                  <td>{m.cursoNome ?? m.turma?.cursoNome ?? "—"}</td>
                  <td><span className="ped-badge inativo">{m.status}</span></td>
                  <td><button className="ped-btn-xs ativo" onClick={() => void abrirJornada(m.pessoaId)}>Abrir jornada →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {carregandoJornada && <div className="ped-loading"><span className="ped-spinner" />Carregando jornada…</div>}

      {/* Jornada 360° */}
      {jornada && aluno && (
        <div>
          <div className="ped-card-info" style={{ marginBottom: "1.25rem" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{aluno.pessoaNome ?? "Aluno"}</div>
            <div style={{ fontSize: ".85rem", color: "var(--muted-foreground)", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {aluno.pessoaCpf && <span>CPF: {aluno.pessoaCpf}</span>}
              {aluno.pessoaTelefone && <span>📱 {aluno.pessoaTelefone}</span>}
              {aluno.pessoaEmail && <span>✉ {aluno.pessoaEmail}</span>}
              <span>{jornada.total} matrícula(s)</span>
            </div>
          </div>

          {jornada.matriculas.map((m) => (
            <div key={m.id} className="ped-form-card" style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: ".5rem" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{m.cursoNome ?? m.turma?.cursoNome ?? "Curso"}</div>
                  <div style={{ fontSize: ".82rem", color: "var(--muted-foreground)" }}>
                    Turma: {m.turma?.nome ?? "A definir"}
                    {m.turma?.dataInicio ? ` — início ${fmtData(m.turma.dataInicio)}` : ""}
                  </div>
                  <div style={{ fontSize: ".82rem", color: "var(--muted-foreground)" }}>
                    Compra: {fmtData(m.dataCompra)} · Validade: {fmtData(m.validadeFim)}
                    {m.credenciamento ? " · Credenciado ✓" : ""}
                  </div>
                </div>
                <span className="ped-badge inativo">{m.status}</span>
              </div>

              {/* Presenças */}
              {(m.presencas ?? []).length > 0 && (
                <div style={{ marginTop: ".75rem" }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: ".35rem" }}>PRESENÇAS</div>
                  <div style={{ display: "flex", gap: ".35rem", flexWrap: "wrap" }}>
                    {(m.presencas ?? []).map((p, i) => (
                      <span key={i} className={`ped-badge ${p.status === "presente" ? "presente" : "ausente"}`}>
                        Dia {p.diaNume}/{p.sessao}: {p.status}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transferências */}
              {(m.transferencias ?? []).length > 0 && (
                <div style={{ marginTop: ".75rem" }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: ".35rem" }}>TRANSFERÊNCIAS</div>
                  {(m.transferencias ?? []).map((t) => (
                    <div key={t.id} style={{ fontSize: ".82rem" }}>
                      {t.turmaOrigem?.nome ?? "—"} → {t.turmaDestino?.nome ?? "?"} <span className={`ped-badge ${t.status}`}>{t.status}</span> {fmtData(t.criadoEm)}
                    </div>
                  ))}
                </div>
              )}

              {/* Solicitações */}
              {(m.solicitacoes ?? []).length > 0 && (
                <div style={{ marginTop: ".75rem" }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: ".35rem" }}>SOLICITAÇÕES</div>
                  {(m.solicitacoes ?? []).map((s) => (
                    <div key={s.id} style={{ fontSize: ".82rem" }}>
                      {s.tipo} <span className={`ped-badge ${s.status}`}>{s.status}</span> {fmtData(s.criadoEm)}
                    </div>
                  ))}
                </div>
              )}

              {/* Timeline */}
              {(m.historico ?? []).length > 0 && (
                <div style={{ marginTop: ".75rem" }}>
                  <div style={{ fontSize: ".78rem", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: ".5rem" }}>HISTÓRICO</div>
                  <div className="ped-timeline">
                    {(m.historico ?? []).map((h) => (
                      <div key={h.id} className="ped-timeline-item">
                        <span className="ped-timeline-dot" />
                        <div className="ped-timeline-corpo">
                          <div className="ped-tl-data">{fmtDataHora(h.criadoEm)}</div>
                          <div className="ped-tl-conteudo">
                            {h.descricao ?? h.tipo}
                            {h.statusDe && h.statusPara && (
                              <span style={{ color: "var(--muted-foreground)" }}> · {h.statusDe} → {h.statusPara}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
