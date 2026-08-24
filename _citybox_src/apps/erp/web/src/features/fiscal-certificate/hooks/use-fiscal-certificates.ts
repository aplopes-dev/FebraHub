"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCertificateStatusApi,
  listCertificatesApi,
} from "../api/fiscal-certificate.service";
import { fiscalCertificateKeys } from "./query-keys";
import type { Certificate } from "../types/certificate";

const STALE_TIME_MS = 60 * 1000;

export type FiscalCertificatesResult = {
  certificates: Certificate[];
  /**
   * `true` quando `GET /certificates/{id}/status` falhou para pelo menos um
   * certificado (BUG-03, 2026-08-13) — antes o erro era engolido em
   * silêncio (`catch {}`) e a UI nunca informava que "Dias restantes" tinha
   * ficado vazio por falha, não por falta do dado.
   */
  statusUnavailable: boolean;
};

/**
 * Lista os certificados do Emitente e enriquece cada um com `daysUntilExpiration`
 * (via `/certificates/{id}/status`). A lista é pequena (certificados de um único
 * Emitente), então buscar o status de cada um em paralelo é aceitável.
 */
export function useFiscalCertificates(companyId: string | null) {
  return useQuery({
    queryKey: companyId
      ? fiscalCertificateKeys.list(companyId)
      : fiscalCertificateKeys.all,
    enabled: Boolean(companyId),
    staleTime: STALE_TIME_MS,
    queryFn: async (): Promise<FiscalCertificatesResult> => {
      const certificates = await listCertificatesApi(companyId as string);
      let statusUnavailable = false;
      const withStatus = await Promise.all(
        certificates.map(async (cert) => {
          try {
            const { daysUntilExpiration } = await getCertificateStatusApi(
              cert.id,
              companyId as string,
            );
            return { ...cert, daysUntilExpiration };
          } catch {
            // O status é complementar; se falhar, seguimos sem os dias
            // restantes, mas sinalizamos — não escondemos a falha da UI.
            statusUnavailable = true;
            return cert;
          }
        }),
      );
      return { certificates: withStatus, statusUnavailable };
    },
  });
}
