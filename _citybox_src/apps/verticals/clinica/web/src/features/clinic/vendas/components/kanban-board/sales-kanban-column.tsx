"use client";

import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge, Button } from "@citybox/ui/atoms";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import {
  KanbanBoard,
  KanbanCard as KanbanCardDS,
  KanbanCards,
  KanbanColumnHandle,
  KanbanHeader,
} from "@citybox/ui/organisms";

import type { ColumnType, KanbanCard } from "../../types";
import { SalesKanbanCard } from "./sales-kanban-card";

const COLUMN_COLORS: Record<ColumnType, string> = {
  open: "#3b82f6",
  in_progress: "#f59e0b",
  completed: "#22c55e",
  lost: "#ef4444",
  custom: "#8b5cf6",
};

export type SalesKanbanColumnData = {
  id: string;
  name: string;
  color?: string;
  type: ColumnType;
  isEditable: boolean;
  isDraggable: boolean;
} & Record<string, unknown>;

export type SalesKanbanItem = KanbanCard & { column: string } & Record<string, unknown>;

interface SalesKanbanColumnProps {
  column: SalesKanbanColumnData;
  count: number;
  canManage?: boolean;
  onCardClick?: (card: KanbanCard) => void;
  onEdit?: (columnId: string) => void;
  onDelete?: (columnId: string) => void;
}

export function SalesKanbanColumn({
  column,
  count,
  canManage = true,
  onCardClick,
  onEdit,
  onDelete,
}: SalesKanbanColumnProps) {
  return (
    <KanbanBoard
      id={column.id}
      sortable={column.isDraggable}
      className="h-full w-72 shrink-0 bg-kanban-column"
    >
      <KanbanHeader className="justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: column.color ?? COLUMN_COLORS[column.type] }}
          />
          <span className="text-sm font-medium">{column.name}</span>
          <Badge variant="secondary" className="pointer-events-none rounded-sm">
            {count}
          </Badge>
        </div>

        <div className="flex items-center gap-0.5">
          {column.isEditable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(column.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete?.(column.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Alça de arraste — só em colunas móveis (Agendada/Perdida não têm). */}
          {column.isDraggable ? (
            <KanbanColumnHandle
              aria-label="Arrastar para reordenar coluna"
              className="h-7 w-7"
            >
              <GripVertical className="h-4 w-4" />
            </KanbanColumnHandle>
          ) : null}
        </div>
      </KanbanHeader>

      <KanbanCards<SalesKanbanItem>
        id={column.id}
        emptyState={
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
            Sem oportunidades
          </div>
        }
      >
        {(item) =>
          canManage ? (
            <KanbanCardDS id={item.id} key={item.id}>
              <SalesKanbanCard card={item} onClick={onCardClick} isDraggable />
            </KanbanCardDS>
          ) : (
            <div key={item.id}>
              <SalesKanbanCard
                card={item}
                onClick={onCardClick}
                isDraggable={false}
              />
            </div>
          )
        }
      </KanbanCards>
    </KanbanBoard>
  );
}
