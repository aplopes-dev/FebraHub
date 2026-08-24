"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@citybox/ui/atoms";

interface WithdrawalPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function WithdrawalPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: WithdrawalPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <span className="text-sm text-muted-foreground">
        Mostrando {startItem} a {endItem} de {totalItems} registros
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="mr-1 size-4" />
          Anterior
        </Button>

        <span className="px-2 text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Próximo
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
