import { useQuery } from "@tanstack/react-query";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import {
  financialService,
  type ListEntriesParams,
} from "../services/financial.service";

/** @deprecated Prefer patient-financial-entries da ficha. Mantido por compatibilidade. */
export function usePatientFinancialEntries(
  patientId: string,
  params?: Omit<ListEntriesParams, "patientId" | "types">,
) {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: ["patient-financial", clinicId, patientId, params],
    queryFn: () =>
      financialService.entries.list(clinicId, {
        patientId,
        types: "income",
        perPage: 100,
        ...params,
      }),
    enabled: isReady && !!patientId,
    staleTime: 0,
    gcTime: 0,
  });
}
