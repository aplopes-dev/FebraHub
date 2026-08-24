"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@citybox/ui/atoms";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@citybox/ui/atoms";

interface ConfirmChangeStageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  stageName: string;
  stageType: "completed" | "lost";
  opportunityTitle: string;
  isLoading?: boolean;
}

export function ConfirmChangeStageModal({
  open,
  onOpenChange,
  onConfirm,
  stageName,
  stageType,
  opportunityTitle,
  isLoading = false,
}: ConfirmChangeStageModalProps) {
  const isWon = stageType === "completed";
  const title = isWon
    ? "Confirmar oportunidade ganha"
    : "Confirmar oportunidade perdida";

  const description = isWon
    ? `Tem certeza que deseja marcar a oportunidade "${opportunityTitle}" como ganha na etapa "${stageName}"? Esta ação não pode ser desfeita.`
    : `Tem certeza que deseja marcar a oportunidade "${opportunityTitle}" como perdida na etapa "${stageName}"? Esta ação não pode ser desfeita.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                isWon ? "bg-green-500/10" : "bg-red-500/10"
              }`}
            >
              <AlertCircle
                className={`size-5 ${isWon ? "text-green-600" : "text-red-600"}`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={isWon ? "default" : "destructive"}
              className={`px-8 ${isWon ? "" : "bg-destructive hover:bg-destructive/70"}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processando..." : "Confirmar"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
