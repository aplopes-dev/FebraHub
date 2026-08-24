"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MonitorSmartphone,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import type { LojaDetail } from "../../../types";
import { formatCurrency } from "@/lib/format-currency";

interface OperationalTabProps {
  detail: LojaDetail;
}

// ─── Helpers de formatação ────────────────────────────────────────────────────

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return "—";
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function formatAcceptTime(seconds: number): string {
  if (seconds === 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
  iconBg,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  iconClass?: string;
  iconBg?: string;
}) {
  return (
    <Card className="shadow-none h-full">
      <CardContent className="pt-5 pb-5 h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              iconBg ?? "bg-primary/10",
            )}
          >
            <Icon className={cn("h-4.5 w-4.5", iconClass ?? "text-primary")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="pb-1 pt-5 shrink-0">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">{children}</CardContent>
      {footer && (
        <>
          <Separator />
          <div className="px-6 py-3 shrink-0">{footer}</div>
        </>
      )}
    </Card>
  );
}

// ─── StatusRow ────────────────────────────────────────────────────────────────

function StatusRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// ─── OperationalTab ───────────────────────────────────────────────────────────

export function OperationalTab({ detail }: OperationalTabProps) {
  const { metrics, connectedTerminals, recentErrors, modules, integrations, team, connectionStatus } = detail;

  const activeModules = modules.filter((m) => m.enabled).length;
  const activeIntegrations = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="flex flex-col gap-3">

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={TrendingUp}
          label="Faturamento Hoje"
          value={metrics.revenueTodayCents > 0 ? formatCurrency(metrics.revenueTodayCents) : "—"}
          sub={metrics.ordersThisMonth > 0 ? `${metrics.ordersThisMonth} pedidos este mês` : undefined}
          iconBg="bg-emerald-500/10"
          iconClass="text-emerald-600"
        />
        <KpiCard
          icon={ShoppingBag}
          label="Pedidos Hoje"
          value={String(metrics.ordersToday)}
          sub={metrics.lastOrderAt ? `Último ${formatRelativeTime(metrics.lastOrderAt)}` : undefined}
          iconBg="bg-blue-500/10"
          iconClass="text-blue-600"
        />
        <KpiCard
          icon={Wallet}
          label="Ticket Médio"
          value={metrics.averageTicketCents > 0 ? formatCurrency(metrics.averageTicketCents) : "—"}
          iconBg="bg-violet-500/10"
          iconClass="text-violet-600"
        />
        <KpiCard
          icon={Clock}
          label="Tempo de Aceite"
          value={formatAcceptTime(metrics.averageAcceptTimeSeconds)}
          sub="média do dia"
          iconBg="bg-amber-500/10"
          iconClass="text-amber-600"
        />
      </div>

      {/* Saúde + Terminais + Alertas */}
      <div className="grid gap-3 lg:grid-cols-3">

        <SectionCard title="Saúde Operacional">
          <div className="divide-y">
            <StatusRow
              icon={connectionStatus === "online" ? Wifi : WifiOff}
              label="Status do PDV"
              value={
                connectionStatus === "online" ? (
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    Offline
                  </span>
                )
              }
            />
            <StatusRow
              icon={Clock}
              label="Último acesso"
              value={formatRelativeTime(metrics.lastAccessAt)}
            />
            <StatusRow
              icon={ShoppingBag}
              label="Último pedido"
              value={formatRelativeTime(metrics.lastOrderAt)}
            />
            <StatusRow
              icon={Zap}
              label="Módulos ativos"
              value={
                <Badge variant="secondary" className="text-xs font-medium">
                  {activeModules} de {modules.length}
                </Badge>
              }
            />
            <StatusRow
              icon={Package}
              label="Integrações"
              value={
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs font-medium",
                    activeIntegrations > 0 && "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {activeIntegrations} ativas
                </Badge>
              }
            />
            <StatusRow
              icon={Users}
              label="Equipe"
              value={`${team.length} ${team.length === 1 ? "membro" : "membros"}`}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Terminais"
          footer={
            connectedTerminals.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {connectedTerminals.filter((t) => t.status === "online").length} de{" "}
                {connectedTerminals.length} terminal
                {connectedTerminals.length !== 1 ? "is" : ""} online
              </p>
            ) : undefined
          }
        >
          {connectedTerminals.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <MonitorSmartphone className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum terminal conectado.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {connectedTerminals.map((terminal) => (
                <li key={terminal.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                    {terminal.label}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      terminal.status === "online"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-muted bg-muted/50 text-muted-foreground",
                    )}
                  >
                    {terminal.status === "online" ? "Online" : "Offline"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Alertas Recentes">
          {recentErrors.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
              <p className="text-sm text-muted-foreground">Nenhum alerta ativo.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {recentErrors.map((err) => (
                <li key={err.id} className="py-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        err.severity === "error" ? "text-destructive" : "text-amber-500",
                      )}
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm leading-snug">{err.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(err.occurredAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-xs",
                        err.severity === "error"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-amber-200 bg-amber-50 text-amber-700",
                      )}
                    >
                      {err.severity === "error" ? "Erro" : "Aviso"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
