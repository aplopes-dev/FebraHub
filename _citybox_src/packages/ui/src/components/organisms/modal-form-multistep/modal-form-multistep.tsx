"use client";

import * as React from "react";
import { CheckIcon, Loader2, XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "../../atoms/dialog";
import { Button } from "../../atoms/button";
import { Progress } from "../../atoms/progress";
import { cn } from "../../../lib/utils";

export interface ModalFormMultistepStep {
  /** Label exibido na barra lateral */
  label: string;
  /** Descrição exibida na barra lateral */
  description: string;
  /** Título exibido no cabeçalho do painel de conteúdo */
  title: string;
  /** Subtítulo exibido no cabeçalho do painel de conteúdo */
  subtitle?: string;
  /** Conteúdo do step (campos do formulário) */
  content: React.ReactNode;
}

export interface ModalFormMultistepProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título exibido no topo da barra lateral */
  sidebarTitle: string;
  sidebarSubtitle?: string;
  steps: ModalFormMultistepStep[];
  /**
   * Chamado ao clicar em Salvar no último step.
   * Responsabilidade do consumidor: validar e persistir.
   */
  onSave: () => void;
  /**
   * Chamado ao fechar (X ou Cancelar).
   * Use para resetar o formulário.
   */
  onClose?: () => void;
  /**
   * Chamado antes de avançar para o próximo step.
   * Recebe o índice 0-based do step atual.
   * Retorne false para bloquear o avanço (ex: validação falhou).
   */
  onBeforeNext?: (stepIndex: number) => Promise<boolean> | boolean;
  isSaving?: boolean;
}

export function ModalFormMultistep({
  open,
  onOpenChange,
  sidebarTitle,
  sidebarSubtitle,
  steps,
  onSave,
  onClose,
  onBeforeNext,
  isSaving,
}: ModalFormMultistepProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const total = steps.length;
  const activeStep = steps[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const progress = total > 1 ? Math.round((currentIndex / (total - 1)) * 100) : 100;

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setCurrentIndex(0), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleClose = () => {
    if (isSaving) return;
    onOpenChange(false);
    onClose?.();
  };

  const handleNext = async () => {
    if (onBeforeNext) {
      const ok = await onBeforeNext(currentIndex);
      if (!ok) return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const handleBack = () => setCurrentIndex((i) => i - 1);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
        if (!nextOpen && isSaving) return;
        onOpenChange(nextOpen);
        if (!nextOpen) onClose?.();
      }}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-2 sm:max-w-[820px] bg-muted max-w-[calc(100vw-2rem)]"
      >
        <DialogDescription className="sr-only">
          Formulário em etapas para preenchimento dos dados.
        </DialogDescription>
        <div className="flex h-[min(580px,85vh)] min-w-0">
          {/* Barra lateral de steps */}
          <div className="flex w-56 shrink-0 flex-col pr-2">
            <div className="mb-6 p-5">
              <DialogTitle className="text-sm font-semibold text-sidebar-foreground">
                {sidebarTitle}
              </DialogTitle>
              {sidebarSubtitle && (
                <p className="text-xs text-sidebar-foreground/60 mt-0.5">{sidebarSubtitle}</p>
              )}
            </div>

            <nav className="flex-1 space-y-1">
              {steps.map((step, index) => {
                const isDone = index < currentIndex;
                const isActive = index === currentIndex;

                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      isActive && "bg-background/40",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                        isDone && "bg-primary text-primary-foreground",
                        isActive && "border-2 border-primary bg-background text-primary",
                        !isDone && !isActive && "border border-sidebar-foreground/20 text-sidebar-foreground/40",
                      )}
                    >
                      {isDone ? <CheckIcon size={13} strokeWidth={2.5} /> : index + 1}
                    </div>

                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium leading-none",
                          isActive
                            ? "text-sidebar-foreground"
                            : isDone
                              ? "text-sidebar-foreground/80"
                              : "text-sidebar-foreground/40",
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-xs text-sidebar-foreground/50 truncate">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="mt-6 space-y-2 p-5">
              <p className="text-xs text-sidebar-foreground/60">
                Etapa {currentIndex + 1} de {total}
              </p>
              <Progress value={progress} className="h-1 bg-sidebar-foreground/20" />
            </div>
          </div>

          {/* Painel de conteúdo */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] bg-background border">
            {/* Cabeçalho */}
            <div className="flex shrink-0 items-start justify-between px-6 py-4">
              <div className="min-w-0 pr-3">
                <h2 className="text-base font-semibold leading-none">{activeStep?.title}</h2>
                {activeStep?.subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{activeStep.subtitle}</p>
                )}
              </div>
              <DialogClose asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="-me-1 -mt-1 shrink-0 text-muted-foreground"
                  onClick={handleClose}
                >
                  <XIcon size={16} />
                  <span className="sr-only">Fechar</span>
                </Button>
              </DialogClose>
            </div>

            {/* Conteúdo rolável — min-w-0 evita grade/tabelas largas empurrarem o modal */}
            <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-5">
              {activeStep?.content}
            </div>

            {/* Rodapé de navegação */}
            <div className="flex shrink-0 items-center justify-end gap-2 px-6 py-3">
              <Button variant="ghost" type="button" onClick={handleClose} disabled={isSaving}>
                Cancelar
              </Button>
              {!isFirst && (
                <Button variant="outline" type="button" onClick={handleBack} disabled={isSaving}>
                  Voltar
                </Button>
              )}
              {isLast ? (
                <Button type="button" onClick={onSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Salvar
                    </>
                  ) : (
                    "Salvar"
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext} disabled={isSaving}>
                  Continuar
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
