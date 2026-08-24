'use client';

import { useCallback, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@citybox/ui/atoms';
import { Can, useCan } from '@/features/clinic/permissions';
import { usePatientCategories } from '@/features/clinic/modules/patients/lib/use-patient-categories';
import type {
  PatientCategory,
  PatientCategoryInput,
} from '@/features/clinic/modules/patients/types/patient-category';
import { ClinicPatientCategoriesTable } from '../components/clinic-patient-categories-table';
import { PatientCategoryFormDialog } from '../components/patient-category-form-dialog';

/** Configurações — categorias de paciente. */
export function PatientCategoriesSettingsContent() {
  const canCreate = useCan('create', 'Category');
  const canUpdate = useCan('update', 'Category');
  const { categories, isLoading, addCategory, updateCategory, deleteCategory } =
    usePatientCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PatientCategory | null>(
    null,
  );

  const handleOpenNewCategory = useCallback(() => {
    setEditingCategory(null);
    setDialogOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: PatientCategory) => {
    setEditingCategory(category);
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingCategory(null);
    }
  }, []);

  const handleSaveCategory = useCallback(
    async (input: PatientCategoryInput) => {
      try {
        if (editingCategory) {
          await updateCategory(editingCategory.id, input);
          toast.success('Categoria atualizada com sucesso.');
          return;
        }

        await addCategory(input);
        toast.success('Categoria criada com sucesso.');
      } catch {
        // Erro já tratado no hook de categorias.
      }
    },
    [addCategory, editingCategory, updateCategory],
  );

  const handleDeleteCategory = useCallback(
    async (category: PatientCategory) => {
      const deleted = await deleteCategory(category.id);
      if (deleted) {
        toast.success('Categoria excluída com sucesso.');
      }
    },
    [deleteCategory],
  );

  return (
    <div className="space-y-5 rounded-xl border border-border/60 bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-foreground">Categoria de Paciente</h2>
          <p className="text-sm text-muted-foreground">
            Categorias usadas no cadastro e filtros de pacientes
          </p>
        </div>

        <Can action="create" subject="Category">
          <Button type="button" onClick={handleOpenNewCategory} disabled={isLoading}>
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
        <ClinicPatientCategoriesTable
          categories={categories}
          onEdit={canUpdate ? handleEditCategory : undefined}
          onDelete={canUpdate ? handleDeleteCategory : undefined}
        />
      )}

      {canCreate || canUpdate ? (
        <PatientCategoryFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogOpenChange}
          editingCategory={editingCategory}
          onSave={handleSaveCategory}
        />
      ) : null}
    </div>
  );
}
