"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@citybox/ui/atoms";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import type { ExpenseCategory } from "../../../services/financial.service";

interface ExpenseCategoriesTableProps {
  categories: ExpenseCategory[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit: (category: ExpenseCategory) => void;
  onDelete: (category: ExpenseCategory) => void;
}

export function ExpenseCategoriesTable({
  categories,
  canEdit = true,
  canDelete = true,
  onEdit,
  onDelete,
}: ExpenseCategoriesTableProps) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-12 text-muted-foreground">
        <p className="text-sm">Nenhuma categoria encontrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                    aria-hidden
                  />
                  <span className="font-medium text-foreground">{category.name}</span>
                </div>
              </TableCell>
              <TableCell>
                {canEdit || canDelete ? (
                  <>
                    <div className="hidden sm:flex items-center gap-1">
                      {canEdit ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Editar"
                          onClick={() => onEdit(category)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          title="Excluir"
                          onClick={() => onDelete(category)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>

                    <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit ? (
                            <DropdownMenuItem onClick={() => onEdit(category)}>
                              Editar
                            </DropdownMenuItem>
                          ) : null}
                          {canEdit && canDelete ? <DropdownMenuSeparator /> : null}
                          {canDelete ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDelete(category)}
                            >
                              Excluir
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
