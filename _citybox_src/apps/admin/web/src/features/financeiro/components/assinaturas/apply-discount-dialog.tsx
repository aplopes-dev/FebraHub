"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import type { Subscription } from "../../types";

type DiscountType = "fixed" | "percent";

interface ApplyDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
}

export function ApplyDiscountDialog({
  open,
  onOpenChange,
  subscription,
}: ApplyDiscountDialogProps) {
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [durationMonths, setDurationMonths] = useState("3");

  useEffect(() => {
    if (open) {
      setDiscountType("percent");
      setDiscountValue("");
      setDurationMonths("3");
    }
  }, [open]);

  const preview = useMemo(() => {
    const value = Number(discountValue);
    const months = Number(durationMonths);
    if (!value || !months) return null;

    if (discountType === "percent") {
      return `${value}% off por ${months} ${months === 1 ? "mês" : "meses"}`;
    }

    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

    return `${formatted} off por ${months} ${months === 1 ? "mês" : "meses"}`;
  }, [discountType, discountValue, durationMonths]);

  function handleConfirm() {
    if (!subscription) return;
    console.log("Aplicar desconto:", subscription.id, {
      discountType,
      discountValue,
      durationMonths,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Aplicar Desconto</DialogTitle>
          <DialogDescription>
            {subscription
              ? `Configurar desconto para ${subscription.clientName}.`
              : "Defina o tipo, valor e duração do desconto."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="discount-type">Tipo de desconto</Label>
            <Select
              value={discountType}
              onValueChange={(value) => setDiscountType(value as DiscountType)}
            >
              <SelectTrigger id="discount-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                <SelectItem value="percent">Percentual (%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="discount-value">
              {discountType === "percent" ? "Percentual (%)" : "Valor (R$)"}
            </Label>
            <Input
              id="discount-value"
              type="number"
              min="0"
              step={discountType === "percent" ? "1" : "0.01"}
              placeholder={discountType === "percent" ? "10" : "50.00"}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="discount-duration">Duração (meses)</Label>
            <Input
              id="discount-duration"
              type="number"
              min="1"
              step="1"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
            />
          </div>

          {preview ? (
            <p className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Preview: <span className="font-medium text-foreground">{preview}</span>
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!preview}>
            Aplicar Desconto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
