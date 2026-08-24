"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SimplePage } from "@/components/simple-page";
import { fetchAudit } from "@/lib/admin-api";
import { Input, Button, Badge } from "@citybox/ui/atoms";
import { Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

interface AuditEvent {
  id: string;
  storeId: string | null;
  storeName: string | null;
  occurredAt: string;
  severity: "info" | "warning" | "error" | "critical";
  actor: string;
  actorRole: string | null;
  module: string;
  action: string;
  details: string | null;
  createdAt: string;
}

interface AuditResponse {
  data: AuditEvent[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

const SEVERITY_BADGE: Record<string, string> = {
  info: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-700",
  error: "border-destructive/25 bg-destructive/10 text-destructive",
  critical: "border-red-600 bg-red-600/10 text-red-700 font-bold",
};

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [apiSearch, setApiSearch] = useState("");

  // Debounce search input (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setApiSearch(search.trim());
      setPage(1); // Reset to first page on search
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Query audit logs
  const { data, isLoading, error } = useQuery<AuditResponse>({
    queryKey: ["audit-logs", page, apiSearch],
    queryFn: () =>
      fetchAudit({
        page,
        perPage: 15,
        search: apiSearch || undefined,
      }) as Promise<AuditResponse>,
  });

  const auditEvents = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, perPage: 15, totalPages: 1 };

  return (
    <SimplePage
      title="Equipe & Auditoria"
      description="Trilha de logs global e histórico de ações críticas realizadas na plataforma."
    >
      <div className="flex flex-col gap-4">
        {/* Filtros e Busca */}
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground/45" />
            <Input
              placeholder="Buscar por ator, ação ou detalhes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-border/50 bg-background shadow-none"
            />
          </div>
          <div className="text-xs text-foreground/50">
            Total: <span className="font-semibold text-foreground">{meta.total}</span> eventos
          </div>
        </div>

        {/* Tabela de logs */}
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm">
          {isLoading ? (
            <div className="divide-y divide-border/40">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse bg-muted/20" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="font-semibold">Erro ao carregar auditoria</p>
              <p className="text-sm text-foreground/50">Tente atualizar a página ou entrar em contato.</p>
            </div>
          ) : auditEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertCircle className="h-8 w-8 text-foreground/25" />
              <div>
                <p className="font-medium text-foreground/70">Nenhum evento encontrado</p>
                <p className="mt-1 text-sm text-foreground/45">Tente alterar o termo de busca.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30 text-xs font-semibold uppercase tracking-wider text-foreground/55">
                    <th className="px-4 py-3">Quando</th>
                    <th className="px-4 py-3">Ator</th>
                    <th className="px-4 py-3">Módulo</th>
                    <th className="px-4 py-3">Ação</th>
                    <th className="px-4 py-3">Loja</th>
                    <th className="px-4 py-3">Detalhes</th>
                    <th className="px-4 py-3 text-center">Grau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {auditEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="transition-colors hover:bg-[color-mix(in_oklch,var(--orbitly-lime)_3%,white)]"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-foreground/60 tabular-nums">
                        {new Date(event.occurredAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--orbitly-ink)]">
                        <div>
                          {event.actor}
                          {event.actorRole && (
                            <span className="ml-1 text-[10px] text-foreground/40 font-normal">
                              ({event.actorRole === "platform_admin" ? "Admin" : "Operador"})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/75 font-medium">
                          {event.module}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-xs text-[var(--orbitly-ink)]">
                        {event.action}
                      </td>
                      <td className="px-4 py-3 text-foreground/70 truncate max-w-[120px]">
                        {event.storeName || "—"}
                      </td>
                      <td className="px-4 py-3 text-foreground/65 break-all max-w-xs">
                        {event.details || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-semibold ${SEVERITY_BADGE[event.severity] ?? "border-border text-foreground"}`}
                        >
                          {event.severity}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginação */}
        {!isLoading && !error && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/20 pt-4">
            <span className="text-xs text-foreground/50">
              Página <span className="font-semibold text-foreground">{meta.page}</span> de{" "}
              <span className="font-semibold text-foreground">{meta.totalPages}</span>
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 rounded-lg px-2 border-border/50 bg-background"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="h-8 rounded-lg px-2 border-border/50 bg-background"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </SimplePage>
  );
}
