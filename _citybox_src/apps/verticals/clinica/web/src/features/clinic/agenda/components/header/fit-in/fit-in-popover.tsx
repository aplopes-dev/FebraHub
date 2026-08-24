"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Puzzle, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@citybox/ui/atoms";

import { useSchedulingSheet } from "@/features/clinic/agenda/contexts/scheduling-sheet-context";
import { useFitIns, useDeleteFitIn } from "@/features/clinic/agenda/hooks/use-fit-ins";

import { AddFitInDialog } from "./add-fit-in-dialog";
import { FitInListDialog } from "./fit-in-list-dialog";
import { FitInItem } from "./fit-in-item";
// FIT_IN_MOCK mantido abaixo para referência até validação em produção
// import { FIT_IN_MOCK } from "./mocks";
import type { IFitIn } from "./types";

const ITEMS_PER_PAGE = 3;

function FitInPopover() {
  const { openSheet } = useSchedulingSheet();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const { data } = useFitIns({ status: "pending" });
  const { mutate: deleteFitIn } = useDeleteFitIn();

  const fitIns = data?.fitIns ?? [];

  const totalPages = Math.ceil(fitIns.length / ITEMS_PER_PAGE);
  const paginatedFitIns = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return fitIns.slice(start, start + ITEMS_PER_PAGE);
  }, [fitIns, currentPage]);

  const handleViewAll = () => {
    setPopoverOpen(false);
    setListDialogOpen(true);
  };

  const handleAddClick = () => {
    setAddDialogOpen(true);
  };

  const handleSchedule = (fitIn: IFitIn) => {
    setPopoverOpen(false);
    openSheet(
      {
        type: "appointment",
        patientId: fitIn.patient.id,
        professionalId: fitIn.professional?.id,
        date: fitIn.fitInDate
          ? format(new Date(fitIn.fitInDate), "yyyy-MM-dd")
          : undefined,
        observation: fitIn.observation ?? undefined,
        _fitInId: fitIn.id,
      },
      "create",
    );
  };

  const handleEdit = () => {
    // Edição via listDialog — abre a lista completa
    setPopoverOpen(false);
    setListDialogOpen(true);
  };

  const handleDelete = (fitIn: IFitIn) => {
    deleteFitIn(fitIn.id, {
      onSuccess: () => toast.success("Encaixe excluído"),
      onError: () => toast.error("Erro ao excluir encaixe"),
    });
  };

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Puzzle className="size-4" />
            {fitIns.length > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">
                {fitIns.length > 9 ? "9+" : fitIns.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          collisionPadding={12}
          className="w-[calc(100vw-1.5rem)] max-w-xl p-3 sm:w-xl sm:p-4"
        >
          {/* Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold">Gestão de Encaixe</h4>
              <p className="text-sm text-muted-foreground">
                {fitIns.length} encaixe(s) pendente(s)
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={handleViewAll}>
                Ver Todos
              </Button>
              <Button size="icon-sm" onClick={handleAddClick}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Lista de encaixes */}
          {fitIns.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
              Nenhum encaixe pendente.
            </p>
          ) : (
            <>
              <div className="space-y-2 mt-4">
                {paginatedFitIns.map((fitIn, index) => (
                  <FitInItem
                    key={`${fitIn.id}-${currentPage}-${index}`}
                    fitIn={fitIn}
                    onSchedule={handleSchedule}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {/* Dots de paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentPage(index)}
                        className={cn(
                          "size-2 rounded-full transition-colors",
                          currentPage === index
                            ? "bg-primary"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        )}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(totalPages - 1, prev + 1)
                      )
                    }
                    disabled={currentPage === totalPages - 1}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </PopoverContent>
      </Popover>

      <AddFitInDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onClose={() => setPopoverOpen(true)}
      />
      <FitInListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        onClose={() => setPopoverOpen(true)}
      />
    </>
  );
}

export { FitInPopover };
