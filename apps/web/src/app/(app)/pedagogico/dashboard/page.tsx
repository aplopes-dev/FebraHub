"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, GraduationCap, CheckCircle, Clock, AlertTriangle,
  TrendingUp, Calendar, UserX, RefreshCw, FileQuestion,
} from "lucide-react";
import { pedagogico, type PedagogicoDashboard } from "@/services/api/pedagogico";
import "@/app/pedagogico.css";

function KpiCard({
  valor, label, variante = "",
}: { valor: number | string; label: string; variante?: string }) {
  return (
    <div className={`ped-kpi ${variante}`}>
      <span className="ped-kpi-valor">{valor}</span>
      <span className="ped-kpi-label">{label}</span>
    </div>
  );
}

function BadgeAtencao({
  n, label, href, variante = "",
}: { n: number; label: string; href: string; variante?: string }) {
  if (!n) return null;
  return (
    <Link href={href} className={`ped-atencao-item ${variante}`}>
      <AlertTriangle size={14} />
      {n} {label}
    </Link>
  );
}

export default function DashboardPedagogicoPage() {
  const [dados, setDados] = useState<PedagogicoDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtros] = useState<Record<string, string>>({});

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await pedagogico.dashboard(filtros);
      setDados(res);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar dashboard");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  if (carregando) {
    return (
      <div className="ped-page">
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted-foreground)" }}>
          <RefreshCw size={32} style={{ animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          Carregando dashboard…
        </div>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div className="ped-page">
        <div style={{ padding: "2rem", color: "#dc2626" }}>
          {erro ?? "Não foi possível carregar os dados."}
          <button onClick={() => void carregar()} style={{ marginLeft: "1rem", cursor: "pointer" }}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const { cards, taxas, exigeAtencao, turmasProximas } = dados;

  return (
    <div className="ped-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Dashboard Pedagógico</h1>
          <p style={{ color: "var(--muted-foreground)", margin: ".25rem 0 0", fontSize: ".875rem" }}>
            Visão operacional da Secretaria Digital do Aluno
          </p>
        </div>
        <button onClick={() => void carregar()}
          style={{ display: "flex", alignItems: "center", gap: ".4rem", padding: ".5rem 1rem", borderRadius: ".5rem", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontSize: ".875rem" }}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Alertas de atenção (topo, em destaque) */}
      {(exigeAtencao.naoResponderam > 0 || exigeAtencao.aguardandoContato > 0 || exigeAtencao.represadosVencendo > 0 || exigeAtencao.solicitacoesAbertas > 0) && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: ".78rem", fontWeight: 600, color: "#b91c1c", marginBottom: ".5rem", textTransform: "uppercase", letterSpacing: ".04em" }}>
            Exige ação agora
          </p>
          <div className="ped-atencao">
            <BadgeAtencao n={exigeAtencao.naoResponderam}    label="não responderam"       href="/pedagogico/alunos?status=N%C3%A3o+Respondeu" />
            <BadgeAtencao n={exigeAtencao.aguardandoContato} label="aguardando contato"    href="/pedagogico/alunos?status=Aguardando+Contato" />
            <BadgeAtencao n={exigeAtencao.represadosVencendo} label="represados vencendo"  href="/pedagogico/cs?aba=represados" />
            <BadgeAtencao n={exigeAtencao.solicitacoesAbertas} label="solicitações abertas" href="/pedagogico/solicitacoes" variante="aviso" />
          </div>
        </div>
      )}

      {/* KPIs principais */}
      <div className="ped-kpis">
        <KpiCard valor={cards.totalTurmas}       label="Turmas"              />
        <KpiCard valor={cards.matriculados}       label="Matriculados"        />
        <KpiCard valor={cards.confirmados}        label="Confirmados"         variante="ok" />
        <KpiCard valor={cards.aguardandoContato}  label="Aguardando contato"  variante={cards.aguardandoContato > 0 ? "aviso" : ""} />
        <KpiCard valor={cards.aguardandoResposta} label="Aguardando resposta" variante={cards.aguardandoResposta > 0 ? "aviso" : ""} />
        <KpiCard valor={cards.naoResponderam}     label="Não responderam"     variante={cards.naoResponderam > 0 ? "alerta" : ""} />
        <KpiCard valor={cards.presentes}          label="Presentes"           variante="ok" />
        <KpiCard valor={cards.faltantes}          label="Faltantes"           variante={cards.faltantes > 0 ? "alerta" : ""} />
        <KpiCard valor={cards.represados}         label="Represados"          variante={cards.represados > 0 ? "aviso" : ""} />
        <KpiCard valor={cards.represadosVencendo} label="Vencendo (60d)"      variante={cards.represadosVencendo > 0 ? "alerta" : ""} />
        <KpiCard valor={cards.transferidos}       label="Transferidos"        />
        <KpiCard valor={cards.solicitacoesAbertas} label="Solicitações abertas" variante={cards.solicitacoesAbertas > 0 ? "aviso" : ""} />
      </div>

      {/* Taxas */}
      {(taxas.confirmacao || taxas.comparecimentoSobreConfirmados) && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {taxas.confirmacao && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: ".75rem", padding: "1rem 1.5rem" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{taxas.confirmacao}%</div>
              <div style={{ fontSize: ".75rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: ".04em" }}>Taxa de confirmação</div>
            </div>
          )}
          {taxas.comparecimentoSobreConfirmados && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: ".75rem", padding: "1rem 1.5rem" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{taxas.comparecimentoSobreConfirmados}%</div>
              <div style={{ fontSize: ".75rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: ".04em" }}>Presença / confirmados</div>
            </div>
          )}
          {taxas.comparecimentoSobreVendidos && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: ".75rem", padding: "1rem 1.5rem" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{taxas.comparecimentoSobreVendidos}%</div>
              <div style={{ fontSize: ".75rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: ".04em" }}>Presença / matriculados</div>
            </div>
          )}
        </div>
      )}

      {/* Turmas próximas */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: ".5rem" }}>
            <Calendar size={16} /> Turmas próximas (30 dias)
          </h2>
          <Link href="/pedagogico/turmas" style={{ fontSize: ".82rem", color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
            Ver todas →
          </Link>
        </div>

        {turmasProximas.length === 0 ? (
          <div style={{ color: "var(--muted-foreground)", padding: "2rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: ".75rem" }}>
            Nenhuma turma nos próximos 30 dias
          </div>
        ) : (
          <div className="ped-turmas-grid">
            {turmasProximas.map(t => (
              <Link key={t.id} href={`/pedagogico/turmas/${t.id}`} className="ped-turma-card">
                <div>
                  <div className="ped-turma-nome">{t.nome}</div>
                  <div className="ped-turma-meta">
                    {t.unidade && <span>📍 {t.unidade}</span>}
                    {t.dataInicio && <span>📅 {new Date(t.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
                    <span className={`ped-badge ${t.status.toLowerCase().replace(' ', '-').replace('ã', 'a').replace('ç', 'c')}`}>{t.status}</span>
                  </div>
                </div>
                <div className="ped-turma-indicadores">
                  <span><strong>{t.matriculados}</strong>matrículas</span>
                  <span><strong>{t.credenciados}</strong>credenciados</span>
                  {t.capacidade && <span><strong>{t.capacidade}</strong>vagas</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Atalhos rápidos */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem" }}>
        {[
          { label: "Nova Turma",       href: "/pedagogico/turmas/novo",    icon: <GraduationCap size={15} /> },
          { label: "Credenciamento",   href: "/pedagogico/credenciamento", icon: <CheckCircle size={15} /> },
          { label: "Represados",       href: "/pedagogico/cs?aba=represados", icon: <UserX size={15} /> },
          { label: "Solicitações",     href: "/pedagogico/solicitacoes",   icon: <FileQuestion size={15} /> },
          { label: "Customer Success", href: "/pedagogico/cs",             icon: <Users size={15} /> },
          { label: "Transferências",   href: "/pedagogico/transferencias", icon: <RefreshCw size={15} /> },
        ].map(a => (
          <Link key={a.href} href={a.href}
            style={{ display: "flex", alignItems: "center", gap: ".4rem", padding: ".5rem 1rem", background: "var(--card)", border: "1px solid var(--border)", borderRadius: ".5rem", textDecoration: "none", color: "var(--foreground)", fontSize: ".875rem", fontWeight: 500, transition: "border-color .15s" }}>
            {a.icon} {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
