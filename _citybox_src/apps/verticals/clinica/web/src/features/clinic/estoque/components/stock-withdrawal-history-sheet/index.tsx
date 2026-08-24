"use client";

import { useCallback, useState } from "react";

import { cn } from "@citybox/ui";
import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@citybox/ui/atoms";

import { CLINIC_FLOATING_SHEET_CONTENT_CLASS } from "@/features/clinic/lib/clinic-sheet-styles";
import { formatLocalDateString } from "@/features/clinic/agenda/lib/local-date";

import {
  getNextWithdrawalSort,
  toWithdrawalApiSort,
  type WithdrawalSort,
  type WithdrawalSortColumn,
} from "../../lib/stock-sort";
import { WithdrawalFiltersComponent } from "./withdrawal-filters";
import { WithdrawalTable } from "./withdrawal-table";
import { WithdrawalPagination } from "./withdrawal-pagination";
import { useStockMovements } from "../../hooks/use-stock-movements";
import type { StockWithdrawal, WithdrawalFilters } from "./types";
import type { StockMovement } from "../../types";

interface StockWithdrawalHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductFilter?: string;
  initialSearch?: string;
}

const ITEMS_PER_PAGE = 20;

const INITIAL_FILTERS: WithdrawalFilters = {
  search: "",
  startDate: undefined,
  endDate: undefined,
};

export function StockWithdrawalHistorySheet({
  open,
  onOpenChange,
  initialProductFilter,
  initialSearch = "",
}: StockWithdrawalHistorySheetProps) {
  const [filters, setFilters] = useState<WithdrawalFilters>({
    ...INITIAL_FILTERS,
    search: initialSearch,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<WithdrawalSort>({ columnId: "date", direction: "desc" });
  const [lastProductFilter, setLastProductFilter] = useState<string | undefined>(
    initialProductFilter,
  );

  if (open && initialProductFilter !== lastProductFilter) {
    setFilters({ ...INITIAL_FILTERS, search: initialSearch });
    setCurrentPage(1);
    setSort({ columnId: "date", direction: "desc" });
    setLastProductFilter(initialProductFilter);
  }

  const apiSort = toWithdrawalApiSort(sort);
  const { data, isLoading } = useStockMovements({
    type: "withdrawal",
    productId: initialProductFilter,
    startDate: filters.startDate ? formatLocalDateString(filters.startDate) : undefined,
    endDate: filters.endDate ? formatLocalDateString(filters.endDate) : undefined,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    ...apiSort,
  });

  const allWithdrawals: StockWithdrawal[] = (data?.movements ?? []).map((m: StockMovement) => ({
    id: m.id,
    product: {
      id: m.product.id,
      name: m.product.name,
      photoUrl: m.product.photoUrl,
    },
    quantity: m.quantity,
    withdrawnBy: m.requestedBy?.name ?? "Não informado",
    authorizedBy: m.authorizedBy.name,
    date: new Date(m.createdAt),
  }));

  const withdrawals = filters.search
    ? allWithdrawals.filter((w) =>
        w.product.name.toLowerCase().includes(filters.search.toLowerCase()),
      )
    : allWithdrawals;

  const totalItems = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  const handleFiltersChange = useCallback((newFilters: Partial<WithdrawalFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((columnId: WithdrawalSortColumn) => {
    setSort((current) => getNextWithdrawalSort(current, columnId));
    setCurrentPage(1);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFilters(INITIAL_FILTERS);
      setCurrentPage(1);
      setSort({ columnId: "date", direction: "desc" });
      setLastProductFilter(undefined);
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className={cn(
          "flex flex-col gap-0 p-0",
          CLINIC_FLOATING_SHEET_CONTENT_CLASS,
          "data-[side=right]:sm:max-w-[min(72rem,calc(100%-2rem))]",
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
          <SheetTitle className="text-base font-semibold">
            Histórico de Retiradas
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
          <WithdrawalFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {isLoading ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
              <WithdrawalTable
                withdrawals={withdrawals}
                sort={sort}
                onSortChange={handleSortChange}
              />
            </div>
          )}

          <div className="mt-auto shrink-0">
            {totalItems > 0 && (
              <WithdrawalPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-3 border-t border-border/50 px-6 py-5">
          <SheetClose asChild>
            <Button variant="outline" className="px-8">
              Fechar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
