"use client";
import "@/app/pedagogico.css";
import React, { useEffect, useState, useCallback } from "react";
import { pedagogico, PedagogicoMatricula } from "@/services/api/pedagogico";

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

  const POR_PAGINA = 50;

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const q: Record<string, string | number> = { pagina, limite: POR_PAGINA };
      if (busca) q.q = busca;
      if (filtroStatus) q.status = filtroStatus;
      if (filtroCurso) q.curso = filtroCurso;
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
      <div className="ped-page-header">
        <h1>Alunos / Jornada</h1>
        <p className="ped-page-sub">Lista operacional de alunos matriculados. Busque, filtre e tome ações em massa.</p>
      </div>

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
                          onClick={async () => {
                            await pedagogico.atualizarStatus(m.id, "Confirmado");
                            await carregar();
                          }}
                          disabled={m.status === "Confirmado"}
                        >
                          Confirmar
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
    </div>
  );
}
