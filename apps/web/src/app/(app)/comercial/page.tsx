"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  DollarSign,
  Percent,
  Plus,
  ShoppingBag,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { dashboard, minhaOperacao } from "@/services/api/comercial";
import { pode, usePerfil, useSessao } from "@/hooks/auth";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import "@/app/comercial.css";

const brl = (v: number | null | undefined) =>
  ((Number(v) || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v: number | null | undefined) => `${(Number(v) || 0).toFixed(1).replace(".", ",")}%`;

function SkeletonKpi() {
  return (
    <div className="com-kpi-card" style={{ minHeight: 72, opacity: 0.5 }}>
      <div
        style={{
          height: 10,
          width: "60%",
          background: "var(--hair)",
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      <div
        style={{
          height: 22,
          width: "80%",
          background: "var(--card-line)",
          borderRadius: 4,
        }}
      />
    </div>
  );
}

function DashboardComercial() {
  const sessao = useSessao();
  const perfil = usePerfil(sessao).data;
  const podeOperar = pode(perfil, "comercial.operar");

  const dash = useQuery({
    queryKey: ["comercial", "dashboard"],
    queryFn: () => dashboard(),
    staleTime: 60_000,
  });

  const operacao = useQuery({
    queryKey: ["comercial", "minha-operacao"],
    queryFn: minhaOperacao,
    enabled: podeOperar,
    staleTime: 30_000,
  });

  const d = dash.data;
  const op = operacao.data;

  const kpis = [
    {
      rotulo: "Leads",
      valor: d ? String(d.leadsNoPeriodo) : "—",
      Icone: Users,
      destaque: false,
    },
    {
      rotulo: "Oportunidades",
      valor: d ? String(d.pipelineTotalOportunidades) : "—",
      Icone: TrendingUp,
      destaque: false,
    },
    {
      rotulo: "Pipeline",
      valor: d ? brl(d.pipelineTotalCentavos) : "—",
      Icone: DollarSign,
      destaque: true,
    },
    {
      rotulo: "Vendas Fechadas",
      valor: d ? String(d.vendasFechadasTotal) : "—",
      Icone: ShoppingBag,
      destaque: false,
    },
    {
      rotulo: "Valor Vendido",
      valor: d ? brl(d.valorVendidoCentavos) : "—",
      Icone: DollarSign,
      destaque: true,
    },
    {
      rotulo: "Conversão",
      valor: d ? pct(d.conversaoPercent) : "—",
      Icone: Percent,
      destaque: false,
    },
  ];

  return (
    <div style={{ padding: "0 2px" }}>
      {/* ---- Cabeçalho ---- */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--bright)",
              margin: 0,
            }}
          >
            Comercial
          </h1>
          <p
            style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}
          >
            Pipeline, leads e vendas em um lugar só
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/comercial/leads" className="com-btn-ouro">
            <Plus size={15} />
            Novo Lead
          </Link>
          <Link href="/comercial/pipeline" className="com-btn">
            <TrendingUp size={14} />
            Ver Pipeline
          </Link>
          <Link href="/comercial/vendas" className="com-btn">
            <ShoppingBag size={14} />
            Vendas
          </Link>
        </div>
      </div>

      {/* ---- KPIs ---- */}
      <div className="com-kpi-grid">
        {dash.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonKpi key={i} />)
          : kpis.map((k) => (
              <div
                key={k.rotulo}
                className={`com-kpi-card${k.destaque ? " com-kpi-card--destaque" : ""}`}
              >
                <div className="com-kpi-rotulo">
                  <k.Icone
                    size={11}
                    style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }}
                  />
                  {k.rotulo}
                </div>
                <div className="com-kpi-valor">{k.valor}</div>
              </div>
            ))}
      </div>

      {/* ---- Alertas rápidos ---- */}
      {d && (d.followUpsAtrasados > 0 || d.semProximaAcao > 0) && (
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {d.followUpsAtrasados > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                background: "rgb(var(--down-rgb) / 0.10)",
                border: "1px solid rgb(var(--down-rgb) / 0.20)",
                fontSize: 13,
                color: "var(--down)",
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={14} />
              {d.followUpsAtrasados} follow-up
              {d.followUpsAtrasados !== 1 ? "s" : ""} atrasado
              {d.followUpsAtrasados !== 1 ? "s" : ""}
            </div>
          )}
          {d.semProximaAcao > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                background: "rgb(var(--muted-rgb) / 0.10)",
                border: "1px solid var(--card-line)",
                fontSize: 13,
                color: "var(--muted)",
                fontWeight: 600,
              }}
            >
              <Clock size={14} />
              {d.semProximaAcao} sem próxima ação
            </div>
          )}
        </div>
      )}

      {/* ---- Minha Operação (somente quem opera) ---- */}
      {podeOperar && (
        <div className="com-secao" style={{ marginBottom: 20 }}>
          <div className="com-secao-titulo">
            <Zap
              size={11}
              style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }}
            />
            Minha Operação
          </div>

          {operacao.isLoading ? (
            <div className="com-operacao-grid">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="com-operacao-card"
                  style={{ opacity: 0.5, minHeight: 64 }}
                />
              ))}
            </div>
          ) : op ? (
            <div className="com-operacao-grid">
              <div className="com-operacao-card">
                <div className="com-operacao-num">{op.leadsNovos}</div>
                <div className="com-operacao-label">Leads Novos</div>
              </div>
              <div className="com-operacao-card">
                <div
                  className={`com-operacao-num${op.hoje > 0 ? " com-operacao-num--warn" : ""}`}
                >
                  {op.hoje}
                </div>
                <div className="com-operacao-label">Ações Hoje</div>
              </div>
              <div className="com-operacao-card">
                <div
                  className={`com-operacao-num${op.atrasadas > 0 ? " com-operacao-num--alerta" : ""}`}
                >
                  {op.atrasadas}
                </div>
                <div className="com-operacao-label">Atrasadas</div>
              </div>
              <div className="com-operacao-card">
                <div className="com-operacao-num">{op.semProximaAcao}</div>
                <div className="com-operacao-label">Sem Ação</div>
              </div>
              <div className="com-operacao-card">
                <div className="com-operacao-num">{op.negociacoes}</div>
                <div className="com-operacao-label">Negociações</div>
              </div>
              <div className="com-operacao-card">
                <div className="com-operacao-num">{op.vendas}</div>
                <div className="com-operacao-label">Vendas</div>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              Nenhum dado disponível.
            </p>
          )}
        </div>
      )}

      {/* ---- Atalhos para o pipeline ---- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <Link
          href="/comercial/pipeline"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderRadius: 14,
            background: "var(--card)",
            border: "1px solid var(--card-line)",
            textDecoration: "none",
            color: "var(--text)",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Pipeline</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Kanban e lista de oportunidades
            </div>
          </div>
          <ArrowRight size={16} color="var(--muted)" />
        </Link>

        <Link
          href="/comercial/oportunidades/novo"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderRadius: 14,
            background: "var(--card)",
            border: "1px solid var(--card-line)",
            textDecoration: "none",
            color: "var(--text)",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Nova Oportunidade</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Registrar manualmente no funil
            </div>
          </div>
          <Plus size={16} color="var(--muted)" />
        </Link>

        <Link
          href="/comercial/vendas"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderRadius: 14,
            background: "var(--card)",
            border: "1px solid var(--card-line)",
            textDecoration: "none",
            color: "var(--text)",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Vendas</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              Lista e status das vendas fechadas
            </div>
          </div>
          <ArrowRight size={16} color="var(--muted)" />
        </Link>
      </div>
    </div>
  );
}

export default function PaginaComercial() {
  return (
    <GuardaPermissao
      permissoes={[
        "comercial.ver",
        "comercial.operar",
        "comercial.gerenciar",
        "comercial.vendas.aprovar",
        "comercial.relatorios",
      ]}
    >
      <DashboardComercial />
    </GuardaPermissao>
  );
}
