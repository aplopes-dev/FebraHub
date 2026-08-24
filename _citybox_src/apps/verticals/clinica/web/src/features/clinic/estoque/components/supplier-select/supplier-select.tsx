"use client";

import { useId, useState } from "react";
import { ArrowLeft, ChevronDown, Loader2, Pencil, Plus, X } from "lucide-react";

import { cn } from "@citybox/ui";
import {
  Button,
  Input,
  Label as FieldLabel,
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@citybox/ui/atoms";

import { formatPhone } from "@/features/clinic/modules/settings/lib/format-clinic-fields";

import { useSuppliers } from "../../hooks/use-suppliers";
import { useCreateSupplier } from "../../hooks/use-create-supplier";
import { useUpdateSupplier } from "../../hooks/use-update-supplier";
import type { Supplier } from "../../types";

type PopoverMode = "idle" | "create" | "edit";

interface SupplierSelectProps {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
  id?: string;
  error?: boolean;
  disabled?: boolean;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  type?: string;
  placeholder?: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

function InlineField({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  onKeyDown,
}: FieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={id} className={cn(error && "text-destructive")}>
        {label}
      </FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        aria-invalid={error}
        className={cn(error && "border-destructive")}
      />
    </div>
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function SupplierSelect({
  value,
  onValueChange,
  label = "Fornecedor",
  className,
  id: externalId,
  error,
  disabled,
}: SupplierSelectProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [mode, setMode] = useState<PopoverMode>("idle");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);

  const { data: suppliers, isLoading } = useSuppliers();
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();

  const selectedSupplier = suppliers?.find((s) => s.id === value);

  const filteredSuppliers =
    suppliers?.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ) ?? [];

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setEmailError(false);
    setEditingSupplier(null);
    setMode("idle");
    setSearchTerm("");
  };

  const handleStartEdit = (supplier: Supplier, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setEditingSupplier(supplier);
    setName(supplier.name);
    setPhone(supplier.phone ? formatPhone(supplier.phone) : "");
    setEmail(supplier.email ?? "");
    setEmailError(false);
    setMode("edit");
    setPopoverOpen(true);
    setSelectorOpen(false);
  };

  const validateAndSave = (onSave: () => void) => {
    if (email.trim() && !isValidEmail(email.trim())) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
    onSave();
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    validateAndSave(() =>
      createMutation.mutate(
        { name: name.trim(), phone: phone || undefined, email: email || undefined },
        {
          onSuccess: (newSupplier) => {
            onValueChange(newSupplier.id);
            resetForm();
            setPopoverOpen(false);
          },
        },
      ),
    );
  };

  const handleUpdate = () => {
    if (!name.trim() || !editingSupplier) return;
    validateAndSave(() =>
      updateMutation.mutate(
        {
          id: editingSupplier.id,
          data: { name: name.trim(), phone: phone || null, email: email || null },
        },
        {
          onSuccess: () => resetForm(),
        },
      ),
    );
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={cn("relative flex flex-col gap-1.5", className)}>
      <FieldLabel
        htmlFor={id}
        className={cn(disabled && "opacity-50", error && "text-destructive")}
      >
        {label}
      </FieldLabel>

      <Popover open={selectorOpen} onOpenChange={setSelectorOpen} modal={false}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={selectorOpen}
            disabled={disabled || isLoading}
            className={cn(
              "flex h-9 w-full items-center justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive",
              !selectedSupplier && !isLoading && "text-muted-foreground",
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Carregando...
              </span>
            ) : selectedSupplier ? (
              <span className="truncate">{selectedSupplier.name}</span>
            ) : (
              <span>Selecionar</span>
            )}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={4}
          className="w-(--radix-popover-trigger-width) gap-0 p-0"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <div className="p-1.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-4 animate-spin" />
              </div>
            ) : (suppliers?.length ?? 0) === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum fornecedor encontrado
              </div>
            ) : (
              <>
                {(suppliers?.length ?? 0) > 4 ? (
                  <div className="pb-1">
                    <input
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </div>
                ) : null}

                {filteredSuppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      value === supplier.id && "bg-accent text-accent-foreground",
                    )}
                    onClick={() => {
                      onValueChange(supplier.id);
                      setSelectorOpen(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      onValueChange(supplier.id);
                      setSelectorOpen(false);
                    }}
                  >
                    <span className="truncate">{supplier.name}</span>

                    <button
                      type="button"
                      className="flex size-6 shrink-0 items-center justify-center rounded hover:bg-muted"
                      onClick={(event) => handleStartEdit(supplier, event)}
                    >
                      <Pencil className="size-3" />
                    </button>
                  </div>
                ))}

                {filteredSuppliers.length === 0 ? (
                  <div className="py-3 text-center text-sm text-muted-foreground">
                    Nenhum fornecedor encontrado
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="border-t border-border/60 p-1.5">
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-full justify-start gap-2 px-2 font-normal text-muted-foreground"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                resetForm();
                setMode("create");
                setPopoverOpen(true);
                setSelectorOpen(false);
              }}
            >
              <Plus className="size-4" aria-hidden />
              Criar fornecedor
            </Button>
          </div>
        </PopoverContent>
      </Popover>

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
          onOpenAutoFocus={(event) => event.preventDefault()}
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
                  {mode === "edit" ? "Editar Fornecedor" : "Novo Fornecedor"}
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

            <InlineField
              label="Nome *"
              value={name}
              onChange={setName}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (mode === "edit") handleUpdate();
                  else handleCreate();
                }
              }}
            />

            <InlineField
              label="Telefone"
              value={phone}
              onChange={(value) => setPhone(formatPhone(value))}
              type="tel"
              placeholder="(00) 00000-0000"
            />

            <div className="space-y-1">
              <InlineField
                label="Email"
                value={email}
                error={emailError}
                onChange={(next) => {
                  setEmail(next);
                  if (emailError) setEmailError(false);
                }}
              />
              {emailError && <p className="text-xs text-destructive">Email inválido</p>}
            </div>

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
  );
}
