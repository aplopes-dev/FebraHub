"use client";

import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiscalApiError } from "@/lib/api/fiscal-client";
import {
  createCompanyApi,
  getHeadquartersBranchApi,
  getPlatformStoreIdApi,
  uploadCertificateApi,
} from "../api/fiscal-certificate.service";
import { buildProvisionPayload } from "../lib/build-provision-payload";
import { ProvisionDataError, type CertificateUploadInput } from "../types/certificate";

type UseUploadCertificateArgs = {
  companyId: string | null;
  isCompanyMissing: boolean;
};

/**
 * Envia o certificado. Se o Emitente ainda não existe (`isCompanyMissing`),
 * provisiona-o antes a partir da filial matriz (FR-005) e então faz o upload.
 * Erros de provisionamento (FR-007/008/009) e de upload (FR-012) são traduzidos
 * em mensagem de negócio.
 */
export function useUploadCertificate({
  companyId,
  isCompanyMissing,
}: UseUploadCertificateArgs) {
  const queryClient = useQueryClient();
  // Lembra o Emitente recém-provisionado nesta sessão de modal: se o upload
  // falhar (ex.: senha errada) e o usuário tentar de novo, reusa este id em vez
  // de provisionar o Emitente outra vez para o mesmo CNPJ.
  const provisionedCompanyIdRef = useRef<string | null>(null);

  return useMutation({
    mutationFn: async (input: CertificateUploadInput) => {
      let targetCompanyId = companyId ?? provisionedCompanyIdRef.current;

      if (!targetCompanyId) {
        if (!isCompanyMissing) {
          // Ainda resolvendo o Emitente — não é seguro provisionar em cima.
          throw new Error(
            "Aguarde o carregamento dos dados da empresa e tente novamente.",
          );
        }

        const [branch, platformStoreId] = await Promise.all([
          getHeadquartersBranchApi(),
          getPlatformStoreIdApi(),
        ]);

        const built = buildProvisionPayload({ branch, platformStoreId });
        if (!built.ok) {
          throw new ProvisionDataError(
            built.message,
            built.actionHref,
            built.actionLabel,
          );
        }

        let created: { id: string };
        try {
          created = await createCompanyApi(built.payload);
        } catch (error) {
          // Erro de provisionamento (ex.: CNPJ já registrado, dado inválido):
          // repassa a mensagem de domínio da API como Error simples, para não
          // cair na tradução específica de upload (que falaria em "certificado").
          if (error instanceof FiscalApiError) {
            throw new Error(
              error.message ||
                "Não foi possível provisionar o Emitente fiscal. Tente novamente.",
            );
          }
          throw error;
        }
        targetCompanyId = created.id;
        provisionedCompanyIdRef.current = created.id;
      }

      return uploadCertificateApi(targetCompanyId, {
        file: input.file,
        password: input.password,
        name: input.name,
      });
    },
    onSuccess: async () => {
      provisionedCompanyIdRef.current = null;
      // Reresolve companyId (facilita-nfe) e recarrega a lista de certificados.
      await queryClient.invalidateQueries({ queryKey: ["fiscal"] });
    },
  });
}
