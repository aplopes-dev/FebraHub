"use client";

/* ============================================================
   Tabela de empresas — porte fiel do CompanyTable do aplopes-dev/hub
   (@tanstack/react-table): seleção por checkbox, colunas fixas
   (select + Empresa) sobre o scroll horizontal, menu de visibilidade
   de colunas, redimensionamento, ordenação servidor, paginação
   «‹›» + "Por página", cards no mobile. Ordenação inicial:
   faturamento desc.
   ============================================================ */

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  Crosshair,
  Download,
  Eye,
  Globe,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Select } from "@/components/ui/Select";
import { NICHE_MAP, isNicheId } from "@/lib/territorial/nichos";
import {
  REVENUE_RANGE_MAP,
  STATUS_LABELS,
  type Company,
} from "@/lib/territorial/tipos";
import {
  formatBRLCompact,
  formatBRLFull,
  formatDate,
  formatInt,
} from "@/lib/territorial/formato";
import type { EstadoTerritorial } from "@/hooks/territorial";
import { useListaEmpresas } from "@/hooks/territorial";
import { mascararDocumento } from "./exportar";
import { Botao, Popover, Skeleton, StatusPill } from "./ui";

const TAMANHOS_PAGINA = [10, 25, 50, 100];

const ROTULOS_COLUNAS: Record<string, string> = {
  legalName: "Empresa",
  tradeName: "Nome fantasia",
  state: "Estado",
  city: "Cidade",
  niche: "Nicho",
  cnae: "CNAE",
  revenue: "Faturamento",
  revenueRange: "Faixa",
  partners: "Sócios",
  employeeCount: "Funcionários",
  phones: "Telefones",
  emails: "E-mails",
  website: "Website",
  status: "Situação",
  updatedAt: "Atualização",
};

function PilulaNicho({ nicheId }: { nicheId: string }) {
  if (!isNicheId(nicheId)) return <span style={{ color: "var(--ink-faint)" }}>—</span>;
  const def = NICHE_MAP[nicheId];
  const Icone = def.icon;
  return (
    <span className="tio-pill-nicho" style={{ borderColor: `${def.color}99` }}>
      <Icone size={11} aria-hidden />
      <span className="tio-truncar">{def.name}</span>
    </span>
  );
}

export function TabelaEmpresas({
  estado,
  aoCentralizar,
  aoExportarSelecao,
  aoPassarMouse,
}: {
  estado: EstadoTerritorial;
  aoCentralizar: (id: string) => void;
  aoExportarSelecao: (ids: string[], formato: "csv" | "xlsx" | "pdf") => void;
  /** Linha sob o mouse destaca o ponto correspondente no mapa (como no hub). */
  aoPassarMouse: (id: string | null) => void;
}) {
  const { filtros, selecionada, selecionar, limpar } = estado;

  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(25);
  const [ordenacao, setOrdenacao] = useState<SortingState>([{ id: "revenue", desc: true }]);
  const [selecaoLinhas, setSelecaoLinhas] = useState<Record<string, boolean>>({});
  const [visibilidade, setVisibilidade] = useState<VisibilityState>({
    cnae: false,
    revenueRange: false,
    phones: false,
    emails: false,
    website: false,
    updatedAt: false,
  });
  const [menuColunas, setMenuColunas] = useState(false);
  const [menuExportar, setMenuExportar] = useState(false);

  // Filtros mudaram → volta para a primeira página.
  const assinatura = JSON.stringify(filtros);
  const assinaturaRef = useRef("");
  useEffect(() => {
    if (assinaturaRef.current && assinaturaRef.current !== assinatura) setPagina(1);
    assinaturaRef.current = assinatura;
  }, [assinatura]);

  const ordem = ordenacao[0] ?? { id: "revenue", desc: true };
  const lista = useListaEmpresas(filtros, pagina, porPagina, ordem.id, ordem.desc ? "desc" : "asc");
  const { data, isPending, isError, isFetching, refetch } = lista;

  const colunas = useMemo<ColumnDef<Company>[]>(
    () => [
      {
        id: "select",
        size: 36,
        enableResizing: false,
        enableSorting: false,
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Selecionar todas as linhas da página"
            className="tio-caixa"
            checked={table.getIsAllRowsSelected()}
            ref={(el) => {
              if (el) el.indeterminate = table.getIsSomeRowsSelected();
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Selecionar ${row.original.legalName}`}
            className="tio-caixa"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      {
        id: "legalName",
        accessorKey: "legalName",
        size: 230,
        header: "Empresa",
        cell: ({ row }) => (
          <div style={{ minWidth: 0 }}>
            <div className="tio-truncar" style={{ fontWeight: 500, color: "var(--ink)" }}>
              {row.original.legalName}
            </div>
            <div className="tio-truncar" style={{ fontSize: 11, color: "var(--ink-faint)" }}>
              {mascararDocumento(row.original.document, row.original.documentType)}
            </div>
          </div>
        ),
      },
      {
        id: "tradeName",
        accessorKey: "tradeName",
        size: 130,
        header: "Nome fantasia",
        cell: ({ row }) => (
          <span className="tio-truncar" style={{ display: "block" }}>
            {row.original.tradeName || <span style={{ color: "var(--ink-faint)" }}>Não informado</span>}
          </span>
        ),
      },
      { id: "state", accessorKey: "state", size: 66, header: "Estado" },
      { id: "city", accessorKey: "city", size: 140, header: "Cidade" },
      {
        id: "niche",
        accessorKey: "nicheId",
        size: 150,
        header: "Nicho",
        cell: ({ row }) => <PilulaNicho nicheId={row.original.nicheId} />,
      },
      {
        id: "cnae",
        accessorKey: "cnae",
        size: 110,
        header: "CNAE",
        cell: ({ row }) =>
          row.original.cnae ? (
            <span title={row.original.cnaeDescription} className="tio-tabular" style={{ color: "var(--ink-dim)" }}>
              {row.original.cnae}
            </span>
          ) : (
            <span style={{ color: "var(--ink-faint)" }}>Não informado</span>
          ),
      },
      {
        id: "revenue",
        accessorKey: "revenue",
        size: 116,
        header: "Faturamento",
        cell: ({ row }) => (
          <span
            className="tio-tabular"
            style={{ fontWeight: 500, color: "var(--ink)" }}
            title={formatBRLFull(row.original.revenue)}
          >
            {formatBRLCompact(row.original.revenue)}
          </span>
        ),
      },
      {
        id: "revenueRange",
        size: 150,
        header: "Faixa",
        cell: ({ row }) => (
          <span style={{ color: "var(--ink-dim)" }}>
            {REVENUE_RANGE_MAP[row.original.revenueRangeId]?.label ?? "Não informado"}
          </span>
        ),
      },
      {
        id: "partners",
        size: 76,
        header: "Sócios",
        cell: ({ row }) => <span className="tio-tabular">{row.original.partners.length}</span>,
      },
      {
        id: "employeeCount",
        accessorKey: "employeeCount",
        size: 106,
        header: "Funcionários",
        cell: ({ row }) => <span className="tio-tabular">{formatInt(row.original.employeeCount)}</span>,
      },
      {
        id: "phones",
        size: 140,
        enableSorting: false,
        header: "Telefones",
        cell: ({ row }) => {
          const fones = row.original.contacts.filter((c) => c.type === "telefone");
          if (fones.length === 0) return <span style={{ color: "var(--ink-faint)" }}>—</span>;
          return (
            <span className="tio-tabular" style={{ color: "var(--ink-dim)" }}>
              {fones[0].value}
              {fones.length > 1 ? ` +${fones.length - 1}` : ""}
            </span>
          );
        },
      },
      {
        id: "emails",
        size: 190,
        enableSorting: false,
        header: "E-mails",
        cell: ({ row }) => {
          const emails = row.original.contacts.filter((c) => c.type === "email");
          if (emails.length === 0) return <span style={{ color: "var(--ink-faint)" }}>—</span>;
          return (
            <span className="tio-truncar" style={{ display: "block", color: "var(--ink-dim)" }}>
              {emails[0].value}
            </span>
          );
        },
      },
      {
        id: "website",
        size: 80,
        enableSorting: false,
        header: "Website",
        cell: ({ row }) =>
          row.original.website ? (
            <a
              href={row.original.website}
              target="_blank"
              rel="noopener noreferrer"
              className="tio-link"
              onClick={(e) => e.stopPropagation()}
              title={row.original.website ?? undefined}
            >
              <Globe size={12} aria-hidden /> site
            </a>
          ) : (
            <span style={{ color: "var(--ink-faint)" }}>—</span>
          ),
      },
      {
        id: "status",
        accessorKey: "status",
        size: 96,
        header: "Situação",
        cell: ({ row }) => (
          <StatusPill
            status={row.original.status}
            label={STATUS_LABELS[row.original.status] ?? row.original.status}
          />
        ),
      },
      {
        id: "updatedAt",
        accessorKey: "updatedAt",
        size: 104,
        header: "Atualização",
        cell: ({ row }) => (
          <span className="tio-tabular" style={{ color: "var(--ink-dim)" }}>
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        size: 84,
        enableResizing: false,
        enableSorting: false,
        header: () => <span className="tio-sr">Ações</span>,
        cell: ({ row }) => (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              className="tio-tabela-acao"
              aria-label={`Ver detalhes de ${row.original.legalName}`}
              title="Ver detalhes"
              onClick={(e) => {
                e.stopPropagation();
                selecionar(row.original.id);
              }}
            >
              <Eye size={14} />
            </button>
            <button
              type="button"
              className="tio-tabela-acao"
              data-tom="accent"
              aria-label={`Centralizar ${row.original.legalName} no mapa`}
              title="Centralizar no mapa"
              onClick={(e) => {
                e.stopPropagation();
                aoCentralizar(row.original.id);
              }}
            >
              <Crosshair size={14} />
            </button>
          </div>
        ),
      },
    ],
    [selecionar, aoCentralizar],
  );

  const tabela = useReactTable({
    data: data?.data ?? [],
    columns: colunas,
    state: { sorting: ordenacao, columnVisibility: visibilidade, rowSelection: selecaoLinhas },
    onSortingChange: (atualizador) => {
      setPagina(1);
      setOrdenacao(atualizador);
    },
    onColumnVisibilityChange: setVisibilidade,
    onRowSelectionChange: setSelecaoLinhas,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    defaultColumn: { minSize: 50, maxSize: 420 },
  });

  // Linha correspondente ao ponto selecionado no mapa ganha destaque + scroll.
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null);
  useEffect(() => {
    if (!selecionada || !tbodyRef.current) return;
    const el = tbodyRef.current.querySelector<HTMLElement>(`[data-linha-id="${selecionada}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selecionada, data]);

  const idsSelecionados = Object.keys(selecaoLinhas).filter((k) => selecaoLinhas[k]);
  const larguraTotal = tabela.getTotalSize();
  const totalPaginas = data?.pagination.totalPages ?? 1;

  const abrirLinha = (id: string) => {
    selecionar(id);
    aoCentralizar(id);
  };

  return (
    <section className="tio-tabela-bloco tio-glass" aria-label="Tabela de empresas">
      <div className="tio-tabela-topo">
        <h2 className="tio-tabela-titulo tio-display" style={{ margin: 0 }}>
          Empresas
          {data ? <span className="tio-tabela-total">{formatInt(data.pagination.total)} resultados</span> : null}
        </h2>
        {isFetching && !isPending ? (
          <Loader2 size={13} className="tio-girar" style={{ color: "var(--accent-2)" }} aria-label="Atualizando" />
        ) : null}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {idsSelecionados.length > 0 ? (
            <div style={{ position: "relative" }}>
              <Botao aria-expanded={menuExportar} onClick={() => setMenuExportar(!menuExportar)}>
                <Download size={13} aria-hidden />
                Exportar seleção ({idsSelecionados.length})
              </Botao>
              <Popover open={menuExportar} onClose={() => setMenuExportar(false)}>
                <div style={{ display: "grid", gap: 6 }} role="radiogroup" aria-label="Formato de exportação">
                  {(["csv", "xlsx", "pdf"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      className="tio-radio"
                      onClick={() => {
                        setMenuExportar(false);
                        aoExportarSelecao(idsSelecionados, fmt);
                      }}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </Popover>
            </div>
          ) : null}
          <div style={{ position: "relative" }}>
            <Botao variante="fantasma" aria-expanded={menuColunas} onClick={() => setMenuColunas(!menuColunas)}>
              <Columns3 size={14} aria-hidden />
              Colunas
            </Botao>
            <Popover open={menuColunas} onClose={() => setMenuColunas(false)}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px 16px" }}>
                {tabela
                  .getAllLeafColumns()
                  .filter((c) => c.id !== "select" && c.id !== "actions")
                  .map((col) => (
                    <label
                      key={col.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12.5,
                        color: "var(--ink-dim)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <input
                        type="checkbox"
                        className="tio-caixa"
                        checked={col.getIsVisible()}
                        onChange={col.getToggleVisibilityHandler()}
                      />
                      {ROTULOS_COLUNAS[col.id] ?? col.id}
                    </label>
                  ))}
              </div>
            </Popover>
          </div>
        </div>
      </div>

      {/* Tabela (≥ 768px) */}
      <div className="tio-tabela-wrap tio-scroll">
        <table className="tio-tabela" style={{ minWidth: larguraTotal }} aria-rowcount={data?.pagination.total ?? 0}>
          <thead>
            {tabela.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const podeOrdenar = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  const fixa =
                    header.column.id === "select"
                      ? "tio-fixa-select"
                      : header.column.id === "legalName"
                        ? "tio-fixa-nome"
                        : "";
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      style={{ width: header.getSize() }}
                      aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}
                      className={fixa || undefined}
                    >
                      {podeOrdenar ? (
                        <button
                          type="button"
                          className="tio-th-btn"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {dir === "asc" ? (
                            <ArrowUp size={11} aria-hidden />
                          ) : dir === "desc" ? (
                            <ArrowDown size={11} aria-hidden />
                          ) : (
                            <ArrowUpDown size={11} style={{ opacity: 0.4 }} aria-hidden />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                      {header.column.getCanResize() ? (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="tio-redim"
                          aria-hidden
                        />
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody ref={tbodyRef}>
            {isPending ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={tabela.getVisibleLeafColumns().length}>
                    <Skeleton style={{ height: 24, width: "100%" }} />
                  </td>
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td
                  colSpan={tabela.getVisibleLeafColumns().length}
                  style={{ padding: "32px 12px", textAlign: "center", color: "var(--ink-dim)" }}
                >
                  Erro ao carregar empresas.{" "}
                  <button type="button" className="tio-link" style={{ border: "none", background: "none", cursor: "pointer", font: "inherit" }} onClick={() => refetch()}>
                    Tentar novamente
                  </button>
                </td>
              </tr>
            ) : tabela.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={tabela.getVisibleLeafColumns().length}
                  style={{ padding: "40px 12px", textAlign: "center", color: "var(--ink-dim)" }}
                >
                  Nenhuma empresa encontrada com os filtros atuais.{" "}
                  <button type="button" className="tio-link" style={{ border: "none", background: "none", cursor: "pointer", font: "inherit" }} onClick={limpar}>
                    Limpar filtros
                  </button>
                </td>
              </tr>
            ) : (
              tabela.getRowModel().rows.map((row) => {
                const ativa = row.original.id === selecionada;
                return (
                  <tr
                    key={row.id}
                    data-linha-id={row.original.id}
                    tabIndex={0}
                    aria-selected={ativa}
                    onClick={() => abrirLinha(row.original.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        abrirLinha(row.original.id);
                      }
                    }}
                    onMouseEnter={() => aoPassarMouse(row.original.id)}
                    onMouseLeave={() => aoPassarMouse(null)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const fixa =
                        cell.column.id === "select"
                          ? "tio-fixa-select"
                          : cell.column.id === "legalName"
                            ? "tio-fixa-nome"
                            : "";
                      return (
                        <td key={cell.id} style={{ width: cell.column.getSize() }} className={fixa || undefined}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="tio-cards">
        {isPending
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} style={{ height: 74, width: "100%", borderRadius: 12 }} />
            ))
          : tabela.getRowModel().rows.map((row) => {
              const c = row.original;
              const nicho = isNicheId(c.nicheId) ? NICHE_MAP[c.nicheId] : null;
              const Icone = nicho?.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  className="tio-card-empresa"
                  data-ativa={c.id === selecionada ? "1" : undefined}
                  onClick={() => abrirLinha(c.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span className="tio-truncar" style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                      {c.legalName}
                    </span>
                    <StatusPill status={c.status} label={STATUS_LABELS[c.status] ?? c.status} />
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 11.5,
                      color: "var(--ink-dim)",
                    }}
                  >
                    {nicho ? (
                      <span className="tio-pill-nicho" style={{ borderColor: `${nicho.color}99`, fontSize: 11 }}>
                        {Icone ? <Icone size={10} aria-hidden /> : null}
                        {nicho.name}
                      </span>
                    ) : null}
                    <span className="tio-truncar">
                      {c.city} · {c.state}
                    </span>
                    <span className="tio-tabular" style={{ marginLeft: "auto", fontWeight: 500, color: "var(--ink)" }}>
                      {formatBRLCompact(c.revenue)}
                    </span>
                  </div>
                </button>
              );
            })}
      </div>

      {/* Paginação */}
      <div className="tio-paginacao">
        <span>
          Página <span className="tio-tabular" style={{ color: "var(--ink)" }}>{data?.pagination.page ?? pagina}</span>{" "}
          de <span className="tio-tabular" style={{ color: "var(--ink)" }}>{totalPaginas}</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Botao variante="fantasma" disabled={pagina <= 1} onClick={() => setPagina(1)} aria-label="Primeira página">
            «
          </Botao>
          <Botao variante="fantasma" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} aria-label="Página anterior">
            ‹
          </Botao>
          <Botao
            variante="fantasma"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina(pagina + 1)}
            aria-label="Próxima página"
          >
            ›
          </Botao>
          <Botao
            variante="fantasma"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina(totalPaginas)}
            aria-label="Última página"
          >
            »
          </Botao>
        </div>
        <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          Por página
          <Select
            value={String(porPagina)}
            onChange={(v) => { setPorPagina(Number(v)); setPagina(1); }}
            aria-label="Registros por página"
            style={{ minWidth: 72 }}
            options={TAMANHOS_PAGINA.map((s) => ({ value: String(s), label: String(s) }))}
          />
        </label>
      </div>
    </section>
  );
}
