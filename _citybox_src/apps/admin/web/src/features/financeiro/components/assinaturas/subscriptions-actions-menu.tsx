"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  Percent,
  Ban,
  MoreHorizontal,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import { ConfirmDialog } from "@citybox/ui/organisms";
import type { Subscription } from "../../types";
import { ChangePlanDialog } from "./change-plan-dialog";
import { ApplyDiscountDialog } from "./apply-discount-dialog";

interface SubscriptionsActionsMenuProps {
  subscription: Subscription;
}

export function SubscriptionsActionsMenu({
  subscription,
}: SubscriptionsActionsMenuProps) {
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  function handleCancel() {
    console.log("Cancelar assinatura:", subscription.id);
    setConfirmCancel(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Ações de {subscription.clientName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setChangePlanOpen(true)}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Mudar Plano (Upgrade/Downgrade)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDiscountOpen(true)}>
            <Percent className="mr-2 h-4 w-4" />
            Aplicar Desconto
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setConfirmCancel(true)}
            disabled={subscription.status === "cancelado"}
          >
            <Ban className="mr-2 h-4 w-4" />
            Cancelar Assinatura
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePlanDialog
        open={changePlanOpen}
        onOpenChange={setChangePlanOpen}
        subscription={subscription}
      />

      <ApplyDiscountDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        subscription={subscription}
      />

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancelar assinatura?"
        description={
          <>
            A assinatura de <strong>{subscription.clientName}</strong> será
            cancelada. O acesso permanece até o fim do ciclo vigente.
          </>
        }
        confirmLabel="Cancelar Assinatura"
        cancelLabel="Voltar"
        confirmVariant="destructive"
        onConfirm={handleCancel}
      />
    </>
  );
}
