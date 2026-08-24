"use client";

import * as React from "react";
import { Loader2, XIcon } from "lucide-react";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "../../atoms/dialog";
import { Button } from "../../atoms/button";
import { ScrollArea } from "../../atoms/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../atoms/tabs";
import { TAB_LIST_LINE_CLASS, TAB_TRIGGER_LINE_CLASS } from "../../../lib/tab-styles";

export interface ModalFormTab {
  value: string;
  label: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

export interface ModalFormTabsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  tabs: ModalFormTab[];
  defaultTab?: string;
  activeTab?: string;
  onActiveTabChange?: (value: string) => void;
  onSave: () => void;
  onClose?: () => void;
  isSaving?: boolean;
  /** Rótulo do botão primário (padrão: Salvar). Use "Continuar" em fluxos guiados. */
  saveLabel?: string;
  /** Desabilita o botão primário (ex.: consentimento LGPD ainda não aceito). */
  saveDisabled?: boolean;
}

export function ModalFormTabs({
  open,
  onOpenChange,
  title,
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  onSave,
  onClose,
  isSaving,
  saveLabel = "Salvar",
  saveDisabled = false,
}: ModalFormTabsProps) {
  const fallbackTab = defaultTab ?? tabs[0]?.value ?? "";
  const [internalActiveTab, setInternalActiveTab] = React.useState(fallbackTab);

  const activeTab = controlledActiveTab ?? internalActiveTab;

  const setActiveTab = (value: string) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(value);
    }
    onActiveTabChange?.(value);
  };

  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setInternalActiveTab(fallbackTab), 200);
      return () => clearTimeout(t);
    }
  }, [open, fallbackTab]);

  React.useEffect(() => {
    if (open && controlledActiveTab === undefined) {
      setInternalActiveTab(fallbackTab);
    }
  }, [open, fallbackTab, controlledActiveTab]);

  const handleClose = () => {
    if (isSaving) return;
    onOpenChange(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
        if (!nextOpen && isSaving) return;
        onOpenChange(nextOpen);
        if (!nextOpen) onClose?.();
      }}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-2 sm:max-w-[820px] bg-muted"
      >
        <DialogDescription className="sr-only">
          Formulário em abas para preenchimento dos dados.
        </DialogDescription>
        <div className="flex h-[580px] flex-col overflow-hidden rounded-[10px] bg-background border">
          <div className="flex items-start justify-between px-6 py-4">
            <DialogTitle className="text-base font-semibold leading-none">{title}</DialogTitle>
            <DialogClose asChild>
              <Button
                variant="secondary"
                size="icon-sm"
                className="-me-1 -mt-1 text-muted-foreground"
                onClick={handleClose}
              >
                <XIcon size={16} />
                <span className="sr-only">Fechar</span>
              </Button>
            </DialogClose>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 w-full flex-1 flex-col gap-4 px-6"
          >
            <TabsList className={TAB_LIST_LINE_CLASS}>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className={TAB_TRIGGER_LINE_CLASS}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="shrink-0 pb-2">
                  <h3 className="text-sm font-semibold leading-none">{tab.title}</h3>
                  {tab.subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground">{tab.subtitle}</p>
                  )}
                </div>
                <div className="min-h-0 flex-1">
                  <ScrollArea className="h-full">
                    <div className="py-3 pr-3">{tab.content}</div>
                  </ScrollArea>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex items-center justify-end gap-2 border-t px-6 py-3">
            <Button variant="ghost" type="button" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="button" onClick={onSave} disabled={isSaving || saveDisabled}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {saveLabel}
                </>
              ) : (
                saveLabel
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
