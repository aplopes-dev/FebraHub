"use client";

import { useState, useId } from "react";
import { Plus, X, Loader2, Pencil, ArrowLeft } from "lucide-react";

import { cn } from "@citybox/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
  Button,
  Label as FieldLabel,
} from "@citybox/ui/atoms";
import { TextField, SelectField } from "../../_ui/fields";

import {
  useFinancialAccounts,
  useCreateFinancialAccount,
  useUpdateFinancialAccount,
} from "../../hooks/use-financial-accounts";
import { useFinancialPermissions } from "../../hooks/use-financial-permissions";
import type { FinancialAccount } from "../../services/financial.service";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Conta Poupança" },
  { value: "cash", label: "Caixa Físico" },
  { value: "other", label: "Outro" },
];

type PopoverMode = "idle" | "create" | "edit";

type FinancialAccountSelectProps = {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
  id?: string;
  error?: boolean;
  disabled?: boolean;
};

export function FinancialAccountSelect({
  value,
  onValueChange,
  label = "Conta",
  className,
  id: externalId,
  error,
  disabled,
}: FinancialAccountSelectProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [mode, setMode] = useState<PopoverMode>("idle");
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");

  const { canCreateAccount } = useFinancialPermissions();
  const { data: accounts, isLoading } = useFinancialAccounts();
  const createMutation = useCreateFinancialAccount();
  const updateMutation = useUpdateFinancialAccount();

  const selectedAccount = accounts?.find((a) => a.id === value);

  const filteredAccounts =
    accounts?.filter((a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) ?? [];

  const resetForm = () => {
    setName("");
    setType("checking");
    setEditingAccount(null);
    setMode("idle");
    setSearchTerm("");
  };

  const handleStartEdit = (acc: FinancialAccount, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setMode("edit");
    setPopoverOpen(true);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    createMutation.mutate(
      { name: name.trim(), type },
      {
        onSuccess: (newAccount) => {
          onValueChange(newAccount.id);
          resetForm();
          setPopoverOpen(false);
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!name.trim() || !editingAccount) return;
    updateMutation.mutate(
      { id: editingAccount.id, data: { name: name.trim(), type } },
      {
        onSuccess: () => {
          resetForm();
        },
      }
    );
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <FieldLabel htmlFor={id} className={cn(disabled && "opacity-50", error && "text-destructive")}>
          {label}
        </FieldLabel>
      )}

      <div className="relative">
        <Select
          value={value ?? ""}
          onValueChange={onValueChange}
          disabled={disabled || isLoading}
        >
          <SelectTrigger
            id={id}
            aria-invalid={error}
            className={cn("w-full", error && "border-destructive", className)}
          >
            <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione"}>
              {selectedAccount && <span>{selectedAccount.name}</span>}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin" />
              </div>
            ) : (
              <>
                {(accounts?.length ?? 0) > 4 && (
                  <div className="px-2 pb-1">
                    <input
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}

                {filteredAccounts.map((a) => (
                  <div key={a.id} className="flex items-center pr-1">
                    <SelectItem value={a.id} className="flex-1">
                      {a.name}
                    </SelectItem>
                    {canCreateAccount ? (
                      <button
                        type="button"
                        className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-muted"
                        onClick={(e) => handleStartEdit(a, e)}
                      >
                        <Pencil className="size-3" />
                      </button>
                    ) : null}
                  </div>
                ))}

                {filteredAccounts.length === 0 && (
                  <div className="py-3 text-center text-sm text-muted-foreground">
                    Nenhuma conta encontrada
                  </div>
                )}

                {canCreateAccount ? (
                  <div className="mt-1 border-t pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-muted-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        resetForm();
                        setMode("create");
                        setPopoverOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      <span>Adicionar conta</span>
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </SelectContent>
        </Select>

        <Popover
          open={popoverOpen}
          onOpenChange={(open) => {
            setPopoverOpen(open);
            if (!open) resetForm();
          }}
          modal
        >
          <PopoverTrigger asChild>
            <PopoverAnchor className="pointer-events-none absolute left-0 top-0 h-full w-full" />
          </PopoverTrigger>
          <PopoverContent
            className="w-72"
            side="right"
            align="start"
            sideOffset={8}
            onOpenAutoFocus={(e: Event) => e.preventDefault()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {mode === "edit" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => resetForm()}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                  )}
                  <p className="text-sm font-medium">
                    {mode === "edit" ? "Editar Conta" : "Nova Conta"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => setPopoverOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <TextField
                label="Nome *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (mode === "edit") handleUpdate();
                    else handleCreate();
                  }
                }}
              />

              <SelectField
                label="Tipo"
                options={ACCOUNT_TYPE_OPTIONS}
                value={type}
                onValueChange={setType}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    if (mode === "edit") {
                      resetForm();
                    } else {
                      setPopoverOpen(false);
                      resetForm();
                    }
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  disabled={!name.trim() || isMutating}
                  onClick={mode === "edit" ? handleUpdate : handleCreate}
                >
                  {isMutating ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
