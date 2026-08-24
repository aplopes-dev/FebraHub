'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { anamnesisKeys } from './query-keys';
import {
  listAnamnesisQuestions,
  listAnamnesisTemplates,
} from '../services/anamnesis.service';

export function useAnamnesisTemplatesQuery() {
  const { storeId } = useStore();

  return useQuery({
    queryKey: anamnesisKeys.templates(storeId),
    queryFn: () => listAnamnesisTemplates(storeId),
    enabled: Boolean(storeId),
  });
}

export function useAnamnesisQuestionsQuery() {
  const { storeId } = useStore();

  return useQuery({
    queryKey: anamnesisKeys.questions(storeId),
    queryFn: () => listAnamnesisQuestions(storeId),
    enabled: Boolean(storeId),
    // Biblioteca global pode ser populada via seed após a página já ter carregado
    // com lista vazia — sempre revalidar ao montar/focar.
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
