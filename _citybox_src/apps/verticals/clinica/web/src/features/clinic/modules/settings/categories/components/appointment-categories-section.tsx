'use client';

import { useCallback, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@citybox/ui/atoms';
import { ConfirmDialog } from '@citybox/ui/organisms';
import { AppointmentCategoryFormDialog } from '@/features/clinic/agenda/components/appointment-category-form-dialog';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/features/clinic/agenda/hooks/use-categories';
import { toastClinicaMutationError } from '@/features/clinic/shared/api';
import { Can, useCan } from '@/features/clinic/permissions';
import type { AppointmentCategoryApi } from '@/features/clinic/agenda/api/types';
import { AppointmentCategoriesTable } from './appointment-categories-table';

export function AppointmentCategoriesSection() {
  const canCreate = useCan('create', 'Category');
  const canUpdate = useCan('update', 'Category');
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AppointmentCategoryApi | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<AppointmentCategoryApi | null>(null);

  const handleOpenNew = useCallback(() => {
    setEditingCategory(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((category: AppointmentCategoryApi) => {
    setEditingCategory(category);
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingCategory(null);
  }, []);

  const handleSave = useCallback(
    async (input: { name: string; color: string }) => {
      try {
        if (editingCategory) {
          await updateCategory.mutateAsync({ id: editingCategory.id, data: input });
          toast.success('Categoria atualizada com sucesso.');
          return;
        }

        await createCategory.mutateAsync(input);
        toast.success('Categoria criada com sucesso.');
      } catch (error) {
        toastClinicaMutationError(error, 'Não foi possível salvar a categoria.');
        throw error;
      }
    },
    [createCategory, editingCategory, updateCategory],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingCategory) return;

    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      toast.success('Categoria excluída com sucesso.');
      setDeletingCategory(null);
    } catch (error) {
      toastClinicaMutationError(error, 'Não foi possível excluir a categoria.');
    }
  }, [deleteCategory, deletingCategory]);

  return (
    <>
      <div className="space-y-5 rounded-xl border border-border/60 bg-background p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-foreground">Categoria de Agendamento</h2>
            <p className="text-sm text-muted-foreground">
              Categorias usadas na agenda (consultas, retornos, procedimentos, etc.)
            </p>
          </div>

          <Can action="create" subject="Category">
            <Button type="button" onClick={handleOpenNew} disabled={isLoading}>
              <Plus className="mr-2 size-4" aria-hidden />
              Nova categoria
            </Button>
          </Can>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Carregando categorias…
          </div>
        ) : (
          <AppointmentCategoriesTable
            categories={categories}
            onEdit={canUpdate ? handleEdit : undefined}
            onDelete={canUpdate ? setDeletingCategory : undefined}
          />
        )}
      </div>

      {canCreate || canUpdate ? (
        <AppointmentCategoryFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
          editingCategory={editingCategory}
          onSave={handleSave}
          isSaving={createCategory.isPending || updateCategory.isPending}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
        title="Excluir categoria"
        description={
          deletingCategory
            ? `Excluir "${deletingCategory.name}"? Consultas vinculadas impedem a exclusão.`
            : undefined
        }
        confirmLabel="Excluir"
        confirmVariant="destructive"
        onConfirm={handleConfirmDelete}
        isConfirming={deleteCategory.isPending}
      />
    </>
  );
}
