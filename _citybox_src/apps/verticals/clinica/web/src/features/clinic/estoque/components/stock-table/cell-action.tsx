"use client";

import { useState } from "react";
import { Edit3, EllipsisVertical, Trash2, Package, History } from "lucide-react";

import { Button } from "@citybox/ui/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import { ConfirmDialog } from "@citybox/ui/organisms";

import type { StockProduct } from "../../types";
import { useDeleteProduct } from "../../hooks/use-delete-product";

interface CellActionProps {
  data: StockProduct;
  onEdit?: (product: StockProduct) => void;
  onWithdraw?: (product: StockProduct) => void;
  onViewHistory?: (product: StockProduct) => void;
}

export function CellAction({
  data,
  onEdit,
  onWithdraw,
  onViewHistory,
}: CellActionProps) {
  const [open, setOpen] = useState(false);
  const { mutate: deleteProduct, isPending } = useDeleteProduct();

  const onConfirmDelete = () => {
    deleteProduct(data.id, { onSuccess: () => setOpen(false) });
  };

  return (
    <>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={onConfirmDelete}
        title="Excluir produto"
        description={`O produto "${data.name}", e todo o histórico dele, será excluído permanentemente da sua clínica. Esta ação não pode ser desfeita.`}
        confirmVariant="destructive"
        confirmLabel="Excluir"
        isConfirming={isPending}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <EllipsisVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit?.(data)}>
            <Edit3 className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onWithdraw?.(data)}>
            <Package className="mr-2 h-4 w-4" /> Fazer retirada
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onViewHistory?.(data)}>
            <History className="mr-2 h-4 w-4" /> Ver histórico
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
