'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  listPatientNutritionNotes,
  savePatientNutritionNote,
} from '../services/patient-nutrition-notes.service';
import { treatmentKeys } from './query-keys';
import type { SavePatientNutritionNoteInput } from '../types/patient-nutrition-note';

export function usePatientNutritionNotesQuery(
  patientId: string | null,
  evolutionId: string | null,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: treatmentKeys.nutritionNotes(
      storeId ?? '',
      patientId ?? '',
      evolutionId ?? '',
    ),
    queryFn: () =>
      listPatientNutritionNotes(storeId!, patientId!, evolutionId!),
    enabled: Boolean(storeId) && Boolean(patientId) && Boolean(evolutionId),
  });
}

export function usePatientNutritionNoteMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const saveNote = useMutation({
    mutationFn: (input: SavePatientNutritionNoteInput) =>
      savePatientNutritionNote(storeId!, patientId!, input),
    onSuccess: (_note, input) => {
      if (!storeId || !patientId) return;
      void queryClient.invalidateQueries({
        queryKey: treatmentKeys.nutritionNotes(
          storeId,
          patientId,
          input.evolutionId,
        ),
      });
    },
  });

  return { saveNote };
}
