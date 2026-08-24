"use client";

import { AlertCircle, History, PackagePlus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button, Input, Skeleton } from "@citybox/ui/atoms";

import { useDebounce } from "../lib/use-debounce";
import {
  getNextStockProductsSort,
  toStockProductsApiSort,
  type StockProductsSort,
  type StockProductsSortColumn,
} from "../lib/stock-sort";
import type { StockProduct } from "../types";
import { useStockProducts } from "../hooks/use-stock-products";
import { StockTable } from "./stock-table";
import {
  STOCK_PAGE_SIZE_OPTIONS,
  type StockPageSize,
} from "./stock-pagination-bar";
import { StockEntrySheet } from "./stock-entry-sheet";
import { StockWithdrawalHistorySheet } from "./stock-withdrawal-history-sheet";
import { StockWithdrawalSheet } from "./stock-withdrawal-sheet";

function StockTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

export function StockListing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<StockPageSize>(STOCK_PAGE_SIZE_OPTIONS[0]);
  const [sort, setSort] = useState<StockProductsSort>(null);
  const [isEntrySheetOpen, setIsEntrySheetOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isWithdrawalSheetOpen, setIsWithdrawalSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(null);
  const [productToEdit, setProductToEdit] = useState<StockProduct | null>(null);
  const [historyProductFilter, setHistoryProductFilter] = useState<string | undefined>(
    undefined,
  );
  const [historyInitialSearch, setHistoryInitialSearch] = useState<string>("");

  const debouncedSearch = useDebounce(searchQuery, 400);
  const apiSort = toStockProductsApiSort(sort);
  const { data, isLoading, isError, refetch } = useStockProducts(
    debouncedSearch || undefined,
    { page, perPage, ...apiSort },
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handlePerPageChange = useCallback((nextPerPage: StockPageSize) => {
    setPerPage(nextPerPage);
    setPage(1);
  }, []);

  const handleSortChange = useCallback((columnId: StockProductsSortColumn) => {
    setSort((current) => getNextStockProductsSort(current, columnId));
    setPage(1);
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full min-w-0 lg:max-w-80">
          <Search className="absolute inset-y-0 start-0 my-auto ms-3 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="ps-9"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            variant="outline"
            className="w-full shrink-0 justify-center sm:w-auto"
            onClick={() => {
              setHistoryProductFilter(undefined);
              setHistoryInitialSearch("");
              setIsHistorySheetOpen(true);
            }}
          >
            <History className="mr-2 size-4 shrink-0" />
            <span className="truncate">Ver Histórico de retiradas</span>
          </Button>
          <Button
            className="w-full shrink-0 justify-center sm:w-auto"
            onClick={() => {
              setProductToEdit(null);
              setIsEntrySheetOpen(true);
            }}
          >
            <PackagePlus className="mr-2 size-4 shrink-0" />
            <span className="truncate">Fazer entrada no estoque</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <StockTableSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <AlertCircle className="size-10 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Erro ao carregar produtos do estoque.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <StockTable
          products={data?.products ?? []}
          onEdit={(product) => {
            setProductToEdit(product);
            setIsEntrySheetOpen(true);
          }}
          onWithdraw={(product) => {
            setSelectedProduct(product);
            setIsWithdrawalSheetOpen(true);
          }}
          onViewHistory={(product) => {
            setHistoryProductFilter(product.id);
            setHistoryInitialSearch(product.name);
            setIsHistorySheetOpen(true);
          }}
          page={page}
          perPage={perPage}
          total={data?.pagination.total ?? 0}
          totalPages={data?.pagination.totalPages ?? 0}
          onPageChange={setPage}
          onPerPageChange={handlePerPageChange}
          sort={sort}
          onSortChange={handleSortChange}
        />
      )}

      <StockEntrySheet
        open={isEntrySheetOpen}
        onOpenChange={(open) => {
          setIsEntrySheetOpen(open);
          if (!open) {
            setProductToEdit(null);
          }
        }}
        productToEdit={productToEdit}
      />

      <StockWithdrawalHistorySheet
        open={isHistorySheetOpen}
        onOpenChange={setIsHistorySheetOpen}
        initialProductFilter={historyProductFilter}
        initialSearch={historyInitialSearch}
      />

      <StockWithdrawalSheet
        open={isWithdrawalSheetOpen}
        onOpenChange={setIsWithdrawalSheetOpen}
        product={selectedProduct}
      />
    </div>
  );
}
