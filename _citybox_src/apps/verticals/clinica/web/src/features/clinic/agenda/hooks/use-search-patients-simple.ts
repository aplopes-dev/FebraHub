import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { searchPatientsSimple } from '@/features/clinic/agenda/api/patients';

export interface PatientSimple {
  id: string;
  name: string;
  phone: string | null;
  avatar: string | null;
}

/**
 * Hook para buscar pacientes simples (apenas id, nome, telefone e avatar)
 * Usado em componentes de busca/select
 */
export function useSearchPatientsSimple(query?: string) {
  const { storeId } = useStore();

  return useQuery<PatientSimple[]>({
    queryKey: ['schedule', 'patients', 'search-simple', storeId ?? '', query],
    queryFn: () => searchPatientsSimple(storeId!, query),
    enabled: Boolean(storeId) && Boolean(query?.trim()),
    staleTime: 30 * 1000,
  });
}
