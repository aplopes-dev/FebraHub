"use client";
import "@/app/pedagogico.css";
import React, { useEffect, useState, useCallback } from "react";
import { pedagogico, PedagogicoMatricula, PedagogicoTurma } from "@/services/api/pedagogico";
import { ModalPrompt } from "@/components/ui/ModalPrompt";

const ptStatus: Record<string, string> = {
  Matriculado: "Matriculado",
  AguardandoContato: "Ag. Contato",
  AguardandoResposta: "Ag. Resposta",
  Confirmado: "Confirmado",
  NaoRespondeu: "Não Respondeu",
  ProximaTurma: "Próxima Turma",
  TransferenciaSolicitada: "Transfer. Solicitada",
  TransferenciaPendente: "Transfer. Pendente",
  Transferido: "Transferido",
  CancelamentoSolicitado: "Cancelamento Solicitado",
  Cancelado: "Cancelado",
  Credenciado: "Credenciado",
  EmCurso: "Em Curso",
  Concluido: "Concluído",
  Faltou: "Faltou",
  Represado: "Represado",
};

const badgeClass: Record<string, string> = {
  Matriculado: "pendente",
  AguardandoContato: "pendente",
  AguardandoResposta: "pendente",
  Confirmado: "ativo",
  NaoRespondeu: "cancelado",
  ProximaTurma: "pendente",
  TransferenciaSolicitada: "pendente",
  TransferenciaPendente: "pendente",
  Transferido: "inativo",
  CancelamentoSolicitado: "cancelado",
  Cancelado: "cancelado",
  Credenciado: "ativo",
  EmCurso: "ativo",
  Concluido: "ativo",
  Faltou: "cancelado",
  Represado: "cancelado",
};

const STATUS_QUE_PRECISAM_ACAO = [
  "AguardandoContato","AguardandoResposta","NaoRespondeu","TransferenciaSolicitada","TransferenciaPendente"
];

const fmtData = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("pt-BR") : "—";

export default function AlunosPage() {
  const [matriculas, setMatriculas] = useState<PedagogicoMatricula[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCurso, setFiltroCurso] = useState("");
  const [apenasAtencao, setApenasAtencao] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [acaoMassa, setAcaoMassa] = useState("");
  const [executandoAcao, setExecutandoAcao] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "ok" | "erro"; msg: string } | null>(null);
  // Cancelamento de matrícula: modal único (confirma + coleta motivo), no lugar
  // de dois diálogos nativos (confirm + prompt) em sequência.
  const [cancelandoMat, setCancelandoMat] = useState<PedagogicoMatricula | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const confirmarMatricula = async (m: PedagogicoMatricula) => {
    setConfirmandoId(m.id);
    setFeedback(null);
    try {
      await pedagogico.atualizarStatus(m.id, "Confirmado");
      setFeedback({ tipo: "ok", msg: `Matrícula de ${m.pessoaNome ?? "aluno"} confirmada.` });
      await carregar();
    } catch (err: unknown) {
      setFeedback({ tipo: "erro", msg: err instanceof Error ? err.message : "Erro ao confirmar matrícula." });
    } finally {
      setConfirmandoId(null);
    }
  };
  const [salvandoCancelMat, setSalvandoCancelMat] = useState(false);
  const confirmarCancelarMatricula = async (motivo: string) => {
    if (!cancelandoMat) return;
    setSalvandoCancelMat(true);
    try {
      await pedagogico.removerMatricula(cancelandoMat.id, motivo || undefined);
      setFeedback({ tipo: "ok", msg: "Matrícula cancelada." });
      setCancelandoMat(null);
      await carregar();
    } catch (err: unknown) {
      setFeedback({ tipo: "erro", msg: err instanceof Error ? err.message : "Erro ao cancelar matrícula." });
    } finally {
      setSalvandoCancelMat(false);
    }
  };

  // criar matrícula manual
  const [turmas, setTurmas] = useState<PedagogicoTurma[]>([]);
  const [mostrarNovo, setMostrarNovo] = useState(false);
  const [criandoMat, setCriandoMat] = useState(false);
  const [novoMat, setNovoMat] = useState({
    turmaId: "", pessoaId: "", pessoaNome: "", pessoaCpf: "", pessoaEmail: "", pessoaTelefone: "", cursoNome: "",
  });

  const POR_PAGINA = 50;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const q: Record<string, string | number> = { pagina, porPagina: POR_PAGINA };
      if (busca) q.busca = busca;
      if (filtroStatus) q.status = filtroStatus;
      if (filtroCurso) q.cursoId = filtroCurso;
      const res = await pedagogico.matriculas(q);
      let itens = res.itens ?? [];
      if (apenasAtencao) itens = itens.filter(m => STATUS_QUE_PRECISAM_ACAO.includes(m.status));
      setMatriculas(itens);
      setTotal(res.total ?? 0);
    } catch {
      setFeedback({ tipo: "erro", msg: "Erro ao carregar alunos." });
    } finally {
      setCarregando(false);
    }
  }, [pagina, busca, filtroStatus, filtroCurso, apenasAtencao]);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { setPagina(1); }, [busca, filtroStatus, filtroCurso, apenasAtencao]);

  // Carrega turmas para o seletor da matrícula manual (uma vez)
  useEffect(() => {
    pedagogico.turmas({ porPagina: 200 })
      .then(r => setTurmas(r.itens ?? []))
      .catch(() => {});
  }, []);

  const criarMatricula = async () => {
    if (!novoMat.turmaId) { setFeedback({ tipo: "erro", msg: "Selecione a turma." }); return; }
    if (!novoMat.pessoaId.trim() && !novoMat.pessoaNome.trim()) {
      setFeedback({ tipo: "erro", msg: "Informe ao menos o ID ou o nome do aluno." });
      return;
    }
    setCriandoMat(true);
    setFeedback(null);
    try {
      await pedagogico.criarMatricula({
        turmaId: novoMat.turmaId,
        pessoaId: novoMat.pessoaId.trim() || novoMat.pessoaNome.trim(),
        pessoaNome: novoMat.pessoaNome.trim() || undefined,
        pessoaCpf: novoMat.pessoaCpf.trim() || undefined,
        pessoaEmail: novoMat.pessoaEmail.trim() || undefined,
        pessoaTelefone: novoMat.pessoaTelefone.trim() || undefined,
        cursoNome: novoMat.cursoNome.trim() || undefined,
        origem: "manual",
      });
      setFeedback({ tipo: "ok", msg: "Matrícula criada." });
      setMostrarNovo(false);
      setNovoMat({ turmaId: "", pessoaId: "", pessoaNome: "", pessoaCpf: "", pessoaEmail: "", pessoaTelefone: "", cursoNome: "" });
      await carregar();
    } catch (e: unknown) {
      setFeedback({ tipo: "erro", msg: e instanceof Error ? e.message : "Erro ao criar matrícula." });
    } finally {
      setCriandoMat(false);
    }
  };

  const toggleSel = (id: string) => {
    setSelecionados(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleTodos = () => {
    if (selecionados.size === matriculas.length) setSelecionados(new Set());
    else setSelecionados(new Set(matriculas.map(m => m.id)));
  };

  const executarAcao = async () => {
    if (!acaoMassa || selecionados.size === 0) return;
    setExecutandoAcao(true);
    setFeedback(null);
    try {
      const ids = Array.from(selecionados);
      await Promise.all(ids.map(id => pedagogico.atualizarStatus(id, acaoMassa)));
      setFeedback({ tipo: "ok", msg: `${ids.length} aluno(s) atualizados para "${ptStatus[acaoMassa] ?? acaoMassa}".` });
      setSelecionados(new Set());
      await carregar();
    } catch {
      setFeedback({ tipo: "erro", msg: "Erro ao executar ação em massa." });
    } finally {
      setExecutandoAcao(false);
    }
  };

  const totalPaginas = Math.ceil(total / POR_PAGINA);

  const precisamAtencao = matriculas.filter(m => STATUS_QUE_PRECISAM_ACAO.includes(m.status));

  return (
    <div className="ped-page">
      <div className="ped-page-topo">
        <div className="ped-page-header" style={{ marginBottom: 0 }}>
          <h1>Alunos / Jornada</h1>
          <p className="ped-page-sub">Lista operacional de alunos matriculados. Busque, filtre e tome ações em massa.</p>
        </div>
        <button className="ped-btn-primario" onClick={() => setMostrarNovo(v => !v)}>
          {mostrarNovo ? "Fechar" : "+ Nova matrícula"}
        </button>
      </div>

      {mostrarNovo && (
        <div className="ped-form-card" style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ marginTop: 0 }}>Nova matrícula manual</h3>
          <div className="ped-form-grid">
            <label className="ped-label ped-full">
              Turma *
              <select className="ped-select" value={novoMat.turmaId} onChange={e => setNovoMat({ ...novoMat, turmaId: e.target.value })}>
                <option value="">Selecionar turma…</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </label>
            <label className="ped-label">
              ID da pessoa
              <input className="ped-input" value={novoMat.pessoaId} onChange={e => setNovoMat({ ...novoMat, pessoaId: e.target.value })} placeholder="crm_clientes.id / dim_alunos" />
            </label>
            <label className="ped-label">
              Nome do aluno
              <input className="ped-input" value={novoMat.pessoaNome} onChange={e => setNovoMat({ ...novoMat, pessoaNome: e.target.value })} />
            </label>
            <label className="ped-label">
              CPF
              <input className="ped-input" value={novoMat.pessoaCpf} onChange={e => setNovoMat({ ...novoMat, pessoaCpf: e.target.value })} />
            </label>
            <label className="ped-label">
              Telefone
              <input className="ped-input" value={novoMat.pessoaTelefone} onChange={e => setNovoMat({ ...novoMat, pessoaTelefone: e.target.value })} />
            </label>
            <label className="ped-label">
              E-mail
              <input className="ped-input" value={novoMat.pessoaEmail} onChange={e => setNovoMat({ ...novoMat, pessoaEmail: e.target.value })} />
            </label>
            <label className="ped-label">
              Curso (sobrescreve o da turma)
              <input className="ped-input" value={novoMat.cursoNome} onChange={e => setNovoMat({ ...novoMat, cursoNome: e.target.value })} />
            </label>
          </div>
          <div className="ped-form-acoes">
            <button className="ped-btn-primario" disabled={criandoMat} onClick={() => void criarMatricula()}>
              {criandoMat ? "Salvando…" : "✓ Criar matrícula"}
            </button>
            <button className="ped-btn-outline" onClick={() => setMostrarNovo(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* alertas de atenção */}
      {!apenasAtencao && precisamAtencao.length > 0 && (
        <div className="ped-atencao-banner" onClick={() => setApenasAtencao(true)}>
          <span>⚠</span>
          <strong>{precisamAtencao.length} aluno(s) precisam de ação agora</strong>
          <span className="ped-atencao-link">Ver apenas estes →</span>
        </div>
      )}
      {apenasAtencao && (
        <div className="ped-atencao-banner ativo">
          <span>🔍 Filtrando: alunos que precisam de ação</span>
          <button className="ped-btn-xs" onClick={() => setApenasAtencao(false)}>Ver todos</button>
        </div>
      )}

      {feedback && (
        <div className={`ped-feedback ${feedback.tipo}`}>{feedback.msg}</div>
      )}

      {/* filtros */}
      <div className="ped-filtros-row">
        <input
          className="ped-input"
          placeholder="Buscar por nome, CPF, telefone ou e-mail…"
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        <select className="ped-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(ptStatus).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <input
          className="ped-input"
          placeholder="Filtrar por curso…"
          value={filtroCurso}
          onChange={e => setFiltroCurso(e.target.value)}
        />
        <span className="ped-total-label">{total} resultado(s)</span>
      </div>

      {/* ações em massa */}
      {selecionados.size > 0 && (
        <div className="ped-massa-bar">
          <span>{selecionados.size} selecionado(s)</span>
          <select className="ped-select" value={acaoMassa} onChange={e => setAcaoMassa(e.target.value)}>
            <option value="">Ação em massa…</option>
            <option value="Confirmado">✓ Marcar Confirmado</option>
            <option value="NaoRespondeu">✕ Não Respondeu</option>
            <option value="AguardandoContato">↩ Aguardando Contato</option>
          </select>
          <button
            className="ped-btn-primario"
            disabled={!acaoMassa || executandoAcao}
            onClick={executarAcao}
          >
            {executandoAcao ? "Executando…" : "Aplicar"}
          </button>
          <button className="ped-btn-outline" onClick={() => setSelecionados(new Set())}>
            Cancelar
          </button>
        </div>
      )}

      {carregando ? (
        <div className="ped-loading"><span className="ped-spinner" />Carregando alunos…</div>
      ) : matriculas.length === 0 ? (
        <div className="ped-empty">Nenhum aluno encontrado.</div>
      ) : (
        <div className="ped-tabela-wrapper">
          <table className="ped-tabela">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={selecionados.size === matriculas.length && matriculas.length > 0}
                    onChange={toggleTodos}
                  />
                </th>
                <th>Aluno</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Curso</th>
                <th>Turma</th>
                <th>Status</th>
                <th>Confirmação</th>
                <th>Credenciado</th>
                <th>Compra</th>
                <th>Validade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {matriculas.map(m => {
                const vencida = m.validadeFim && new Date(m.validadeFim) < new Date();
                return (
                  <tr key={m.id} className={STATUS_QUE_PRECISAM_ACAO.includes(m.status) ? "ped-row-atencao" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selecionados.has(m.id)}
                        onChange={() => toggleSel(m.id)}
                      />
                    </td>
                    <td><strong>{m.pessoaNome ?? "—"}</strong></td>
                    <td>{m.pessoaCpf ?? "—"}</td>
                    <td>{m.pessoaTelefone ?? "—"}</td>
                    <td>{m.cursoNome ?? m.turma?.cursoNome ?? "—"}</td>
                    <td>{m.turma?.nome ?? "A definir"}</td>
                    <td>
                      <span className={`ped-badge ${badgeClass[m.status] ?? "inativo"}`}>
                        {ptStatus[m.status] ?? m.status}
                      </span>
                    </td>
                    <td>
                      {m.ultimaConfirmacao ? (
                        <span className={`ped-badge ${badgeClass[m.ultimaConfirmacao.status] ?? "inativo"}`}>
                          {ptStatus[m.ultimaConfirmacao.status] ?? m.ultimaConfirmacao.status}
                        </span>
                      ) : <span className="ped-badge inativo">—</span>}
                    </td>
                    <td>
                      {m.credenciado
                        ? <span className="ped-badge ativo">✓</span>
                        : <span className="ped-badge inativo">Não</span>}
                    </td>
                    <td>{fmtData(m.dataCompra)}</td>
                    <td>
                      {m.validadeFim ? (
                        <span className={`ped-badge ${vencida ? "cancelado" : "ativo"}`}>
                          {fmtData(m.validadeFim)}{vencida ? " ⚠" : ""}
                        </span>
                      ) : "—"}
                    </td>
                    <td>
                      <div className="ped-acoes-row">
                        {m.turma && (
                          <a href={`/pedagogico/turmas/${m.turma.id}`} className="ped-btn-xs">
                            Ver turma
                          </a>
                        )}
                        <button
                          className="ped-btn-xs ativo"
                          onClick={() => void confirmarMatricula(m)}
                          disabled={m.status === "Confirmado" || confirmandoId === m.id}
                        >
                          {confirmandoId === m.id ? "Confirmando…" : "Confirmar"}
                        </button>
                        <button
                          className="ped-btn-xs perigo"
                          disabled={m.status === "Cancelado"}
                          onClick={() => setCancelandoMat(m)}
                        >
                          Cancelar
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

      {/* paginação */}
      {totalPaginas > 1 && (
        <div className="ped-paginacao">
          <button className="ped-btn-outline" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>
            ← Anterior
          </button>
          <span>Página {pagina} de {totalPaginas}</span>
          <button className="ped-btn-outline" disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)}>
            Próxima →
          </button>
        </div>
      )}

      {cancelandoMat && (
        <ModalPrompt
          titulo={`Cancelar matrícula — ${cancelandoMat.pessoaNome ?? "aluno"}`}
          descricao="O histórico é preservado. Informe o motivo do cancelamento (opcional)."
          rotulo="Motivo"
          placeholder="Ex.: desistência, transferência, inadimplência…"
          obrigatorio={false}
          rotuloConfirmar="Cancelar matrícula"
          perigo
          carregando={salvandoCancelMat}
          onConfirmar={(motivo) => void confirmarCancelarMatricula(motivo)}
          onFechar={() => setCancelandoMat(null)}
        />
      )}
    </div>
  );
}
