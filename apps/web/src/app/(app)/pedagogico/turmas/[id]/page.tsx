"use client";
import "@/app/pedagogico.css";
import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { pedagogico, PedagogicoTurma, PedagogicoMatricula } from "@/services/api/pedagogico";

// ─── helpers ────────────────────────────────────────────────────────────────
const fmtData = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("pt-BR") : "—";
const fmtHora = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "—";

type Aba =
  | "geral"
  | "alunos"
  | "confirmacoes"
  | "credenciamento"
  | "presenca"
  | "monitores"
  | "pos"
  | "historico";

const ABAS: { key: Aba; label: string }[] = [
  { key: "geral", label: "Visão Geral" },
  { key: "alunos", label: "Alunos" },
  { key: "confirmacoes", label: "Confirmações" },
  { key: "credenciamento", label: "Credenciamento" },
  { key: "presenca", label: "Presença" },
  { key: "monitores", label: "Monitores" },
  { key: "pos", label: "Pós-Curso" },
  { key: "historico", label: "Histórico" },
];

const STATUS_LABELS: Record<string, string> = {
  Planejada: "planejada",
  AguardandoValidacao: "pendente",
  Confirmada: "ativo",
  EmPreparacao: "pendente",
  EmAndamento: "ativo",
  Finalizada: "inativo",
  Cancelada: "cancelado",
};

const MAT_STATUS_LABELS: Record<string, string> = {
  Matriculado: "pendente",
  AguardandoContato: "pendente",
  AguardandoResposta: "pendente",
  Confirmado: "ativo",
  NaoRespondeu: "cancelado",
  Represado: "cancelado",
  Transferido: "inativo",
  Cancelado: "cancelado",
  Credenciado: "ativo",
  EmCurso: "ativo",
  Concluido: "ativo",
  Faltou: "cancelado",
};

const ptStatus: Record<string, string> = {
  Matriculado: "Matriculado",
  AguardandoContato: "Ag. Contato",
  AguardandoResposta: "Ag. Resposta",
  Confirmado: "Confirmado",
  NaoRespondeu: "Não Respondeu",
  Represado: "Represado",
  Transferido: "Transferido",
  Cancelado: "Cancelado",
  Credenciado: "Credenciado",
  EmCurso: "Em Curso",
  Concluido: "Concluído",
  Faltou: "Faltou",
};

// ─── componente principal ───────────────────────────────────────────────────
export default function DetalhesTurmaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("geral");
  const [turma, setTurma] = useState<(PedagogicoTurma & { matriculas: PedagogicoMatricula[] }) | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [mudandoStatus, setMudandoStatus] = useState(false);

  const carregar = useCallback(async () => {
    if (!params.id) return;
    setCarregando(true);
    setErro(null);
    try {
      const data = await pedagogico.turma(params.id);
      setTurma(data as PedagogicoTurma & { matriculas: PedagogicoMatricula[] });
    } catch {
      setErro("Erro ao carregar turma.");
    } finally {
      setCarregando(false);
    }
  }, [params.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const mudarStatus = async (status: string) => {
    if (!turma) return;
    setMudandoStatus(true);
    try {
      await pedagogico.mudarStatusTurma(turma.id, status);
      await carregar();
    } finally {
      setMudandoStatus(false);
    }
  };

  if (carregando) return (
    <div className="ped-page">
      <div className="ped-loading"><span className="ped-spinner" />Carregando turma…</div>
    </div>
  );

  if (erro || !turma) return (
    <div className="ped-page">
      <div className="ped-empty">{erro ?? "Turma não encontrada."}</div>
    </div>
  );

  const matriculasFiltradas = (turma.matriculas ?? []).filter(m => {
    const q = busca.toLowerCase();
    const ok = !q || (m.pessoaNome ?? "").toLowerCase().includes(q)
      || (m.pessoaCpf ?? "").includes(q)
      || (m.pessoaTelefone ?? "").includes(q);
    const okStatus = !filtroStatus || m.status === filtroStatus;
    return ok && okStatus;
  });

  const confirmados = (turma.matriculas ?? []).filter(m => m.status === "Confirmado").length;
  const credenciados = (turma.matriculas ?? []).filter(m => m.credenciado).length;

  return (
    <div className="ped-page">
      {/* ── cabeçalho ── */}
      <div className="ped-turma-header">
        <button className="ped-back-btn" onClick={() => router.back()}>← Voltar</button>
        <div className="ped-turma-titulo">
          <h1>{turma.nome}</h1>
          <span className={`ped-badge ${STATUS_LABELS[turma.status] ?? "inativo"}`}>
            {turma.status}
          </span>
        </div>
        <div className="ped-turma-meta">
          <span><strong>Curso:</strong> {turma.cursoNome}</span>
          {turma.unidade && <span><strong>Unidade:</strong> {turma.unidade}</span>}
          {turma.dataInicio && (
            <span><strong>Datas:</strong> {fmtData(turma.dataInicio)} → {fmtData(turma.dataFim)}</span>
          )}
          {turma.treinador && <span><strong>Treinador:</strong> {turma.treinador}</span>}
          {turma.local && <span><strong>Local:</strong> {turma.local}</span>}
        </div>
        <div className="ped-turma-kpis">
          <div className="ped-kpi-mini"><span className="ped-kpi-valor">{turma.capacidade ?? "—"}</span><span className="ped-kpi-rot">Capacidade</span></div>
          <div className="ped-kpi-mini"><span className="ped-kpi-valor">{turma.matriculados ?? (turma.matriculas ?? []).length}</span><span className="ped-kpi-rot">Matrículas</span></div>
          <div className="ped-kpi-mini ativo"><span className="ped-kpi-valor">{confirmados}</span><span className="ped-kpi-rot">Confirmados</span></div>
          <div className="ped-kpi-mini ativo"><span className="ped-kpi-valor">{credenciados}</span><span className="ped-kpi-rot">Credenciados</span></div>
          {(turma.represados ?? 0) > 0 && (
            <div className="ped-kpi-mini cancelado"><span className="ped-kpi-valor">{turma.represados}</span><span className="ped-kpi-rot">Represados</span></div>
          )}
        </div>
        {/* ações de status */}
        <div className="ped-turma-acoes">
          {["EmPreparacao", "EmAndamento", "Finalizada", "Cancelada"].map(s => (
            <button
              key={s}
              className={`ped-btn-outline ${turma.status === s ? "ativo" : ""}`}
              disabled={mudandoStatus || turma.status === s}
              onClick={() => mudarStatus(s)}
            >
              {s === "EmPreparacao" ? "↗ Em Preparação"
                : s === "EmAndamento" ? "▶ Em Andamento"
                : s === "Finalizada" ? "✓ Finalizar"
                : "✕ Cancelar"}
            </button>
          ))}
        </div>
      </div>

      {/* ── abas ── */}
      <div className="ped-abas">
        {ABAS.map(a => (
          <button
            key={a.key}
            className={`ped-aba-btn ${aba === a.key ? "ativo" : ""}`}
            onClick={() => setAba(a.key)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* ── conteúdo das abas ── */}
      <div className="ped-aba-conteudo">

        {/* === VISÃO GERAL === */}
        {aba === "geral" && (
          <div className="ped-geral-grid">
            <div className="ped-card-info">
              <h3>Informações da Turma</h3>
              <table className="ped-info-tabela">
                <tbody>
                  <tr><td>ID Interno</td><td><code>{turma.id}</code></td></tr>
                  {turma.turmaIdSf && <tr><td>ID Salesforce</td><td>{turma.turmaIdSf}</td></tr>}
                  <tr><td>Curso</td><td>{turma.cursoNome}</td></tr>
                  <tr><td>Status</td><td><span className={`ped-badge ${STATUS_LABELS[turma.status] ?? "inativo"}`}>{turma.status}</span></td></tr>
                  {turma.unidade && <tr><td>Unidade</td><td>{turma.unidade}</td></tr>}
                  {turma.local && <tr><td>Local</td><td>{turma.local}</td></tr>}
                  {turma.endereco && <tr><td>Endereço</td><td>{turma.endereco}</td></tr>}
                  {turma.dataInicio && <tr><td>Data Início</td><td>{fmtData(turma.dataInicio)}</td></tr>}
                  {turma.dataFim && <tr><td>Data Fim</td><td>{fmtData(turma.dataFim)}</td></tr>}
                  {turma.horarioInicio && <tr><td>Horário</td><td>{turma.horarioInicio} – {turma.horarioFim}</td></tr>}
                  {turma.horarioCredenciamento && <tr><td>Credenciamento</td><td>{turma.horarioCredenciamento}</td></tr>}
                  {turma.treinador && <tr><td>Treinador</td><td>{turma.treinador}</td></tr>}
                  {turma.capacidade && <tr><td>Capacidade</td><td>{turma.capacidade}</td></tr>}
                  {turma.linkGrupo && <tr><td>Link Grupo</td><td><a href={turma.linkGrupo} target="_blank" rel="noreferrer">{turma.linkGrupo}</a></td></tr>}
                  {turma.observacoes && <tr><td>Observações</td><td>{turma.observacoes}</td></tr>}
                  <tr><td>Criado em</td><td>{fmtData(turma.criadoEm)}</td></tr>
                  <tr><td>Atualizado em</td><td>{fmtData(turma.atualizadoEm)} {fmtHora(turma.atualizadoEm)}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="ped-card-info">
              <h3>Indicadores</h3>
              <div className="ped-kpis-grid">
                <div className="ped-kpi-card"><span className="ped-kpi-numero">{(turma.matriculas ?? []).length}</span><span className="ped-kpi-label">Matriculados</span></div>
                <div className="ped-kpi-card ativo"><span className="ped-kpi-numero">{confirmados}</span><span className="ped-kpi-label">Confirmados</span></div>
                <div className="ped-kpi-card ativo"><span className="ped-kpi-numero">{credenciados}</span><span className="ped-kpi-label">Credenciados</span></div>
                <div className="ped-kpi-card"><span className="ped-kpi-numero">{turma.presentes ?? 0}</span><span className="ped-kpi-label">Presentes</span></div>
                <div className="ped-kpi-card cancelado"><span className="ped-kpi-numero">{turma.represados ?? 0}</span><span className="ped-kpi-label">Represados</span></div>
                <div className="ped-kpi-card inativo"><span className="ped-kpi-numero">
                  {(turma.matriculas ?? []).length > 0
                    ? Math.round((confirmados / (turma.matriculas ?? []).length) * 100) + "%"
                    : "—"}
                </span><span className="ped-kpi-label">Taxa Confirmação</span></div>
              </div>
              {/* alunos que precisam de atenção */}
              {(turma.matriculas ?? []).some(m => ["AguardandoContato","AguardandoResposta","NaoRespondeu"].includes(m.status)) && (
                <div className="ped-atencao-box">
                  <h4>⚠ Atenção necessária</h4>
                  {["AguardandoContato","AguardandoResposta","NaoRespondeu"].map(st => {
                    const n = (turma.matriculas ?? []).filter(m => m.status === st).length;
                    if (!n) return null;
                    return <p key={st}><strong>{n}</strong> {ptStatus[st] ?? st}</p>;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === ALUNOS === */}
        {aba === "alunos" && (
          <div>
            <div className="ped-filtros-row">
              <input
                className="ped-input"
                placeholder="Buscar por nome, CPF ou telefone…"
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
              <select className="ped-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="">Todos os status</option>
                {Object.keys(ptStatus).map(s => (
                  <option key={s} value={s}>{ptStatus[s]}</option>
                ))}
              </select>
              <span className="ped-total-label">{matriculasFiltradas.length} aluno(s)</span>
            </div>

            {matriculasFiltradas.length === 0 ? (
              <div className="ped-empty">Nenhum aluno encontrado.</div>
            ) : (
              <div className="ped-tabela-wrapper">
                <table className="ped-tabela">
                  <thead>
                    <tr>
                      <th>Aluno</th>
                      <th>CPF</th>
                      <th>Telefone</th>
                      <th>Status</th>
                      <th>Confirmação</th>
                      <th>Credenciado</th>
                      <th>Presença</th>
                      <th>Compra</th>
                      <th>Validade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matriculasFiltradas.map(m => (
                      <tr key={m.id}>
                        <td><strong>{m.pessoaNome ?? "—"}</strong></td>
                        <td>{m.pessoaCpf ?? "—"}</td>
                        <td>{m.pessoaTelefone ?? "—"}</td>
                        <td>
                          <span className={`ped-badge ${MAT_STATUS_LABELS[m.status] ?? "inativo"}`}>
                            {ptStatus[m.status] ?? m.status}
                          </span>
                        </td>
                        <td>
                          {m.ultimaConfirmacao ? (
                            <span className={`ped-badge ${MAT_STATUS_LABELS[m.ultimaConfirmacao.status] ?? "inativo"}`}>
                              {ptStatus[m.ultimaConfirmacao.status] ?? m.ultimaConfirmacao.status}
                            </span>
                          ) : <span className="ped-badge inativo">—</span>}
                        </td>
                        <td>{m.credenciado ? <span className="ped-badge ativo">✓ {fmtHora(m.credenciadoEm)}</span> : <span className="ped-badge inativo">Não</span>}</td>
                        <td>{m.totalPresencas != null ? `${m.totalPresencas} reg.` : "—"}</td>
                        <td>{fmtData(m.dataCompra)}</td>
                        <td>
                          {m.validadeFim ? (
                            <span className={new Date(m.validadeFim) < new Date() ? "ped-badge cancelado" : "ped-badge ativo"}>
                              {fmtData(m.validadeFim)}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* === CONFIRMAÇÕES === */}
        {aba === "confirmacoes" && (
          <div>
            <p className="ped-desc-aba">Situação de confirmação de participação dos alunos desta turma.</p>
            <div className="ped-tabela-wrapper">
              <table className="ped-tabela">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Status Atual</th>
                    <th>Último Contato</th>
                    <th>Canal</th>
                    <th>Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {(turma.matriculas ?? []).map(m => (
                    <tr key={m.id}>
                      <td><strong>{m.pessoaNome ?? "—"}</strong></td>
                      <td>
                        <span className={`ped-badge ${MAT_STATUS_LABELS[m.status] ?? "inativo"}`}>
                          {ptStatus[m.status] ?? m.status}
                        </span>
                      </td>
                      <td>{m.ultimaConfirmacao ? fmtData(m.ultimaConfirmacao.criadoEm) : "—"}</td>
                      <td>{m.ultimaConfirmacao?.canal ?? "—"}</td>
                      <td>{m.pessoaTelefone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === CREDENCIAMENTO === */}
        {aba === "credenciamento" && (
          <div>
            <p className="ped-desc-aba">Situação de credenciamento dos alunos. Para credenciar, use a <a href="/pedagogico/credenciamento">tela de Credenciamento</a>.</p>
            <div className="ped-tabela-wrapper">
              <table className="ped-tabela">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Status</th>
                    <th>Credenciado</th>
                    <th>Horário</th>
                    <th>Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {(turma.matriculas ?? []).map(m => (
                    <tr key={m.id}>
                      <td><strong>{m.pessoaNome ?? "—"}</strong></td>
                      <td>
                        <span className={`ped-badge ${MAT_STATUS_LABELS[m.status] ?? "inativo"}`}>
                          {ptStatus[m.status] ?? m.status}
                        </span>
                      </td>
                      <td>{m.credenciado
                        ? <span className="ped-badge ativo">✓ Credenciado</span>
                        : <span className="ped-badge inativo">Pendente</span>}
                      </td>
                      <td>{m.credenciadoEm ? `${fmtData(m.credenciadoEm)} ${fmtHora(m.credenciadoEm)}` : "—"}</td>
                      <td>{m.pessoaTelefone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === PRESENÇA === */}
        {aba === "presenca" && (
          <div>
            <p className="ped-desc-aba">
              Registro de presença por aluno/dia/sessão. Para registrar presença, use a{" "}
              <a href="/pedagogico/presenca">tela de Presença</a>.
            </p>
            <div className="ped-tabela-wrapper">
              <table className="ped-tabela">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Status</th>
                    <th>Total Presenças</th>
                    <th>Credenciado</th>
                  </tr>
                </thead>
                <tbody>
                  {(turma.matriculas ?? []).map(m => (
                    <tr key={m.id}>
                      <td><strong>{m.pessoaNome ?? "—"}</strong></td>
                      <td>
                        <span className={`ped-badge ${MAT_STATUS_LABELS[m.status] ?? "inativo"}`}>
                          {ptStatus[m.status] ?? m.status}
                        </span>
                      </td>
                      <td>{m.totalPresencas ?? 0} registro(s)</td>
                      <td>{m.credenciado ? <span className="ped-badge ativo">✓</span> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === MONITORES === */}
        {aba === "monitores" && (
          <div>
            <p className="ped-desc-aba">Escala de monitores desta turma. Gerencie a equipe em <a href="/pedagogico/monitores">Monitores</a>.</p>
            <div className="ped-empty">Escala de monitores em desenvolvimento. Use a tela de Monitores para gerenciar.</div>
          </div>
        )}

        {/* === PÓS-CURSO === */}
        {aba === "pos" && (
          <div>
            <p className="ped-desc-aba">Conclusão, certificados e pendências pós-curso.</p>
            <div className="ped-pos-grid">
              <div className="ped-card-info">
                <h3>Resultado da Turma</h3>
                <div className="ped-kpis-grid">
                  <div className="ped-kpi-card ativo">
                    <span className="ped-kpi-numero">
                      {(turma.matriculas ?? []).filter(m => m.status === "Concluido").length}
                    </span>
                    <span className="ped-kpi-label">Concluídos</span>
                  </div>
                  <div className="ped-kpi-card cancelado">
                    <span className="ped-kpi-numero">
                      {(turma.matriculas ?? []).filter(m => m.status === "Faltou").length}
                    </span>
                    <span className="ped-kpi-label">Faltantes</span>
                  </div>
                  <div className="ped-kpi-card cancelado">
                    <span className="ped-kpi-numero">
                      {(turma.matriculas ?? []).filter(m => m.status === "Represado").length}
                    </span>
                    <span className="ped-kpi-label">Represados</span>
                  </div>
                </div>
              </div>
              <div className="ped-card-info">
                <h3>Alunos com Pendência</h3>
                {(turma.matriculas ?? [])
                  .filter(m => ["Faltou","Represado","AguardandoContato","AguardandoResposta"].includes(m.status))
                  .slice(0, 10)
                  .map(m => (
                    <div key={m.id} className="ped-pendencia-row">
                      <span>{m.pessoaNome ?? "—"}</span>
                      <span className={`ped-badge ${MAT_STATUS_LABELS[m.status] ?? "inativo"}`}>
                        {ptStatus[m.status] ?? m.status}
                      </span>
                    </div>
                  ))}
                {(turma.matriculas ?? []).filter(m => ["Faltou","Represado","AguardandoContato","AguardandoResposta"].includes(m.status)).length === 0 && (
                  <p className="ped-empty-inline">Nenhuma pendência. ✓</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === HISTÓRICO === */}
        {aba === "historico" && (
          <div>
            <p className="ped-desc-aba">Timeline de eventos desta turma (auditoria).</p>
            <div className="ped-timeline">
              <div className="ped-timeline-item">
                <div className="ped-tl-data">{fmtData(turma.criadoEm)}</div>
                <div className="ped-tl-conteudo">
                  <strong>Turma criada</strong>
                  <span>{turma.nome} — {turma.cursoNome}</span>
                </div>
              </div>
              {turma.dataInicio && (
                <div className="ped-timeline-item">
                  <div className="ped-tl-data">{fmtData(turma.dataInicio)}</div>
                  <div className="ped-tl-conteudo">
                    <strong>Início previsto</strong>
                    <span>{turma.local ?? ""}</span>
                  </div>
                </div>
              )}
              <div className="ped-timeline-item">
                <div className="ped-tl-data">{fmtData(turma.atualizadoEm)}</div>
                <div className="ped-tl-conteudo">
                  <strong>Última atualização</strong>
                  <span>Status: {turma.status}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
