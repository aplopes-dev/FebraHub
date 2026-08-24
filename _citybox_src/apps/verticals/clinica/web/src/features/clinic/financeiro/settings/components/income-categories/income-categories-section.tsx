"use client";

import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button, Input } from "@citybox/ui/atoms";
import { ModalForm, ConfirmDialog } from "@citybox/ui/organisms";

import {
  useIncomeCategories,
  useCreateIncomeCategory,
  useUpdateIncomeCategory,
  useDeleteIncomeCategory,
} from "../../../hooks/use-income-categories";
import { useFinancialPermissions } from "../../../hooks/use-financial-permissions";
import type { IncomeCategory } from "../../../services/financial.service";
import { IncomeCategoryForm } from "./income-category-form";
import { IncomeCategoriesTable } from "./income-categories-table";

const FORM_ID = "income-category-form";

function submitForm() {
  (document.getElementById(FORM_ID) as HTMLFormElement | null)?.requestSubmit();
}

export function IncomeCategoriesSection() {
  const [search, setSearch] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IncomeCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<IncomeCategory | null>(null);

  const { canCreateCategory, canDeleteCategory } = useFinancialPermissions();
  const { data: categories = [], isLoading } = useIncomeCategories();
  const createMutation = useCreateIncomeCategory();
  const updateMutation = useUpdateIncomeCategory();
  const deleteMutation = useDeleteIncomeCategory();

  const filtered = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [categories, search]
  );

  const handleEdit = (category: IncomeCategory) => {
    setEditingCategory(category);
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (values: { name: string; color: string }) => {
    if (editingCategory) {
      updateMutation.mutate(
        { id: editingCategory.id, data: values },
        {
          onSuccess: () => {
            toast.success("Categoria atualizada");
            handleCloseSheet();
          },
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Categoria criada");
          handleCloseSheet();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!deletingCategory) return;
    deleteMutation.mutate(deletingCategory.id, {
      onSuccess: () => setDeletingCategory(null),
      onError: () => {
        toast.error("Não é possível excluir uma categoria com lançamentos vinculados");
        setDeletingCategory(null);
      },
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Categorias de Receita</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Classifique os lançamentos de entrada por categoria.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {canCreateCategory ? (
          <Button onClick={() => setIsSheetOpen(true)}>
            <Plus className="size-4 mr-2" />
            Nova Categoria
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground text-sm">
          Carregando categorias...
        </div>
      ) : (
        <IncomeCategoriesTable
          categories={filtered}
          canEdit={canCreateCategory}
          canDelete={canDeleteCategory}
          onEdit={handleEdit}
          onDelete={setDeletingCategory}
        />
      )}

      <ModalForm
        open={isSheetOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseSheet();
          else setIsSheetOpen(true);
        }}
        title={editingCategory ? "Editar Categoria" : "Nova Categoria de Receita"}
        saveLabel={editingCategory ? "Salvar alterações" : "Criar categoria"}
        isSaving={isPending}
        onSave={submitForm}
      >
        <IncomeCategoryForm
          defaultValues={editingCategory ?? undefined}
          onSubmit={handleSubmit}
          formId={FORM_ID}
        />
      </ModalForm>

      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
        onConfirm={handleDelete}
        isConfirming={deleteMutation.isPending}
        title="Excluir categoria"
        description={`A categoria ${deletingCategory?.name ?? ""} será excluída permanentemente. Os lançamentos vinculados a ela não serão afetados.`}
        confirmVariant="destructive"
        confirmLabel="Excluir"
      />
    </div>
  );
}
