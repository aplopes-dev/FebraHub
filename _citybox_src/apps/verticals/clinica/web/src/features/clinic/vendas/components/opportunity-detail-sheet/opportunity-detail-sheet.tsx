"use client";

import { useState, useCallback, useEffect } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@citybox/ui";
import { Sheet, SheetContent, SheetFooter, SheetTitle } from "@citybox/ui/atoms";
import { Button } from "@citybox/ui/atoms";
import { ScrollArea } from "@citybox/ui/atoms";
import { Separator } from "@citybox/ui/atoms";
import { Skeleton } from "@citybox/ui/atoms";
import { Label, Input } from "@citybox/ui/atoms";
import { ConfirmDialog } from "@citybox/ui/organisms";

import {
  CLINIC_FLOATING_SHEET_CONTENT_CLASS,
  CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
} from "@/features/clinic/lib/clinic-sheet-styles";

import type {
  KanbanCard,
  KanbanColumn,
  HistoryItem,
  OpportunityUser,
} from "../../types";
import { LabelSelect } from "../label-select";
import { OpportunityInfoPanel } from "./opportunity-info-panel";
import { CommentInput } from "./comment-input";
import { OpportunityHistory } from "./opportunity-history";
import { StatusSelect } from "./status-select";
import { useFindOpportunity } from "../../hooks/use-find-opportunity";
import { useOpportunityHistory } from "../../hooks/use-opportunity-history";
import { useAddComment } from "../../hooks/use-add-comment";
import { useUpdateOpportunity } from "../../hooks/use-update-opportunity";

interface OpportunityDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: KanbanCard | null;
  columns: KanbanColumn[];
  currentUser: OpportunityUser;
  /** Sem manage: só visualização. */
  canManage?: boolean;
  onStatusChange: (cardId: string, columnId: string) => void;
  onLabelChange: (cardId: string, labelId: string) => void;
  onDelete: (cardId: string) => void;
}

function formatCreatedAt(date: Date): string {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return `Data de criação: ${formatted} - ${diffDays} dia${diffDays !== 1 ? "s" : ""} em aberto`;
}

function OpportunityDetailSheetSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
      <div className="min-w-0 flex-1 md:min-h-0 md:overflow-hidden">
        <ScrollArea className="md:h-full">
          <div className="space-y-6 p-4 sm:p-6">
            <div className="space-y-2">
              <Skeleton className="h-7 w-64 max-w-full" />
              <Skeleton className="h-4 w-48 max-w-full" />
            </div>
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full rounded-md" />
            </div>
            <Separator />
            <div className="space-y-4">
              <Skeleton className="h-5 w-20" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
      <div className="w-full shrink-0 border-t bg-muted/30 p-4 md:w-72 md:overflow-y-auto md:border-l md:border-t-0 sm:p-6 xl:w-96">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32 max-w-full" />
              <Skeleton className="h-3 w-24 max-w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OpportunityDetailSheet({
  open,
  onOpenChange,
  card,
  columns,
  currentUser,
  canManage = true,
  onStatusChange,
  onLabelChange,
  onDelete,
}: OpportunityDetailSheetProps) {
  const { data: opportunity, isLoading: isLoadingOpportunity } =
    useFindOpportunity(open && card ? card.id : null);
  const { data: historyData, isLoading: isLoadingHistory } =
    useOpportunityHistory(open && card ? card.id : null);

  const addComment = useAddComment();
  const updateOpportunity = useUpdateOpportunity();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(card?.title || "");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  useEffect(() => {
    if (card && !editingTitle) {
      setLocalTitle(opportunity?.title || card.title);
    }
  }, [card, opportunity?.title, editingTitle]);

  const handleTitleSave = useCallback(
    async (value: string, cardId: string) => {
      if (isSavingTitle) return;
      if (!value || value.trim().length === 0) {
        toast.error("O título não pode estar vazio");
        return;
      }
      setIsSavingTitle(true);
      try {
        await updateOpportunity.mutateAsync({
          id: cardId,
          data: { title: value.trim() },
        });
        toast.success("Título atualizado com sucesso!");
        setEditingTitle(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erro ao atualizar título",
        );
      } finally {
        setIsSavingTitle(false);
      }
    },
    [updateOpportunity, isSavingTitle],
  );

  const handleTitleCancel = useCallback(() => {
    if (card) {
      setLocalTitle(opportunity?.title || card.title);
      setEditingTitle(false);
    }
  }, [card, opportunity?.title]);

  if (!card) return null;

  const isLoading = isLoadingOpportunity || isLoadingHistory;

  const handleAddComment = (content: string) => {
    addComment.mutate({ opportunityId: card.id, content });
  };

  const historyItems: HistoryItem[] =
    historyData?.map((item) => ({
      id: item.id,
      type: item.actionType as HistoryItem["type"],
      user:
        item.userId && item.userName
          ? { id: item.userId, name: item.userName, avatar: item.userAvatar }
          : undefined,
      createdAt: new Date(item.createdAt),
      content: item.content,
      isSystemAction: item.isSystemAction,
      systemName: item.systemName,
      metadata: item.metadata as HistoryItem["metadata"],
    })) || [];

  const currentColumn = columns.find((col) => col.id === card.columnId);
  const isReadOnly =
    !canManage ||
    currentColumn?.type === "completed" ||
    currentColumn?.type === "lost";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          CLINIC_FLOATING_SHEET_CONTENT_CLASS,
          CLINIC_FLOATING_SHEET_LAYOUT_CLASS,
          // Evita o lado esquerdo sair da viewport no tablet (max-w-5xl = 1024px).
          "data-[side=right]:w-[calc(100%-2rem)] data-[side=right]:max-w-[min(64rem,calc(100%-2rem))]",
          "[&>button]:hidden",
        )}
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">
          {card.title || "Detalhes da oportunidade"}
        </SheetTitle>
        {isLoading ? (
          <OpportunityDetailSheetSkeleton />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain md:flex-row md:overflow-hidden">
            {/* Coluna esquerda — no mobile empilha acima; md+ fica ao lado */}
            <div className="min-w-0 flex-1 md:min-h-0 md:overflow-hidden">
              <ScrollArea className="md:h-full">
                <div className="min-w-0 space-y-6 overflow-x-hidden p-4 sm:p-6">
                  <div className="min-w-0">
                    {editingTitle ? (
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1.5">
                          <Label>Título</Label>
                          <Input
                            value={localTitle}
                            onChange={(e) => setLocalTitle(e.target.value)}
                            autoFocus
                            className="text-xl font-semibold"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleTitleSave(localTitle, card.id)}
                            disabled={isSavingTitle}
                          >
                            Salvar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTitleCancel}
                            disabled={isSavingTitle}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex min-w-0 items-start gap-2">
                        <h2 className="min-w-0 flex-1 text-xl font-semibold break-words">
                          {opportunity?.title || card.title}
                        </h2>
                        {!isReadOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 shrink-0 p-0"
                            onClick={() => {
                              setEditingTitle(true);
                              setLocalTitle(opportunity?.title || card.title);
                            }}
                          >
                            <Pencil className="size-3" />
                          </Button>
                        )}
                      </div>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatCreatedAt(card.createdAt)}
                    </p>
                  </div>

                  <Separator />

                  <div className="min-w-0 space-y-4">
                    <h3 className="text-sm font-medium">Comentários</h3>
                    {canManage ? (
                      <CommentInput
                        currentUser={currentUser}
                        onSubmit={handleAddComment}
                      />
                    ) : null}
                  </div>

                  <Separator />

                  <div className="min-w-0 space-y-4">
                    <h3 className="text-sm font-medium">Histórico</h3>
                    {isLoadingHistory ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full rounded-md" />
                        <Skeleton className="h-16 w-full rounded-md" />
                      </div>
                    ) : (
                      <OpportunityHistory items={historyItems} />
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Coluna direita — full width no mobile; lateral a partir de md (tablet+) */}
            <div className="w-full shrink-0 border-t bg-muted/30 p-4 md:w-72 md:overflow-y-auto md:border-l md:border-t-0 sm:p-6 xl:w-96">
              <OpportunityInfoPanel
                card={card}
                opportunity={opportunity}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        )}

        <SheetFooter className="shrink-0 border-t px-4 py-4 sm:px-6">
          <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="w-full min-w-0 sm:w-56">
              <LabelSelect
                label="Rótulo"
                value={card.label?.id}
                onValueChange={(labelId) => onLabelChange(card.id, labelId ?? "")}
                disabled={isReadOnly}
              />
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              {canManage ? (
                <Button
                  variant="destructive"
                  className="bg-transparent text-destructive hover:bg-destructive/10"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Excluir
                </Button>
              ) : null}
              <StatusSelect
                value={card.columnId}
                onValueChange={(columnId) => onStatusChange(card.id, columnId)}
                columns={columns}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </SheetFooter>
      </SheetContent>

      <ConfirmDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={() => {
          onDelete(card.id);
          onOpenChange(false);
          setIsDeleteModalOpen(false);
        }}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta oportunidade? Esta ação não pode ser desfeita."
        confirmVariant="destructive"
        confirmLabel="Excluir"
      />
    </Sheet>
  );
}
