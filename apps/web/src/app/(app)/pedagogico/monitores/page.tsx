"use client";
import "@/app/pedagogico.css";
import { useCallback, useEffect, useState } from "react";
import { pedagogico, type PedagogicoTurma } from "@/services/api/pedagogico";

const fmtData = (s?: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");

type Escala = {
  id: string;
  funcao?: string | null;
  kitEntregue?: boolean;
  turma?: { id: string; nome: string; dataInicio?: string | null; status?: string } | null;
};

type Monitor = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  status: string;
  cursosHabilitados: string[];
  escalas?: Escala[];
};

export default function MonitoresPage() {
  const [monitores, setMonitores] = useState<Monitor[]>([]);
  const [turmas, setTurmas] = useState<PedagogicoTurma[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);

  // form novo monitor
  const [mostrarForm, setMostrarForm] = useState(false);
  const [novo, setNovo] = useState({ nome: "", pessoaId: "", email: "", telefone: "" });
  const [salvando, setSalvando] = useState(false);

  // escala
  const [escalaAlvo, setEscalaAlvo] = useState<Monitor | null>(null);
  const [turmaEscala, setTurmaEscala] = useState("");
  const [funcaoEscala, setFuncaoEscala] = useState("monitor");
  const [escalando, setEscalando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [mon, tur] = await Promise.all([
        pedagogico.monitores(busca ? { busca } : undefined) as Promise<Monitor[]>,
        pedagogico.turmas({ status: "Confirmada", porPagina: 200 }),
      ]);
      setMonitores(mon ?? []);
      setTurmas(tur.itens ?? []);
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao carregar monitores." });
    } finally {
      setCarregando(false);
    }
  }, [busca]);

  useEffect(() => { void carregar(); }, [carregar]);

  const criar = async () => {
    if (!novo.nome.trim() || !novo.pessoaId.trim()) {
      setFeedback({ tipo: "erro", msg: "Nome e ID da pessoa são obrigatórios." });
      return;
    }
    setSalvando(true);
    setFeedback(null);
    try {
      await pedagogico.criarMonitor({
        nome: novo.nome.trim(),
        pessoaId: novo.pessoaId.trim(),
        email: novo.email.trim() || undefined,
        telefone: novo.telefone.trim() || undefined,
      });
      setFeedback({ tipo: "ok", msg: "Monitor cadastrado." });
      setNovo({ nome: "", pessoaId: "", email: "", telefone: "" });
      setMostrarForm(false);
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao cadastrar monitor." });
    } finally {
      setSalvando(false);
    }
  };

  const escalar = async () => {
    if (!escalaAlvo || !turmaEscala) return;
    setEscalando(true);
    setFeedback(null);
    try {
      await pedagogico.escalarMonitor({ monitorId: escalaAlvo.id, turmaId: turmaEscala, funcao: funcaoEscala });
      setFeedback({ tipo: "ok", msg: `${escalaAlvo.nome} escalado na turma.` });
      setEscalaAlvo(null);
      setTurmaEscala("");
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao escalar monitor." });
    } finally {
      setEscalando(false);
    }
  };

  const marcarKit = async (escalaId: string) => {
    try {
      await pedagogico.marcarKitEntregue(escalaId);
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao marcar kit." });
    }
  };

  const removerEscala = async (escalaId: string) => {
    if (!confirm("Remover esta escala do monitor?")) return;
    try {
      await pedagogico.removerEscala(escalaId);
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao remover escala." });
    }
  };

  const inativar = async (m: Monitor) => {
    if (!confirm(`Inativar o monitor ${m.nome}?`)) return;
    try {
      await pedagogico.removerMonitor(m.id);
      setFeedback({ tipo: "ok", msg: `${m.nome} inativado.` });
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao inativar monitor." });
    }
  };

  return (
    <div className="ped-page">
      <div className="ped-page-topo">
        <div className="ped-page-header" style={{ marginBottom: 0 }}>
          <h1>Monitores</h1>
          <p className="ped-page-sub">Cadastro de monitores e escalas por turma.</p>
        </div>
        <button className="ped-btn-primario" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Fechar" : "+ Novo monitor"}
        </button>
      </div>

      {feedback && <div className={`ped-feedback ${feedback.tipo}`}>{feedback.msg}</div>}

      {mostrarForm && (
        <div className="ped-form-card" style={{ marginBottom: "1.25rem" }}>
          <div className="ped-form-grid">
            <label className="ped-label">
              Nome*
              <input className="ped-input" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
            </label>
            <label className="ped-label">
              ID da pessoa*
              <input className="ped-input" value={novo.pessoaId} onChange={(e) => setNovo({ ...novo, pessoaId: e.target.value })} />
            </label>
            <label className="ped-label">
              E-mail
              <input className="ped-input" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
            </label>
            <label className="ped-label">
              Telefone
              <input className="ped-input" value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} />
            </label>
          </div>
          <div className="ped-form-acoes">
            <button className="ped-btn-primario" disabled={salvando} onClick={() => void criar()}>
              {salvando ? "Salvando…" : "Cadastrar"}
            </button>
            <button className="ped-btn-outline" onClick={() => setMostrarForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="ped-filtros-row">
        <input
          className="ped-input"
          placeholder="Buscar monitor por nome, e-mail ou telefone…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <span className="ped-total-label">{monitores.length} monitor(es)</span>
      </div>

      {carregando ? (
        <div className="ped-loading"><span className="ped-spinner" />Carregando monitores…</div>
      ) : monitores.length === 0 ? (
        <div className="ped-empty">Nenhum monitor cadastrado.</div>
      ) : (
        <div className="ped-tabela-wrapper">
          <table className="ped-tabela">
            <thead>
              <tr>
                <th>Monitor</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Escalas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {monitores.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.nome}</strong></td>
                  <td>
                    {m.email && <div>{m.email}</div>}
                    {m.telefone && <div style={{ fontSize: ".8rem", color: "var(--muted-foreground)" }}>{m.telefone}</div>}
                    {!m.email && !m.telefone && "—"}
                  </td>
                  <td><span className={`ped-badge ${m.status === "ativo" ? "ativo" : "inativo"}`}>{m.status}</span></td>
                  <td>
                    {(m.escalas ?? []).length === 0 ? (
                      <span style={{ color: "var(--muted-foreground)", fontSize: ".8rem" }}>Sem escalas</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: ".3rem" }}>
                        {(m.escalas ?? []).map((e) => (
                          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".8rem" }}>
                            <span>{e.turma?.nome ?? "—"}</span>
                            <span style={{ color: "var(--muted-foreground)" }}>({fmtData(e.turma?.dataInicio)})</span>
                            {e.kitEntregue ? (
                              <span className="ped-badge ativo">kit ✓</span>
                            ) : (
                              <button className="ped-btn-xs" onClick={() => void marcarKit(e.id)}>marcar kit</button>
                            )}
                            <button className="ped-btn-xs perigo" onClick={() => void removerEscala(e.id)}>remover</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="ped-acoes-row">
                      <button className="ped-btn-xs" onClick={() => { setEscalaAlvo(m); setTurmaEscala(""); }}>
                        Escalar
                      </button>
                      {m.status !== "inativo" && (
                        <button className="ped-btn-xs perigo" onClick={() => void inativar(m)}>Inativar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal simples de escala */}
      {escalaAlvo && (
        <div
          onClick={() => setEscalaAlvo(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
        >
          <div onClick={(e) => e.stopPropagation()} className="ped-form-card" style={{ maxWidth: 420, width: "90%" }}>
            <h3 style={{ marginTop: 0 }}>Escalar {escalaAlvo.nome}</h3>
            <label className="ped-label" style={{ marginBottom: ".75rem" }}>
              Turma
              <select className="ped-select" value={turmaEscala} onChange={(e) => setTurmaEscala(e.target.value)}>
                <option value="">Selecionar turma…</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome} {t.dataInicio ? `— ${fmtData(t.dataInicio)}` : ""}</option>
                ))}
              </select>
            </label>
            <label className="ped-label">
              Função
              <select className="ped-select" value={funcaoEscala} onChange={(e) => setFuncaoEscala(e.target.value)}>
                <option value="monitor">Monitor</option>
                <option value="lider">Líder de monitores</option>
                <option value="apoio">Apoio</option>
              </select>
            </label>
            <div className="ped-form-acoes">
              <button className="ped-btn-primario" disabled={!turmaEscala || escalando} onClick={() => void escalar()}>
                {escalando ? "Escalando…" : "Escalar"}
              </button>
              <button className="ped-btn-outline" onClick={() => setEscalaAlvo(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
