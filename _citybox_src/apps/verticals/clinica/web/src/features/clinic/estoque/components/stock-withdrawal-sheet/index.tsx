"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "@citybox/ui";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@citybox/ui/atoms";

import { CLINIC_FLOATING_SHEET_CONTENT_CLASS } from "@/features/clinic/lib/clinic-sheet-styles";
import { useTeamMembers } from "@/features/shared/team";

import { useStockWithdrawal } from "../../hooks/use-stock-withdrawal";
import type { StockWithdrawalSheetProps, WithdrawalFormData } from "./types";

const INITIAL_FORM_DATA: WithdrawalFormData = {
  quantity: 1,
  professionalId: "",
};

export function StockWithdrawalSheet({
  open,
  onOpenChange,
  product,
}: StockWithdrawalSheetProps) {
  const [formData, setFormData] = useState<WithdrawalFormData>(INITIAL_FORM_DATA);
  const { mutate: withdraw, isPending } = useStockWithdrawal();
  const { members } = useTeamMembers();

  const professionalOptions = members
    .filter((member) => member.status === "active")
    .map((member) => ({
      value: member.id,
      label: member.name,
    }));

  useEffect(() => {
    if (open) {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setFormData(INITIAL_FORM_DATA);
    }
    onOpenChange(newOpen);
  };

  const handleConfirm = () => {
    if (!product || formData.quantity <= 0) return;

    const professionalName = professionalOptions.find(
      (option) => option.value === formData.professionalId,
    )?.label;

    withdraw(
      {
        productId: product.id,
        quantity: formData.quantity,
        requestedById: formData.professionalId || undefined,
        requestedByName: professionalName,
      },
      {
        onSuccess: () => handleOpenChange(false),
      },
    );
  };

  const canConfirm =
    !!product && formData.quantity > 0 && formData.quantity <= product.quantity;

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        className={cn(
          "flex flex-col gap-0 p-0",
          CLINIC_FLOATING_SHEET_CONTENT_CLASS,
          "data-[side=right]:sm:max-w-[min(32rem,calc(100%-2rem))]",
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
          <SheetTitle className="text-base font-semibold">Retirada de Produto</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6">
          <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="relative size-16 shrink-0">
              {product.photoUrl ? (
                <Image
                  src={product.photoUrl}
                  alt={product.name}
                  fill
                  className="rounded-md bg-muted object-cover"
                  unoptimized
                />
              ) : (
                <div className="size-16 rounded-md bg-muted" />
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-lg font-semibold">{product.name}</span>
              <span className="text-sm text-muted-foreground">
                Quantidade atual:{" "}
                <span className="font-medium text-foreground">
                  {product.quantity} unidades
                </span>
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="withdrawal-quantity">Quantidade a retirar</Label>
              <Input
                id="withdrawal-quantity"
                type="number"
                min={1}
                max={product.quantity}
                step={1}
                value={formData.quantity}
                onChange={(event) => {
                  const raw = event.target.value;
                  const next = raw === "" ? 0 : Math.trunc(Number(raw));
                  setFormData((prev) => ({
                    ...prev,
                    quantity: Number.isFinite(next) ? Math.max(0, next) : 0,
                  }));
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="withdrawal-professional">Profissional (opcional)</Label>
              <Select
                value={formData.professionalId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, professionalId: value }))
                }
              >
                <SelectTrigger id="withdrawal-professional" className="w-full">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {professionalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.quantity > product.quantity && (
            <p className="text-sm text-destructive">
              A quantidade não pode ser maior que o estoque disponível.
            </p>
          )}
        </div>

        <SheetFooter className="flex-row justify-end gap-3 border-t border-border/50 px-6 py-5">
          <SheetClose asChild>
            <Button variant="outline" className="px-8" disabled={isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button className="px-8" onClick={handleConfirm} disabled={!canConfirm || isPending}>
            {isPending ? "Registrando..." : "Confirmar Retirada"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
