"use client";

import {
  Badge,
  Button,
  Switch,
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

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";


import type { FinancialAccount } from "../../../services/financial.service";
import { ACCOUNT_TYPE_LABELS } from "./financial-account-form";

interface FinancialAccountsTableProps {
  accounts: FinancialAccount[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit: (account: FinancialAccount) => void;
  onToggleActive: (account: FinancialAccount) => void;
  onDelete: (account: FinancialAccount) => void;
}

export function FinancialAccountsTable({
  accounts,
  canEdit = true,
  canDelete = true,
  onEdit,
  onToggleActive,
  onDelete,
}: FinancialAccountsTableProps) {
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border py-12 text-muted-foreground">
        <p className="text-sm">Nenhuma conta encontrada.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criada em</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow key={account.id} className={!account.isActive ? "opacity-60" : ""}>
              <TableCell className="font-medium">{account.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                </Badge>
              </TableCell>
              <TableCell>
                {/* Desktop: switch com label */}
                <div className="hidden sm:flex items-center gap-2">
                  {canEdit ? (
                    <Switch
                      checked={account.isActive}
                      onCheckedChange={() => onToggleActive(account)}
                    />
                  ) : null}
                  <span className="text-sm text-muted-foreground">
                    {account.isActive ? "Ativa" : "Inativa"}
                  </span>
                </div>
                {/* Mobile: badge */}
                <div className="sm:hidden">
                  <Badge variant={account.isActive ? "default" : "outline"}>
                    {account.isActive ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(account.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </TableCell>
              <TableCell>
                {canEdit || canDelete ? (
                  <>
                    {/* Desktop: botões inline */}
                    <div className="hidden sm:flex items-center gap-1">
                      {canEdit ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Editar"
                          onClick={() => onEdit(account)}
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
                          onClick={() => onDelete(account)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>

                    {/* Mobile: dropdown */}
                    <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit ? (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(account)}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onToggleActive(account)}>
                                {account.isActive ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          {canEdit && canDelete ? <DropdownMenuSeparator /> : null}
                          {canDelete ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDelete(account)}
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
