"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Select } from "@/components/ui/Select";

export type { ColumnDef } from "@tanstack/react-table";

/**
 * TabelaDados — tabela paginada padrão do FebraHub, sobre @tanstack/react-table.
 *
 * Resolve o problema das "tabelas gigantes que tomam a página inteira": recebe
 * a lista COMPLETA (client-side) e cuida de paginação + ordenação sozinha, sem
 * cada tela reimplementar `slice`/pager na mão. Segue a identidade Febracis
 * (classes `.fh-tab*` em globals.css, tokens de tema claro/escuro).
 *
 * Para paginação no SERVIDOR (listas enormes), prefira `PaginaCrud`/`TabelaCrud`,
 * que já falam com o backend paginado. Esta aqui é para telas que já carregam a
 * lista toda e só precisam não estourar verticalmente.
 *
 * Uso:
 *   const colunas: ColumnDef<Aluno>[] = [
 *     { accessorKey: "nome", header: "Aluno" },
 *     { accessorKey: "curso", header: "Curso", cell: (c) => c.getValue() ?? "—" },
 *   ];
 *   <TabelaDados dados={alunos} colunas={colunas} />
 */
export function TabelaDados<T>({
  dados,
  colunas,
  porPaginaInicial = 20,
  tamanhosPagina = [10, 20, 50, 100],
  vazio = "Nenhum registro.",
  ordenacaoInicial,
  aoClicarLinha,
  chaveLinha,
  className,
}: {
  dados: T[];
  colunas: ColumnDef<T>[];
  porPaginaInicial?: number;
  tamanhosPagina?: number[];
  vazio?: ReactNode;
  ordenacaoInicial?: SortingState;
  aoClicarLinha?: (linha: T) => void;
  chaveLinha?: (linha: T) => string | number;
  className?: string;
}) {
  const [ordenacao, setOrdenacao] = useState<SortingState>(ordenacaoInicial ?? []);
  const [paginacao, setPaginacao] = useState({ pageIndex: 0, pageSize: porPaginaInicial });

  const tabela = useReactTable({
    data: dados,
    columns: colunas,
    state: { sorting: ordenacao, pagination: paginacao },
    onSortingChange: setOrdenacao,
    onPaginationChange: setPaginacao,
    getRowId: chaveLinha ? (linha) => String(chaveLinha(linha)) : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const total = dados.length;
  const totalPaginas = Math.max(1, tabela.getPageCount());
  const paginaAtual = paginacao.pageIndex + 1;
  const primeiraNaPagina = total === 0 ? 0 : paginacao.pageIndex * paginacao.pageSize + 1;
  const ultimaNaPagina = Math.min(total, paginaAtual * paginacao.pageSize);

  const opcoesTamanho = useMemo(
    () => tamanhosPagina.map((s) => ({ value: String(s), label: `${s} / pág.` })),
    [tamanhosPagina],
  );

  return (
    <div className={`fh-tabd${className ? ` ${className}` : ""}`}>
      <div className="fh-tabd-wrap">
        <table className="fh-tabd-table">
          <thead>
            {tabela.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const podeOrdenar = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}
                    >
                      {header.isPlaceholder ? null : podeOrdenar ? (
                        <button type="button" className="fh-tabd-th-btn" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {dir === "asc" ? <ArrowUp size={11} /> : dir === "desc" ? <ArrowDown size={11} /> : <ArrowUpDown size={11} style={{ opacity: 0.4 }} />}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {tabela.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={tabela.getVisibleLeafColumns().length} className="fh-tabd-vazio">{vazio}</td>
              </tr>
            ) : (
              tabela.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={aoClicarLinha ? () => aoClicarLinha(row.original) : undefined}
                  style={aoClicarLinha ? { cursor: "pointer" } : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > tamanhosPagina[0] && (
        <div className="fh-tabd-rodape">
          <span className="fh-tabd-contagem">
            {primeiraNaPagina}–{ultimaNaPagina} de {total}
          </span>
          <div className="fh-tabd-pager">
            <button type="button" className="fh-tabd-pg" disabled={!tabela.getCanPreviousPage()} onClick={() => tabela.setPageIndex(0)} aria-label="Primeira página"><ChevronsLeft size={15} /></button>
            <button type="button" className="fh-tabd-pg" disabled={!tabela.getCanPreviousPage()} onClick={() => tabela.previousPage()} aria-label="Página anterior"><ChevronLeft size={15} /></button>
            <span className="fh-tabd-pagina">{paginaAtual} / {totalPaginas}</span>
            <button type="button" className="fh-tabd-pg" disabled={!tabela.getCanNextPage()} onClick={() => tabela.nextPage()} aria-label="Próxima página"><ChevronRight size={15} /></button>
            <button type="button" className="fh-tabd-pg" disabled={!tabela.getCanNextPage()} onClick={() => tabela.setPageIndex(totalPaginas - 1)} aria-label="Última página"><ChevronsRight size={15} /></button>
          </div>
          <Select
            className="fh-tabd-tam"
            aria-label="Registros por página"
            value={String(paginacao.pageSize)}
            onChange={(v) => tabela.setPageSize(Number(v))}
            options={opcoesTamanho}
          />
        </div>
      )}
    </div>
  );
}
