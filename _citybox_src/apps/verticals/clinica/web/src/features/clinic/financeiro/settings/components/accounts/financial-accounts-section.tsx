"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { ModalForm, ConfirmDialog } from "@citybox/ui/organisms";

import {
  useFinancialAccounts,
  useCreateFinancialAccount,
  useUpdateFinancialAccount,
  useDeleteFinancialAccount,
} from "../../../hooks/use-financial-accounts";
import { useFinancialPermissions } from "../../../hooks/use-financial-permissions";
import type { FinancialAccount } from "../../../services/financial.service";
import { FinancialAccountForm, ACCOUNT_TYPE_LABELS } from "./financial-account-form";
import { FinancialAccountsTable } from "./financial-accounts-table";

const FORM_ID = "financial-account-form";

function submitForm() {
  (document.getElementById(FORM_ID) as HTMLFormElement | null)?.requestSubmit();
}

export function FinancialAccountsSection() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<FinancialAccount | null>(null);

  const { canCreateAccount, canDeleteAccount } = useFinancialPermissions();
  const { data: accounts = [], isLoading } = useFinancialAccounts({ includeInactive: true });
  const createMutation = useCreateFinancialAccount();
  const updateMutation = useUpdateFinancialAccount();
  const deleteMutation = useDeleteFinancialAccount();

  const filtered = useMemo(
    () =>
      accounts
        .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
        .filter((a) => typeFilter === "all" || a.type === typeFilter),
    [accounts, search, typeFilter]
  );

  const handleEdit = (account: FinancialAccount) => {
    setEditingAccount(account);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setEditingAccount(null);
  };

  const handleToggleActive = (account: FinancialAccount) => {
    updateMutation.mutate(
      { id: account.id, data: { isActive: !account.isActive } },
      {
        onSuccess: () =>
          toast.success(account.isActive ? "Conta desativada" : "Conta ativada"),
      }
    );
  };

  const handleSubmit = (values: { name: string; type: string }) => {
    if (editingAccount) {
      updateMutation.mutate(
        { id: editingAccount.id, data: values },
        { onSuccess: handleCloseSheet }
      );
    } else {
      createMutation.mutate(values, { onSuccess: handleCloseSheet });
    }
  };

  const handleDelete = () => {
    if (!deletingAccount) return;
    deleteMutation.mutate(deletingAccount.id, {
      onSuccess: () => setDeletingAccount(null),
      onError: () => {
        toast.error("Não é possível excluir esta conta");
        setDeletingAccount(null);
      },
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Contas Financeiras</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Gerencie as contas utilizadas nos lançamentos financeiros.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {canCreateAccount ? (
          <Button onClick={() => setIsSheetOpen(true)}>
            <Plus className="size-4 mr-2" />
            Nova Conta
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground text-sm">
          Carregando contas...
        </div>
      ) : (
        <FinancialAccountsTable
          accounts={filtered}
          canEdit={canCreateAccount}
          canDelete={canDeleteAccount}
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
          onDelete={setDeletingAccount}
        />
      )}

      <ModalForm
        open={isSheetOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseSheet();
          else setIsSheetOpen(true);
        }}
        title={editingAccount ? "Editar Conta" : "Nova Conta Financeira"}
        saveLabel={editingAccount ? "Salvar alterações" : "Criar conta"}
        isSaving={isPending}
        onSave={submitForm}
      >
        <FinancialAccountForm
          defaultValues={editingAccount ?? undefined}
          onSubmit={handleSubmit}
          formId={FORM_ID}
        />
      </ModalForm>

      <ConfirmDialog
        open={!!deletingAccount}
        onOpenChange={(open) => {
          if (!open) setDeletingAccount(null);
        }}
        onConfirm={handleDelete}
        isConfirming={deleteMutation.isPending}
        title="Excluir conta financeira"
        description={`A conta ${deletingAccount?.name ?? ""} será excluída permanentemente. Esta ação não pode ser desfeita.`}
        confirmVariant="destructive"
        confirmLabel="Excluir"
      />
    </div>
  );
}
