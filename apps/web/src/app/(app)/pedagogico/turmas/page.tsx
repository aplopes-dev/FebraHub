"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw } from "lucide-react";
import { pedagogico, type PedagogicoTurma } from "@/services/api/pedagogico";
import "@/app/pedagogico.css";

const STATUS = [
  "Todas", "Planejada", "Aguardando Validação", "Confirmada",
  "Em Preparação", "Em Andamento", "Finalizada", "Cancelada",
];

function statusClass(s: string) {
  const m: Record<string, string> = {
    "Planejada": "planejada", "Confirmada": "ok", "Finalizada": "finalizada",
    "Em Andamento": "em-andamento", "Em Preparação": "em-preparacao",
    "Aguardando Validação": "aguardando", "Cancelada": "cancelado",
  };
  return m[s] ?? "";
}

export default function TurmasPage() {
  const [itens, setItens]         = useState<PedagogicoTurma[]>([]);
  const [total, setTotal]         = useState(0);
  const [pagina, setPagina]       = useState(1);
  const [busca, setBusca]         = useState("");
  const [status, setStatus]       = useState("Todas");
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const params: Record<string, string | number> = { pagina, porPagina: 50 };
      if (busca)             params.busca   = busca;
      if (status !== "Todas") params.status = status;
      const res = await pedagogico.turmas(params);
      setItens(res.itens);
      setTotal(res.total);
    } catch { /* silencioso */ }
    finally { setCarregando(false); }
  }, [pagina, busca, status]);

  useEffect(() => { void carregar(); }, [carregar]);

  return (
    <div className="ped-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Agenda e Turmas</h1>
          <p style={{ color: "var(--muted-foreground)", margin: ".25rem 0 0", fontSize: ".875rem" }}>
            {total} turma{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/pedagogico/turmas/novo"
          style={{ display: "flex", alignItems: "center", gap: ".4rem", padding: ".5rem 1.25rem", background: "#4f46e5", color: "#fff", border: "none", borderRadius: ".75rem", textDecoration: "none", fontWeight: 600, fontSize: ".875rem" }}>
          <Plus size={15} /> Nova Turma
        </Link>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={15} style={{ position: "absolute", left: ".75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
          <input
            placeholder="Buscar turma, curso, treinador…"
            value={busca}
            onChange={e => { setBusca(e.target.value); setPagina(1); }}
            style={{ width: "100%", paddingLeft: "2.25rem", padding: ".5rem .75rem .5rem 2.25rem", border: "1px solid var(--border)", borderRadius: ".5rem", fontSize: ".875rem", outline: "none" }}
          />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPagina(1); }}
          style={{ padding: ".5rem .75rem", border: "1px solid var(--border)", borderRadius: ".5rem", fontSize: ".875rem", background: "var(--background)", cursor: "pointer" }}>
          {STATUS.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={() => void carregar()} style={{ display: "flex", alignItems: "center", gap: ".4rem", padding: ".5rem .75rem", border: "1px solid var(--border)", borderRadius: ".5rem", background: "transparent", cursor: "pointer", fontSize: ".875rem" }}>
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {carregando ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>Carregando…</div>
      ) : itens.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)", border: "1px dashed var(--border)", borderRadius: ".75rem" }}>
          Nenhuma turma encontrada
        </div>
      ) : (
        <div className="ped-turmas-grid">
          {itens.map(t => (
            <Link key={t.id} href={`/pedagogico/turmas/${t.id}`} className="ped-turma-card">
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="ped-turma-nome">{t.nome}</div>
                  <span className={`ped-badge ${statusClass(t.status)}`}>{t.status}</span>
                </div>
                <div style={{ fontSize: ".82rem", color: "var(--muted-foreground)", marginTop: ".25rem" }}>{t.cursoNome}</div>
              </div>
              <div className="ped-turma-meta">
                {t.unidade && <span>📍 {t.unidade}</span>}
                {t.dataInicio && <span>📅 {new Date(t.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                {t.dataFim && <span>→ {new Date(t.dataFim + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                {t.treinador && <span>👤 {t.treinador}</span>}
              </div>
              <div className="ped-turma-indicadores">
                <span><strong>{t.matriculados ?? 0}</strong>alunos</span>
                <span><strong>{t.confirmados ?? 0}</strong>confirm.</span>
                <span><strong>{t.credenciados ?? 0}</strong>cred.</span>
                {t.capacidade && <span><strong>{t.capacidade}</strong>vagas</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Paginação simples */}
      {total > 50 && (
        <div style={{ display: "flex", gap: ".5rem", justifyContent: "center", marginTop: "1.5rem" }}>
          <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}
            style={{ padding: ".4rem .75rem", border: "1px solid var(--border)", borderRadius: ".5rem", cursor: pagina === 1 ? "not-allowed" : "pointer", background: "transparent" }}>
            ← Anterior
          </button>
          <span style={{ padding: ".4rem .75rem", fontSize: ".875rem" }}>Pág. {pagina}</span>
          <button disabled={itens.length < 50} onClick={() => setPagina(p => p + 1)}
            style={{ padding: ".4rem .75rem", border: "1px solid var(--border)", borderRadius: ".5rem", cursor: itens.length < 50 ? "not-allowed" : "pointer", background: "transparent" }}>
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
