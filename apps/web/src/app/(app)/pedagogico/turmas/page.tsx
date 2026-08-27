"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, RefreshCw } from "lucide-react";
import { pedagogico, type PedagogicoTurma } from "@/services/api/pedagogico";
import { Select } from "@/components/ui/Select";
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
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params: Record<string, string | number> = { pagina, porPagina: 50 };
      if (busca)             params.busca   = busca;
      if (status !== "Todas") params.status = status;
      const res = await pedagogico.turmas(params);
      setItens(res.itens);
      setTotal(res.total);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar as turmas.");
    }
    finally { setCarregando(false); }
  }, [pagina, busca, status]);

  useEffect(() => { void carregar(); }, [carregar]);

  return (
    <div className="ped-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", gap: "1rem", flexWrap: "wrap" }}>
        <p style={{ color: "var(--muted-foreground)", margin: 0, fontSize: ".85rem", fontWeight: 600 }}>
          {total} turma{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
        </p>
        <Link href="/pedagogico/turmas/novo" className="ped-btn-primario" style={{ padding: ".55rem 1.1rem", borderRadius: ".65rem", textDecoration: "none" }}>
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
        <Select aria-label="Filtrar por status" value={status} onChange={(v) => { setStatus(v); setPagina(1); }} style={{ minWidth: 170 }}
          options={STATUS.map(s => ({ value: s, label: s }))} />
        <button onClick={() => void carregar()} style={{ display: "flex", alignItems: "center", gap: ".4rem", padding: ".5rem .75rem", border: "1px solid var(--border)", borderRadius: ".5rem", background: "transparent", cursor: "pointer", fontSize: ".875rem" }}>
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {carregando ? (
        <div className="ped-loading"><span className="ped-spinner" />Carregando turmas…</div>
      ) : erro ? (
        <div className="ped-empty" style={{ color: "var(--down)" }}>
          {erro}
          <div><button onClick={() => void carregar()} className="ped-btn-outline" style={{ marginTop: ".75rem" }}>Tentar novamente</button></div>
        </div>
      ) : itens.length === 0 ? (
        <div className="ped-empty">
          {busca || status !== "Todas"
            ? "Nenhuma turma para esses filtros. Ajuste a busca ou o status."
            : "Nenhuma turma cadastrada ainda. Crie a primeira em “Nova Turma”."}
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
