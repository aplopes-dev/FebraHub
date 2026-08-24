"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { toast } from "@citybox/mui";

import { useOrganization } from "@/lib/organization-context";
import { getCurrentOrganizationApi } from "@/features/company-settings/api/organization-current.service";
import { useFiscalCompany } from "@/features/facilita-nfe/hooks/use-fiscal-company";

import { useFiscalCertificates } from "../hooks/use-fiscal-certificates";
import { useUploadCertificate } from "../hooks/use-upload-certificate";
import {
  splitCurrentAndHistory,
  toCertificateViews,
} from "../lib/select-current";
import { translateCertificateError } from "../lib/error-translate";
import { CertificateEmptyState } from "../components/empty-state";
import { CurrentCertificateCard } from "../components/current-certificate-card";
import { CertificateHistoryTable } from "../components/history-table";
import { UploadModal } from "../components/upload-modal";
import type { CertificateUploadInput } from "../types/certificate";

const ORG_STALE_MS = 5 * 60 * 1000;

/** Aba "Certificado" da tela Fiscal — Certificado Digital A1 (US1/US2/US3). */
export function FiscalCertificateTab() {
  const { organizationId, hydrated } = useOrganization();

  // Mesma queryKey/queryFn de `useFiscalCompany` → o React Query compartilha o
  // cache (sem fetch duplicado); aqui só precisamos do platformStoreId.
  const organizationQuery = useQuery({
    queryKey: ["comercio", "organization-current", organizationId],
    queryFn: getCurrentOrganizationApi,
    enabled: hydrated && Boolean(organizationId),
    staleTime: ORG_STALE_MS,
  });

  const { companyId, isCompanyMissing, isLoading: companyLoading } =
    useFiscalCompany();
  const certificatesQuery = useFiscalCertificates(companyId);
  const uploadMutation = useUploadCertificate({ companyId, isCompanyMissing });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  function openModal() {
    setModalKey((key) => key + 1);
    setModalOpen(true);
  }

  function handleSubmit(input: CertificateUploadInput) {
    uploadMutation.mutate(input, {
      onSuccess: () => {
        setModalOpen(false);
        toast.success("Certificado enviado com sucesso.");
        // Descarta a referência às variáveis da mutation (que contêm a senha)
        // assim que o envio conclui — defesa em profundidade (FR-019).
        uploadMutation.reset();
      },
    });
  }

  const platformStoreId = organizationQuery.data?.platformStoreId ?? null;
  const storeNotEnabled =
    organizationQuery.isSuccess &&
    platformStoreId === null &&
    isCompanyMissing;

  const loading =
    !hydrated ||
    organizationQuery.isLoading ||
    companyLoading ||
    (Boolean(companyId) && certificatesQuery.isLoading);

  const views = toCertificateViews(certificatesQuery.data?.certificates ?? []);
  const statusUnavailable = certificatesQuery.data?.statusUnavailable ?? false;
  const { current, history } = splitCurrentAndHistory(views);

  const uploadError = uploadMutation.isError
    ? translateCertificateError(uploadMutation.error)
    : null;

  return (
    <>
      <Stack spacing={2} sx={{ mt: 1 }}>
        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={140} />
            <Skeleton variant="rounded" height={120} />
          </Stack>
        ) : storeNotEnabled ? (
          <Alert severity="warning">
            Esta loja ainda não está habilitada para a parte fiscal. O vínculo
            com a plataforma não foi concluído — fale com o suporte para
            habilitar a emissão de notas fiscais.
          </Alert>
        ) : certificatesQuery.isError ? (
          <Alert severity="error">
            Não foi possível carregar os certificados. Tente novamente.
          </Alert>
        ) : current ? (
          <>
            {statusUnavailable ? (
              <Alert severity="warning">
                Não foi possível calcular os dias restantes de um ou mais
                certificados agora. Os demais dados seguem corretos.
              </Alert>
            ) : null}
            <CurrentCertificateCard certificate={current} onReplace={openModal} />
            <CertificateHistoryTable certificates={history} />
          </>
        ) : (
          <CertificateEmptyState onInsert={openModal} />
        )}
      </Stack>

      {modalOpen ? (
        <UploadModal
          key={modalKey}
          open={modalOpen}
          title="Enviar certificado digital"
          isSubmitting={uploadMutation.isPending}
          errorMessage={uploadError}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  );
}
