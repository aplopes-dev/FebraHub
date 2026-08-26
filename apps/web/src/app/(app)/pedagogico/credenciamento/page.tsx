"use client";

import { useCallback, useRef, useState } from "react";
import { Search, CheckCircle, XCircle, Loader2, QrCode } from "lucide-react";
import { pedagogico, type ResultadoBuscaCredenciamento } from "@/services/api/pedagogico";
import "@/app/pedagogico.css";

function BadgeStatus({ credenciado }: { credenciado: boolean }) {
  return credenciado
    ? <span className="ped-badge credenciado" style={{ display: "flex", alignItems: "center", gap: ".35rem" }}><CheckCircle size={13} /> Credenciado</span>
    : <span className="ped-badge matriculado">Aguardando credenciamento</span>;
}

export default function CredenciamentoPage() {
  const [busca, setBusca]         = useState("");
  const [turmaId, setTurmaId]     = useState("");
  const [resultado, setResultado] = useState<ResultadoBuscaCredenciamento[]>([]);
  const [buscando, setBuscando]   = useState(false);
  const [credenciando, setCredenciando] = useState<string | null>(null);
  const [sucesso, setSucesso]     = useState<string | null>(null);
  const [erroMsg, setErroMsg]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const buscarAluno = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResultado([]); return; }
    setBuscando(true);
    setErroMsg(null);
    try {
      const res = await pedagogico.buscarParaCredenciar(q.trim(), turmaId || undefined);
      setResultado(res);
    } catch (e: unknown) {
      setErroMsg(e instanceof Error ? e.message : "Erro na busca");
    } finally {
      setBuscando(false);
    }
  }, [turmaId]);

  const handleBusca = (v: string) => {
    setBusca(v);
    void buscarAluno(v);
  };

  const credenciar = async (aluno: ResultadoBuscaCredenciamento) => {
    if (aluno.credenciado) return;
    if (!aluno.turmaId && !turmaId) {
      setErroMsg("Selecione a turma antes de credenciar.");
      return;
    }
    setCredenciando(aluno.matriculaId);
    setSucesso(null);
    setErroMsg(null);
    try {
      await pedagogico.credenciar(aluno.turmaId ?? turmaId, {
        identificador: aluno.matriculaId,
        tipo: "credenciamento",
      });
      setSucesso(`✅ ${aluno.pessoaNome ?? "Aluno"} credenciado com sucesso!`);
      // Atualizar lista
      setResultado(ant => ant.map(a => a.matriculaId === aluno.matriculaId
        ? { ...a, credenciado: true, credenciadoEm: new Date().toISOString() }
        : a
      ));
      // Limpar busca após 3s para próximo aluno
      setTimeout(() => {
        setBusca("");
        setResultado([]);
        setSucesso(null);
        inputRef.current?.focus();
      }, 3000);
    } catch (e: unknown) {
      setErroMsg(e instanceof Error ? e.message : "Erro ao credenciar");
    } finally {
      setCredenciando(null);
    }
  };

  return (
    <div className="ped-page" style={{ maxWidth: "700px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 .25rem" }}>
          <CheckCircle size={22} style={{ display: "inline", marginRight: ".5rem", verticalAlign: "middle", color: "var(--gold)" }} />
          Credenciamento
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: ".875rem", margin: 0 }}>
          Busque por nome, CPF, QR Code ou UUID da matrícula
        </p>
      </div>

      {/* Filtro de turma (opcional) */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: ".25rem", display: "block" }}>
          Filtrar por turma (opcional)
        </label>
        <input
          placeholder="ID ou nome da turma"
          value={turmaId}
          onChange={e => setTurmaId(e.target.value)}
          style={{ width: "100%", padding: ".5rem .75rem", border: "1px solid var(--border)", borderRadius: ".5rem", fontSize: ".875rem", outline: "none" }}
        />
      </div>

      {/* Campo de busca principal */}
      <div className="ped-check-busca">
        <div style={{ position: "relative", flex: 1 }}>
          {buscando
            ? <Loader2 size={18} style={{ position: "absolute", left: ".75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", animation: "spin 1s linear infinite" }} />
            : <Search size={18} style={{ position: "absolute", left: ".75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
          }
          <input
            ref={inputRef}
            placeholder="Nome, CPF, QR Code…"
            value={busca}
            onChange={e => handleBusca(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && resultado.length === 1) void credenciar(resultado[0]!); }}
            autoFocus
            style={{ width: "100%", paddingLeft: "2.5rem", padding: ".7rem 1rem .7rem 2.5rem", border: "2px solid var(--border)", borderRadius: ".75rem", fontSize: "1.05rem", outline: "none" }}
          />
        </div>
        <button
          onClick={() => void buscarAluno(busca)}
          className="ped-btn-primario"
          style={{ padding: ".7rem 1.25rem", borderRadius: ".75rem" }}>
          Buscar
        </button>
      </div>

      {/* Sucesso */}
      {sucesso && (
        <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: ".75rem", padding: "1rem 1.25rem", marginBottom: "1rem", color: "#15803d", fontWeight: 600 }}>
          {sucesso}
        </div>
      )}

      {/* Erro */}
      {erroMsg && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: ".75rem", padding: "1rem 1.25rem", marginBottom: "1rem", color: "#b91c1c" }}>
          {erroMsg}
        </div>
      )}

      {/* Resultados */}
      {resultado.length === 0 && busca.length >= 2 && !buscando && (
        <div style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "2rem", border: "1px dashed var(--border)", borderRadius: ".75rem" }}>
          <XCircle size={24} style={{ marginBottom: ".5rem", opacity: .5 }} />
          <div>Nenhum aluno encontrado para &ldquo;{busca}&rdquo;</div>
        </div>
      )}

      {resultado.map(aluno => (
        <div key={aluno.matriculaId} className={`ped-check-card ${aluno.credenciado ? "credenciado" : ""}`}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="ped-check-nome">{aluno.pessoaNome ?? "—"}</div>
              <div className="ped-check-info">
                {aluno.pessoaCpf && <span>CPF: {aluno.pessoaCpf} &nbsp;</span>}
                {aluno.pessoaTelefone && <span>📱 {aluno.pessoaTelefone}</span>}
              </div>
            </div>
            <BadgeStatus credenciado={aluno.credenciado} />
          </div>

          <div style={{ fontSize: ".875rem", color: "var(--muted-foreground)" }}>
            <div><strong>Curso:</strong> {aluno.cursoNome ?? "—"}</div>
            {aluno.turmaNome && <div><strong>Turma:</strong> {aluno.turmaNome}</div>}
            {aluno.credenciadoEm && (
              <div><strong>Credenciado em:</strong> {new Date(aluno.credenciadoEm).toLocaleString("pt-BR")}</div>
            )}
          </div>

          {aluno.tokenQr && (
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".78rem", color: "var(--muted-foreground)" }}>
              <QrCode size={14} /> Token QR: <code style={{ background: "var(--muted)", padding: ".1rem .35rem", borderRadius: ".25rem" }}>{aluno.tokenQr}</code>
            </div>
          )}

          <button
            className={`ped-check-btn ${aluno.credenciado ? "ok" : ""}`}
            disabled={aluno.credenciado || credenciando === aluno.matriculaId}
            onClick={() => void credenciar(aluno)}>
            {credenciando === aluno.matriculaId
              ? "Credenciando…"
              : aluno.credenciado
              ? "✅ Já credenciado"
              : "CREDENCIAR"}
          </button>
        </div>
      ))}
    </div>
  );
}
