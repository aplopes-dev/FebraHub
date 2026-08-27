"use client";
import "@/app/pedagogico.css";
import { useCallback, useEffect, useState } from "react";
import { pedagogico } from "@/services/api/pedagogico";
import { ModalPrompt } from "@/components/ui/ModalPrompt";
import { Select } from "@/components/ui/Select";
import { ModalConfirmar } from "@/components/ui/ModalConfirmar";

const fmtData = (s?: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");

type CsItem = {
  id: string;
  pessoaId: string;
  pessoaNome?: string | null;
  motivo: string;
  status: string;
  prioridade: string;
  proximaAcao?: string | null;
  prazo?: string | null;
  observacoes?: string | null;
  criadoEm?: string | null;
  matricula?: { id: string; pessoaNome?: string | null; cursoNome?: string | null; validadeFim?: string | null; status?: string } | null;
};

const STATUS = ["aberto", "em_andamento", "resolvido", "cancelado"];
const MOTIVOS = ["risco_evasao", "represado", "insatisfacao", "financeiro", "retencao", "outro"];

export default function CustomerSuccessPage() {
  const [lista, setLista] = useState<CsItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [novo, setNovo] = useState({ pessoaId: "", pessoaNome: "", motivo: "risco_evasao", prioridade: "normal", proxima_acao: "", prazo: "", observacoes: "" });
  const [salvando, setSalvando] = useState(false);

  // edição completa
  const [editando, setEditando] = useState<CsItem | null>(null);
  const [formEdit, setFormEdit] = useState({ status: "", prioridade: "", proxima_acao: "", prazo: "", observacoes: "", resultado: "" });
  const [salvandoEdit, setSalvandoEdit] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const q: Record<string, string> = {};
      if (filtroStatus) q.status = filtroStatus;
      if (filtroMotivo) q.motivo = filtroMotivo;
      const res = (await pedagogico.cs(Object.keys(q).length ? q : undefined)) as CsItem[];
      setLista(res ?? []);
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao carregar acompanhamentos." });
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus, filtroMotivo]);

  useEffect(() => { void carregar(); }, [carregar]);

  const criar = async () => {
    if (!novo.pessoaId.trim() || !novo.motivo) {
      setFeedback({ tipo: "erro", msg: "ID da pessoa e motivo são obrigatórios." });
      return;
    }
    setSalvando(true);
    setFeedback(null);
    try {
      await pedagogico.criarCs({
        pessoaId: novo.pessoaId.trim(),
        pessoaNome: novo.pessoaNome.trim() || undefined,
        motivo: novo.motivo,
        prioridade: novo.prioridade,
        proxima_acao: novo.proxima_acao.trim() || undefined,
        prazo: novo.prazo || undefined,
        observacoes: novo.observacoes.trim() || undefined,
      });
      setFeedback({ tipo: "ok", msg: "Acompanhamento aberto." });
      setNovo({ pessoaId: "", pessoaNome: "", motivo: "risco_evasao", prioridade: "normal", proxima_acao: "", prazo: "", observacoes: "" });
      setMostrarForm(false);
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao abrir acompanhamento." });
    } finally {
      setSalvando(false);
    }
  };

  const mudarStatus = async (c: CsItem, status: string, resultado?: string) => {
    try {
      await pedagogico.atualizarCs(c.id, { status, resultado });
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao atualizar acompanhamento." });
    }
  };
  // "Resolver" pede o resultado num modal (antes era prompt() nativo).
  const [resolvendo, setResolvendo] = useState<CsItem | null>(null);
  const [salvandoResolver, setSalvandoResolver] = useState(false);
  const confirmarResolver = async (resultado: string) => {
    if (!resolvendo) return;
    setSalvandoResolver(true);
    await mudarStatus(resolvendo, "resolvido", resultado || undefined);
    setSalvandoResolver(false);
    setResolvendo(null);
  };

  const [descartando, setDescartando] = useState<CsItem | null>(null);
  const descartar = async (c: CsItem) => {
    setDescartando(null);
    try {
      await pedagogico.removerCs(c.id);
      setFeedback({ tipo: "ok", msg: "Acompanhamento descartado." });
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao descartar." });
    }
  };

  const abrirEdicao = (c: CsItem) => {
    setFormEdit({
      status: c.status ?? "aberto",
      prioridade: c.prioridade ?? "normal",
      proxima_acao: c.proximaAcao ?? "",
      prazo: c.prazo ? String(c.prazo).slice(0, 10) : "",
      observacoes: c.observacoes ?? "",
      resultado: "",
    });
    setEditando(c);
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    setSalvandoEdit(true);
    setFeedback(null);
    try {
      await pedagogico.atualizarCs(editando.id, {
        status: formEdit.status || undefined,
        prioridade: formEdit.prioridade || undefined,
        proxima_acao: formEdit.proxima_acao.trim() || undefined,
        prazo: formEdit.prazo || undefined,
        observacoes: formEdit.observacoes.trim() || undefined,
        resultado: formEdit.resultado.trim() || undefined,
      });
      setFeedback({ tipo: "ok", msg: "Acompanhamento atualizado." });
      setEditando(null);
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao salvar acompanhamento." });
    } finally {
      setSalvandoEdit(false);
    }
  };

  const abertos = lista.filter((c) => ["aberto", "em_andamento"].includes(c.status)).length;

  return (
    <div className="ped-page">
      <div className="ped-page-topo">
        <div className="ped-page-header" style={{ marginBottom: 0 }}>
          <h1>Customer Success</h1>
          <p className="ped-page-sub">Acompanhamento de alunos que exigem atenção: risco de evasão, represados e retenção.</p>
        </div>
        <button className="ped-btn-primario" onClick={() => setMostrarForm((v) => !v)}>
          {mostrarForm ? "Fechar" : "+ Novo acompanhamento"}
        </button>
      </div>

      {abertos > 0 && (
        <div className="ped-atencao-box">{abertos} acompanhamento(s) em aberto.</div>
      )}

      {feedback && <div className={`ped-feedback ${feedback.tipo}`}>{feedback.msg}</div>}

      {mostrarForm && (
        <div className="ped-form-card" style={{ marginBottom: "1.25rem" }}>
          <div className="ped-form-grid">
            <label className="ped-label">
              ID da pessoa*
              <input className="ped-input" value={novo.pessoaId} onChange={(e) => setNovo({ ...novo, pessoaId: e.target.value })} />
            </label>
            <label className="ped-label">
              Nome do aluno
              <input className="ped-input" value={novo.pessoaNome} onChange={(e) => setNovo({ ...novo, pessoaNome: e.target.value })} />
            </label>
            <label className="ped-label">
              Motivo
              <Select className="ped-select" aria-label="Motivo" value={novo.motivo} onChange={(v) => setNovo({ ...novo, motivo: v })}
                options={MOTIVOS.map((m) => ({ value: m, label: m }))} />
            </label>
            <label className="ped-label">
              Prioridade
              <Select className="ped-select" aria-label="Prioridade" value={novo.prioridade} onChange={(v) => setNovo({ ...novo, prioridade: v })}
                options={[{ value: "baixa", label: "Baixa" }, { value: "normal", label: "Normal" }, { value: "alta", label: "Alta" }, { value: "urgente", label: "Urgente" }]} />
            </label>
            <label className="ped-label">
              Próxima ação
              <input className="ped-input" value={novo.proxima_acao} onChange={(e) => setNovo({ ...novo, proxima_acao: e.target.value })} />
            </label>
            <label className="ped-label">
              Prazo
              <input type="date" className="ped-input" value={novo.prazo} onChange={(e) => setNovo({ ...novo, prazo: e.target.value })} />
            </label>
            <label className="ped-label ped-full">
              Observações
              <textarea className="ped-textarea" value={novo.observacoes} onChange={(e) => setNovo({ ...novo, observacoes: e.target.value })} />
            </label>
          </div>
          <div className="ped-form-acoes">
            <button className="ped-btn-primario" disabled={salvando} onClick={() => void criar()}>
              {salvando ? "Salvando…" : "Abrir acompanhamento"}
            </button>
            <button className="ped-btn-outline" onClick={() => setMostrarForm(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="ped-filtros-row">
        <Select className="ped-select" aria-label="Filtrar por status" value={filtroStatus} onChange={setFiltroStatus}
          options={[{ value: "", label: "Todos os status" }, ...STATUS.map((s) => ({ value: s, label: s }))]} />
        <Select className="ped-select" aria-label="Filtrar por motivo" value={filtroMotivo} onChange={setFiltroMotivo}
          options={[{ value: "", label: "Todos os motivos" }, ...MOTIVOS.map((m) => ({ value: m, label: m }))]} />
        <span className="ped-total-label">{lista.length} acompanhamento(s)</span>
      </div>

      {carregando ? (
        <div className="ped-loading"><span className="ped-spinner" />Carregando acompanhamentos…</div>
      ) : lista.length === 0 ? (
        <div className="ped-empty">Nenhum acompanhamento encontrado.</div>
      ) : (
        <div className="ped-tabela-wrapper">
          <table className="ped-tabela">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Motivo</th>
                <th>Prioridade</th>
                <th>Próxima ação</th>
                <th>Prazo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id} className={["aberto", "em_andamento"].includes(c.status) ? "ped-row-atencao" : ""}>
                  <td>
                    <strong>{c.pessoaNome ?? c.matricula?.pessoaNome ?? c.pessoaId}</strong>
                    {c.matricula?.cursoNome && <div style={{ fontSize: ".75rem", color: "var(--muted-foreground)" }}>{c.matricula.cursoNome}</div>}
                  </td>
                  <td>{c.motivo}</td>
                  <td><span className={`ped-badge ${c.prioridade}`}>{c.prioridade}</span></td>
                  <td style={{ maxWidth: 240 }}>{c.proximaAcao ?? "—"}</td>
                  <td>{fmtData(c.prazo)}</td>
                  <td><span className={`ped-badge ${c.status}`}>{c.status}</span></td>
                  <td>
                    <div className="ped-acoes-row">
                      <button className="ped-btn-xs" onClick={() => abrirEdicao(c)}>Editar</button>
                      {c.status === "aberto" && (
                        <button className="ped-btn-xs" onClick={() => void mudarStatus(c, "em_andamento")}>Em andamento</button>
                      )}
                      {["aberto", "em_andamento"].includes(c.status) && (
                        <>
                          <button className="ped-btn-xs ativo" onClick={() => setResolvendo(c)}>Resolver</button>
                          <button className="ped-btn-xs perigo" onClick={() => void mudarStatus(c, "cancelado")}>Cancelar</button>
                        </>
                      )}
                      {c.status !== "descartado" && (
                        <button className="ped-btn-xs perigo" onClick={() => setDescartando(c)}>Descartar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de edição completa */}
      {editando && (
        <div
          onClick={() => !salvandoEdit && setEditando(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 60, padding: "2rem 1rem", overflowY: "auto" }}
        >
          <div onClick={(e) => e.stopPropagation()} className="ped-form-card" style={{ maxWidth: 560, width: "100%" }}>
            <h3 style={{ marginTop: 0 }}>Editar acompanhamento — {editando.pessoaNome ?? editando.pessoaId}</h3>
            <div className="ped-form-grid">
              <label className="ped-label">
                Status
                <Select className="ped-select" aria-label="Status" value={formEdit.status} onChange={(v) => setFormEdit({ ...formEdit, status: v })}
                  options={STATUS.map((s) => ({ value: s, label: s }))} />
              </label>
              <label className="ped-label">
                Prioridade
                <Select className="ped-select" aria-label="Prioridade" value={formEdit.prioridade} onChange={(v) => setFormEdit({ ...formEdit, prioridade: v })}
                  options={[{ value: "baixa", label: "Baixa" }, { value: "normal", label: "Normal" }, { value: "alta", label: "Alta" }, { value: "urgente", label: "Urgente" }]} />
              </label>
              <label className="ped-label ped-full">
                Próxima ação
                <input className="ped-input" value={formEdit.proxima_acao} onChange={(e) => setFormEdit({ ...formEdit, proxima_acao: e.target.value })} />
              </label>
              <label className="ped-label">
                Prazo
                <input type="date" className="ped-input" value={formEdit.prazo} onChange={(e) => setFormEdit({ ...formEdit, prazo: e.target.value })} />
              </label>
              <label className="ped-label ped-full">
                Observações
                <textarea className="ped-textarea" value={formEdit.observacoes} onChange={(e) => setFormEdit({ ...formEdit, observacoes: e.target.value })} />
              </label>
              <label className="ped-label ped-full">
                Resultado (registrado ao resolver)
                <textarea className="ped-textarea" value={formEdit.resultado} onChange={(e) => setFormEdit({ ...formEdit, resultado: e.target.value })} />
              </label>
            </div>
            <div className="ped-form-acoes">
              <button className="ped-btn-primario" disabled={salvandoEdit} onClick={() => void salvarEdicao()}>
                {salvandoEdit ? "Salvando…" : "✓ Salvar"}
              </button>
              <button className="ped-btn-outline" onClick={() => setEditando(null)} disabled={salvandoEdit}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {resolvendo && (
        <ModalPrompt
          titulo={`Resolver acompanhamento — ${resolvendo.pessoaNome ?? resolvendo.pessoaId}`}
          descricao="Descreva o resultado do acompanhamento (opcional). Fica registrado no histórico."
          rotulo="Resultado"
          placeholder="Ex.: aluno retomou as aulas, renegociou o pagamento…"
          obrigatorio={false}
          rotuloConfirmar="Marcar como resolvido"
          carregando={salvandoResolver}
          onConfirmar={(r) => void confirmarResolver(r)}
          onFechar={() => setResolvendo(null)}
        />
      )}
      {descartando && (
        <ModalConfirmar
          titulo="Descartar acompanhamento"
          mensagem={<>Descartar o acompanhamento de <b>{descartando.pessoaNome ?? descartando.pessoaId}</b>?</>}
          rotuloConfirmar="Descartar"
          perigo
          onConfirmar={() => void descartar(descartando)}
          onFechar={() => setDescartando(null)}
        />
      )}
    </div>
  );
}
