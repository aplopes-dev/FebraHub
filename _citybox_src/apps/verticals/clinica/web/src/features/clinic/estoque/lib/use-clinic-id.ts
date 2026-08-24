import { useStore } from "@/lib/store-context";

/**
 * `storeId` da clínica atual (multi-tenant) consumido nas rotas do `clinica-api`.
 */
export function useClinicId(): { clinicId: string; isReady: boolean } {
  const { storeId, loading } = useStore();
  const clinicId = storeId ?? "";
  return { clinicId, isReady: Boolean(clinicId) && !loading };
}
