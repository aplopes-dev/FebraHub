'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store-context';
import {
  getCategoryErrorMessage,
  usePatientCategoriesQuery,
  usePatientCategoryMutations,
} from '../hooks/use-patient-categories-query';
import type { PatientCategory, PatientCategoryInput } from '../types/patient-category';

export function usePatientCategories() {
  const { storeId } = useStore();
  const categoriesQuery = usePatientCategoriesQuery(storeId);
  const { createMutation, updateMutation, deleteMutation } = usePatientCategoryMutations(storeId);

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  const addCategory = useCallback(
    async (input: PatientCategoryInput): Promise<PatientCategory> => {
      if (!storeId) {
        throw new Error('Loja não selecionada.');
      }
      try {
        return await createMutation.mutateAsync(input);
      } catch (error) {
        toast.error(getCategoryErrorMessage(error));
        throw error;
      }
    },
    [createMutation, storeId],
  );

  const updateCategory = useCallback(
    async (id: string, input: PatientCategoryInput): Promise<PatientCategory | null> => {
      if (!storeId) return null;
      try {
        return await updateMutation.mutateAsync({ id, input });
      } catch (error) {
        toast.error(getCategoryErrorMessage(error));
        throw error;
      }
    },
    [storeId, updateMutation],
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      if (!storeId) return false;

      const category = categories.find((item) => item.id === id);
      if (category?.isProtected) {
        toast.error('Esta categoria é protegida e não pode ser excluída.');
        return false;
      }

      try {
        await deleteMutation.mutateAsync(id);
        return true;
      } catch (error) {
        toast.error(getCategoryErrorMessage(error));
        return false;
      }
    },
    [categories, deleteMutation, storeId],
  );

  return {
    categories,
    isLoading: categoriesQuery.isLoading,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
