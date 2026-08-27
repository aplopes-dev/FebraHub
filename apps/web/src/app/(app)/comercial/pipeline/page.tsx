"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Kanban,
  List,
  Loader2,
  Plus,
  Search,
  User,
  UserPlus,
} from "lucide-react";
import {
  kanbanOportunidades,
  listarOportunidades,
  listarFunis,
  moverEtapa,
  type ComOportunidade,
  type ComKanbanColuna,
  type ComFunil,
} from "@/services/api/comercial";
import { GuardaPermissao } from "@/components/auth/GuardaPermissao";
import { Select } from "@/components/ui/Select";
import "@/app/comercial.css";

const brl = (v: number | null | undefined) =>
  ((Number(v) || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function tempoDesde(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function estaAtrasado(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

function eHoje(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const hoje = new Date();
  return (
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear()
  );
}

// ---- Card do Kanban ----
function CardOportunidade({
  op,
  onMover,
  movendo,
}: {
  op: ComOportunidade;
  onMover: (id: string) => void;
  movendo: boolean;
}) {
  const atrasado = estaAtrasado(op.proximaAcaoEm) && !eHoje(op.proximaAcaoEm);
  const hoje = eHoje(op.proximaAcaoEm);
  const semAcao = !op.proximaAcaoEm;

  return (
    <div className="com-card">
      <Link
        href={`/comercial/oportunidades/${op.id}`}
        style={{ textDecoration: "none" }}
      >
        <div className="com-card-nome">{op.pessoaNome ?? "—"}</div>
        {op.produtoNome && (
          <div className="com-card-produto">{op.produtoNome}</div>
        )}
        <div className="com-card-valor">
          {brl(op.valorEstimadoCentavos)}
        </div>
      </Link>

      <div className="com-card-footer">
        {/* Badges de alerta */}
        {atrasado && (
          <span className="com-badge-alerta com-badge-alerta--atrasado">
            <AlertTriangle size={10} /> Atrasado
          </span>
        )}
        {hoje && (
          <span className="com-badge-alerta com-badge-alerta--hoje">
            <Clock size={10} /> Hoje
          </span>
        )}
        {semAcao && (
          <span className="com-badge-alerta com-badge-alerta--sem-acao">
            Sem ação
          </span>
        )}

        {/* Tempo desde última interação */}
        {op.ultimaInteracaoEm && (
          <span
            style={{ fontSize: 10.5, color: "var(--faint)", marginLeft: "auto" }}
          >
            {tempoDesde(op.ultimaInteracaoEm)}
          </span>
        )}
      </div>

      {/* Próxima ação */}
      {op.proximaAcaoDescricao && (
        <div
          style={{
            fontSize: 11,
            color: "var(--muted)",
            marginTop: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          📌 {op.proximaAcaoDescricao}
        </div>
      )}

      {/* Botão mover */}
      <button
        className="com-btn"
        style={{ marginTop: 8, width: "100%", justifyContent: "center", fontSize: 11.5, padding: "5px 10px" }}
        onClick={(e) => { e.preventDefault(); onMover(op.id); }}
        disabled={movendo}
      >
        {movendo ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
        Avançar etapa
      </button>
    </div>
  );
}

// ---- View Kanban ----
function ViewKanban({
  funilId,
  busca,
}: {
  funilId: string;
  busca: string;
}) {
  const qc = useQueryClient();

  const { data: colunas = [], isLoading } = useQuery({
    queryKey: ["comercial", "kanban", funilId],
    queryFn: () => kanbanOportunidades(funilId),
    staleTime: 30_000,
    enabled: !!funilId,
  });

  const mover = useMutation({
    mutationFn: ({ id, etapaId }: { id: string; etapaId: string }) =>
      moverEtapa(id, { etapaId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comercial", "kanban"] });
    },
  });

  const colunasFiltered: ComKanbanColuna[] = useMemo(() => {
    if (!busca) return colunas;
    const q = busca.toLowerCase();
    return colunas.map((c) => ({
      ...c,
      oportunidades: c.oportunidades.filter(
        (op) =>
          (op.pessoaNome ?? "").toLowerCase().includes(q) ||
          (op.produtoNome ?? "").toLowerCase().includes(q),
      ),
    }));
  }, [colunas, busca]);

  if (isLoading) {
    return (
      <div className="com-board">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="com-col" style={{ opacity: 0.4, minHeight: 200 }} />
        ))}
      </div>
    );
  }

  if (!colunas.length) {
    return (
      <div className="com-vazio">
        <Kanban className="com-vazio-icone" />
        <div className="com-vazio-titulo">Nenhum funil configurado</div>
        <div className="com-vazio-desc">Configure um funil em Comercial → Configurações.</div>
      </div>
    );
  }

  return (
    <div className="com-board">
      {colunasFiltered.map((col) => {
        // Próxima etapa para "mover"
        const etapas = colunas.map((c) => c.etapa);
        const idx = etapas.findIndex((e) => e.id === col.etapa.id);
        const proxEtapaId = etapas[idx + 1]?.id ?? col.etapa.id;

        return (
          <div key={col.etapa.id} className="com-col">
            <div className="com-col-header">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: col.etapa.cor || "var(--muted)",
                  flexShrink: 0,
                }}
              />
              <span className="com-col-nome">{col.etapa.nome}</span>
              <span className="com-col-qtd">{col.quantidade}</span>
            </div>

            <div className="com-col-total">{brl(col.totalCentavos)}</div>

            {col.oportunidades.map((op) => (
              <CardOportunidade
                key={op.id}
                op={op}
                movendo={mover.isPending && mover.variables?.id === op.id}
                onMover={() =>
                  mover.mutate({ id: op.id, etapaId: proxEtapaId })
                }
              />
            ))}

            {col.oportunidades.length === 0 && (
              <div
                style={{
                  padding: "20px 8px",
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--faint)",
                }}
              >
                Vazia
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---- View Lista ----
function ViewLista({ funil }: { funil: ComFunil }) {
  const funilId = funil.id;
  const [pagina, setPagina] = useState(1);
  const [etapaFiltro, setEtapaFiltro] = useState("");
  const [responsavelFiltro, setResponsavelFiltro] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["comercial", "oportunidades", funilId, pagina, etapaFiltro],
    queryFn: () =>
      listarOportunidades({
        funilId,
        pagina,
        etapaId: etapaFiltro || undefined,
      }),
    staleTime: 30_000,
    enabled: !!funilId,
  });

  // Filtro de responsável por nome (client-side): o endpoint só aceita UUID, mas
  // o usuário quer digitar o nome. Filtramos o que a página já traz.
  const itens = useMemo(() => {
    const base: ComOportunidade[] = data?.itens ?? [];
    const q = responsavelFiltro.trim().toLowerCase();
    if (!q) return base;
    return base.filter((op) => (op.responsavelNome ?? "").toLowerCase().includes(q));
  }, [data?.itens, responsavelFiltro]);
  const total = data?.total ?? 0;
  const totalPaginas = Math.ceil(total / 20);

  if (isLoading) {
    return (
      <div className="com-tabela-wrapper">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 48,
            color: "var(--muted)",
          }}
        >
          <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="com-filtros">
        <Select
          value={etapaFiltro}
          onChange={(v) => { setEtapaFiltro(v); setPagina(1); }}
          aria-label="Filtrar por etapa"
          style={{ minWidth: 180, maxWidth: 220 }}
          options={[
            { value: "", label: "Todas as etapas" },
            ...funil.etapas.map((et) => ({ value: et.id, label: et.nome })),
          ]}
        />
        <input
          className="com-filtro-busca"
          placeholder="Filtrar por responsável (nome)…"
          value={responsavelFiltro}
          onChange={(e) => setResponsavelFiltro(e.target.value)}
          aria-label="Filtrar por responsável"
          style={{ maxWidth: 220 }}
        />
        {(etapaFiltro || responsavelFiltro) && (
          <button
            className="com-btn"
            style={{ padding: "5px 12px", fontSize: 12 }}
            onClick={() => { setEtapaFiltro(""); setResponsavelFiltro(""); setPagina(1); }}
          >
            Limpar
          </button>
        )}
      </div>

      <div className="com-tabela-wrapper">
        {itens.length === 0 ? (
          <div className="com-vazio">
            <List className="com-vazio-icone" />
            <div className="com-vazio-titulo">Nenhuma oportunidade</div>
            <div className="com-vazio-desc">
              Ajuste os filtros ou crie uma nova oportunidade.
            </div>
          </div>
        ) : (
          <table className="com-tabela">
            <thead>
              <tr>
                <th>Pessoa</th>
                <th>Produto</th>
                <th>Etapa</th>
                <th>Responsável</th>
                <th>Valor</th>
                <th>Última Interação</th>
                <th>Próxima Ação</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {itens.map((op) => {
                const atrasado =
                  estaAtrasado(op.proximaAcaoEm) && !eHoje(op.proximaAcaoEm);
                return (
                  <tr key={op.id}>
                    <td style={{ fontWeight: 600 }}>{op.pessoaNome ?? "—"}</td>
                    <td style={{ color: "var(--muted)" }}>{op.produtoNome ?? "—"}</td>
                    <td>
                      <span
                        className="com-badge-etapa"
                        style={{ borderColor: op.etapaCor || "var(--card-line)", color: op.etapaCor || "var(--text)" }}
                      >
                        {op.etapaNome ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <User size={12} color="var(--faint)" />
                        {op.responsavelNome ?? "—"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--gold)" }}>
                      {brl(op.valorEstimadoCentavos)}
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>
                      {tempoDesde(op.ultimaInteracaoEm)}
                    </td>
                    <td>
                      {op.proximaAcaoEm ? (
                        <span
                          style={{
                            fontSize: 12,
                            color: atrasado ? "var(--down)" : "var(--text)",
                            fontWeight: atrasado ? 700 : 400,
                          }}
                        >
                          {atrasado && <AlertTriangle size={11} style={{ display: "inline", marginRight: 3 }} />}
                          {new Date(op.proximaAcaoEm).toLocaleDateString("pt-BR")}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--faint)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "rgb(var(--muted-rgb) / 0.10)",
                          color: "var(--muted)",
                          fontWeight: 600,
                        }}
                      >
                        {op.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/comercial/oportunidades/${op.id}`}
                        style={{ color: "var(--gold)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                      >
                        Abrir →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, justifyContent: "center" }}>
          <button
            className="com-btn"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
            style={{ padding: "5px 12px", fontSize: 12 }}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {pagina} / {totalPaginas}
          </span>
          <button
            className="com-btn"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
            style={{ padding: "5px 12px", fontSize: 12 }}
          >
            Próxima →
          </button>
        </div>
      )}
    </>
  );
}

// ---- Página principal ----
function PipelinePage() {
  const [modo, setModo] = useState<"kanban" | "lista">("kanban");
  const [busca, setBusca] = useState("");
  const [funilId, setFunilId] = useState("");

  const { data: funis = [], isLoading: funisCrregando } = useQuery({
    queryKey: ["comercial", "funis"],
    queryFn: listarFunis,
    staleTime: 300_000,
  });

  // Seleciona o primeiro funil automaticamente
  const funilAtivo = funilId || funis[0]?.id || "";
  const funilObjeto = funis.find((f) => f.id === funilAtivo);

  return (
    <div>
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{ fontSize: 19, fontWeight: 800, color: "var(--bright)", margin: 0, flex: 1 }}
        >
          Pipeline
        </h1>

        {/* Seletor de funil */}
        {funis.length > 1 && (
          <Select
            value={funilAtivo}
            onChange={setFunilId}
            aria-label="Funil"
            style={{ minWidth: 160 }}
            options={funis.map((f) => ({ value: f.id, label: f.nome }))}
          />
        )}

        {/* Toggle Kanban / Lista */}
        <div className="com-toggle">
          <button
            className="com-toggle-btn"
            data-ativo={String(modo === "kanban")}
            onClick={() => setModo("kanban")}
          >
            <Kanban size={14} /> Kanban
          </button>
          <button
            className="com-toggle-btn"
            data-ativo={String(modo === "lista")}
            onClick={() => setModo("lista")}
          >
            <List size={14} /> Lista
          </button>
        </div>

        <Link href="/comercial/leads" className="com-btn">
          <UserPlus size={14} /> Novo lead
        </Link>
        <Link href="/comercial/oportunidades/novo" className="com-btn-ouro">
          <Plus size={14} /> Nova oportunidade
        </Link>
      </div>

      {/* Busca (kanban) */}
      {modo === "kanban" && (
        <div style={{ marginBottom: 14, maxWidth: 340 }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--faint)",
              }}
            />
            <input
              className="com-filtro-busca"
              placeholder="Buscar por pessoa ou produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ paddingLeft: 32, width: "100%" }}
            />
          </div>
        </div>
      )}

      {funisCrregando ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--muted)",
            fontSize: 13,
          }}
        >
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          Carregando funis...
        </div>
      ) : !funilAtivo ? (
        <div className="com-vazio">
          <Kanban className="com-vazio-icone" />
          <div className="com-vazio-titulo">Nenhum funil encontrado</div>
          <div className="com-vazio-desc">Configure um funil para usar o pipeline.</div>
        </div>
      ) : modo === "kanban" ? (
        <ViewKanban funilId={funilAtivo} busca={busca} />
      ) : funilObjeto ? (
        <ViewLista funil={funilObjeto} />
      ) : null}
    </div>
  );
}

export default function PaginaPipeline() {
  return (
    <GuardaPermissao permissoes={["comercial.ver", "comercial.operar", "comercial.gerenciar"]}>
      <PipelinePage />
    </GuardaPermissao>
  );
}
