"use client";

import { useEffect, useState } from "react";
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
import type { Subscription, SubscriptionPlan } from "../../types";
import { planConfig } from "../../lib/subscription-status-config";

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: Subscription | null;
}

export function ChangePlanDialog({
  open,
  onOpenChange,
  subscription,
}: ChangePlanDialogProps) {
  const [plan, setPlan] = useState<SubscriptionPlan>("starter");
  const [effectiveDate, setEffectiveDate] = useState("");

  useEffect(() => {
    if (open && subscription) {
      setPlan(subscription.plan);
      setEffectiveDate(new Date().toISOString().split("T")[0]);
    }
  }, [open, subscription]);

  function handleConfirm() {
    if (!subscription) return;
    console.log("Mudar plano:", subscription.id, { plan, effectiveDate });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mudar Plano</DialogTitle>
          <DialogDescription>
            {subscription
              ? `Alterar plano de ${subscription.clientName}.`
              : "Selecione o novo plano e a data de vigência."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="change-plan-select">Novo plano</Label>
            <Select
              value={plan}
              onValueChange={(value) => setPlan(value as SubscriptionPlan)}
            >
              <SelectTrigger id="change-plan-select">
                <SelectValue placeholder="Selecione o plano" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(planConfig) as SubscriptionPlan[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {planConfig[key].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="change-plan-date">Data de vigência</Label>
            <Input
              id="change-plan-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar Mudança</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
