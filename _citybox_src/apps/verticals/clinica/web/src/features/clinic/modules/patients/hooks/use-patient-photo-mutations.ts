'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deletePatientPhoto, uploadPatientPhoto } from '../services/patients.service';
import { patientKeys } from './query-keys';

export function usePatientPhotoMutations(storeId: string | null) {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ patientId, file }: { patientId: string; file: File }) =>
      uploadPatientPhoto(storeId!, patientId, file),
    onSuccess: (patient, variables) => {
      if (!storeId) return;
      queryClient.setQueryData(patientKeys.detail(storeId, variables.patientId), (current) =>
        current ? { ...current, patient } : current,
      );
      void queryClient.invalidateQueries({ queryKey: patientKeys.lists(storeId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (patientId: string) => deletePatientPhoto(storeId!, patientId),
    onSuccess: (patient, patientId) => {
      if (!storeId) return;
      queryClient.setQueryData(patientKeys.detail(storeId, patientId), (current) =>
        current ? { ...current, patient } : current,
      );
      void queryClient.invalidateQueries({ queryKey: patientKeys.lists(storeId) });
    },
  });

  return { uploadMutation, deleteMutation };
}
