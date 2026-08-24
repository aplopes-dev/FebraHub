'use client';

import { useQuery } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import { listPatientWhatsappMessages } from '../services/patient-whatsapp-messages.service';

const PREVIEW_PER_PAGE = 2;
const EXPANDED_PER_PAGE = 100;

type UsePatientWhatsappMessagesQueryOptions = {
  expanded?: boolean;
};

export function usePatientWhatsappMessagesQuery(
  patientId: string | null,
  options: UsePatientWhatsappMessagesQueryOptions = {},
) {
  const { storeId } = useStore();
  const expanded = options.expanded ?? false;
  const perPage = expanded ? EXPANDED_PER_PAGE : PREVIEW_PER_PAGE;

  return useQuery({
    queryKey: ['patient-whatsapp-messages', storeId, patientId, perPage],
    queryFn: () =>
      listPatientWhatsappMessages(storeId!, patientId!, { page: 1, perPage }),
    enabled: Boolean(storeId) && Boolean(patientId),
    placeholderData: (previous) => previous,
  });
}

export { PREVIEW_PER_PAGE };
