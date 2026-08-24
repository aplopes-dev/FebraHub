"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import {
  Autocomplete,
  Button,
  ConfirmationDialog,
  CurrencyInput,
  EmptyState,
  PageHeader,
  toast,
} from "@citybox/mui";
import { FiscalScrollablePage, FormSection } from "@/components/ui/form";
import { useFiscalCompany } from "@/features/facilita-nfe/hooks/use-fiscal-company";
import { resolveFiscalDocumentStatusLabel } from "@/features/facilita-nfe/lib/fiscal-document-format";
import { useSelectableCustomersQuery } from "@/features/customers/hooks/use-customer-queries";
import { useIssqnGroupsQuery } from "@/features/fiscal-issqn-group/hooks/use-issqn-groups";
import { ISSQN_TRIB_TYPE_LABEL } from "@/features/fiscal-issqn-group/lib/issqn-options";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import {
  useCustomerFiscalInfoQuery,
  useIssueNfseMutation,
} from "../hooks/use-nfse-issuances";

function errorMessage(error: unknown): string {
  return businessErrorMessage(
    error,
    "Não foi possível emitir a NFS-e. Tente novamente.",
  );
}

/** Tela de emissão de NFS-e (spec erp/018) — base sobre a qual Vendas/OS plugam. */
export function NfseIssuancePage() {
  const fiscalCompany = useFiscalCompany();
  const customersQuery = useSelectableCustomersQuery();
  const groupsQuery = useIssqnGroupsQuery();
  const issueMutation = useIssueNfseMutation();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string>("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [totalValue, setTotalValue] = useState(0);
  const [issWithheld, setIssWithheld] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const customers = customersQuery.data ?? [];
  const groups = groupsQuery.data ?? [];
  const customerFiscalQuery = useCustomerFiscalInfoQuery(customerId);
  const selectedGroup = useMemo(
    () =>
      (groupsQuery.data ?? []).find((group) => group.id === groupId) ?? null,
    [groupsQuery.data, groupId],
  );
  const selectedCustomer = useMemo(
    () =>
      (customersQuery.data ?? []).find(
        (customer) => customer.id === customerId,
      ) ?? null,
    [customersQuery.data, customerId],
  );
  const customerFiscal = customerFiscalQuery.data ?? null;
  const customerHasDocument = Boolean(customerFiscal?.document);

  // spec erp/025 (P2): selo reflete o ambiente real do Emitente — nunca fixo.
  // A plataforma só sustenta emissão real em HOMOLOGATION hoje (ver
  // issue-nfse.use-case.ts); PRODUCTION é sinalizado com aviso mais forte e
  // bloqueia o Emitir, em vez de deixar o usuário descobrir só no 422 do backend.
  const environment = fiscalCompany.defaultEnvironment;
  const environmentUnsupported = environment === "PRODUCTION";
  const environmentLabel =
    environment === "PRODUCTION"
      ? "Ambiente: PRODUÇÃO (não suportado nesta plataforma)"
      : "Ambiente: HOMOLOGAÇÃO";

  const canEmit =
    Boolean(fiscalCompany.companyId) &&
    !environmentUnsupported &&
    Boolean(customerId) &&
    customerHasDocument &&
    Boolean(groupId) &&
    Boolean(serviceDescription.trim()) &&
    totalValue > 0 &&
    !issueMutation.isPending;

  async function handleConfirmEmit() {
    setConfirmOpen(false);
    if (!fiscalCompany.companyId || !customerFiscal) {
      toast.error(
        "Os dados do Emitente ou do cliente mudaram. Revise e tente novamente.",
      );
      return;
    }

    try {
      const issued = await issueMutation.mutateAsync({
        issqnGroupId: groupId,
        // Referência única por tentativa (base da idempotência). Gerada no
        // handler (não no render) para não violar a regra de pureza do lint.
        externalReference: crypto.randomUUID(),
        customer: customerFiscal,
        serviceDescription: serviceDescription.trim(),
        totalValue,
        issWithheld,
      });
      // spec erp/028 (B2/FR-004/FR-005): mesmo tratamento de nfe-issuance-page —
      // só AUTHORIZED é sucesso; REJECTED/DENIED foi transmitida com sucesso
      // técnico, mas recusada por um critério de negócio (toast.warning,
      // decisão do clarify), com código+mensagem do órgão em português.
      // Qualquer outro status (achado do react-reviewer: um `ERROR` síncrono
      // da fiscal-api não é uma recusa de negócio) usa toast.error.
      const statusLabel = resolveFiscalDocumentStatusLabel(issued.status);
      if (issued.status === "AUTHORIZED") {
        toast.success(`NFS-e ${statusLabel}.`, {
          description: issued.protocol
            ? `Protocolo ${issued.protocol}`
            : undefined,
        });
      } else {
        const description = issued.errorMessage
          ? `${issued.errorCode ? `[${issued.errorCode}] ` : ""}${issued.errorMessage}`
          : "Consulte o Facilita NF-e para mais detalhes.";
        if (issued.status === "REJECTED" || issued.status === "DENIED") {
          toast.warning(`NFS-e ${statusLabel}.`, { description });
        } else {
          toast.error(`NFS-e ${statusLabel}.`, { description });
        }
      }
    } catch (error) {
      toast.error("Falha ao emitir a NFS-e", {
        description: errorMessage(error),
      });
    }
  }

  const header = (
    <PageHeader
      title="Emitir NFS-e"
      description="Emissão de nota fiscal de serviço (Padrão Nacional)."
    />
  );

  if (fiscalCompany.isLoading) {
    return (
      <FiscalScrollablePage>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {header}
          <Skeleton variant="rounded" height={280} />
        </Box>
      </FiscalScrollablePage>
    );
  }

  if (fiscalCompany.isCompanyMissing) {
    return (
      <FiscalScrollablePage>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {header}
          <Alert
            severity="warning"
            action={
              <Button
                component={Link}
                href="/configuracoes/fiscal"
                size="small"
              >
                Configurar
              </Button>
            }
          >
            Emitente fiscal não configurado. Cadastre o certificado digital em
            Configurações → Fiscal antes de emitir.
          </Alert>
        </Box>
      </FiscalScrollablePage>
    );
  }

  return (
    <FiscalScrollablePage>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {header}

        <Chip
          label={environmentLabel}
          color={environmentUnsupported ? "error" : "warning"}
          variant="outlined"
          sx={{ alignSelf: "flex-start" }}
        />

        {environmentUnsupported ? (
          <Alert
            severity="error"
            action={
              <Button
                component={Link}
                href="/configuracoes/fiscal?aba=geral"
                size="small"
              >
                Ajustar ambiente
              </Button>
            }
          >
            O Emitente está configurado para PRODUÇÃO, mas esta plataforma
            ainda só emite em homologação. Ajuste o ambiente em Configurações
            → Fiscal antes de emitir.
          </Alert>
        ) : null}

        <FormSection
          title="Tomador e serviço"
          description="Escolha o cliente, o grupo de ISSQN e descreva o serviço prestado."
        >
          <Stack spacing={2.5}>
            <Autocomplete
              id="nfse-customer"
              label="Tomador (cliente)"
              options={customers}
              loading={customersQuery.isPending}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedCustomer}
              onChange={(_e, option) => setCustomerId(option?.id ?? null)}
              disabled={issueMutation.isPending}
              noOptionsText={
                // spec erp/027 (B3/FR-009): mesma varredura da tela de NF-e —
                // "No options" em inglês não explica o pré-requisito. Texto
                // puro aqui (achado do react-reviewer): um link dentro do
                // `noOptionsText` do MUI Autocomplete fica fora do
                // `listboxRef` que segura o foco, então Tab fecha o dropdown
                // antes do link ganhar foco — inacessível por teclado. O
                // atalho real vem do Alert abaixo, fora do popper.
                "Nenhum cliente cadastrado. Cadastre um cliente para poder emitir a NFS-e."
              }
            />

            {!customersQuery.isPending && customers.length === 0 ? (
              <Alert
                severity="info"
                action={
                  <Button component={Link} href="/clientes/novo" size="small">
                    Cadastrar cliente
                  </Button>
                }
              >
                Nenhum cliente cadastrado ainda.
              </Alert>
            ) : null}

            {customerId && customerFiscalQuery.isError ? (
              <Alert severity="error">
                Não foi possível carregar os dados fiscais do cliente. Tente
                novamente.
              </Alert>
            ) : customerId &&
              !customerFiscalQuery.isPending &&
              !customerHasDocument ? (
              <Alert severity="warning">
                O cliente selecionado não tem CPF/CNPJ cadastrado. Informe o
                documento no cadastro do cliente antes de emitir a NFS-e.
              </Alert>
            ) : null}

            {groupsQuery.isError || customersQuery.isError ? (
              <Alert severity="error">
                Não foi possível carregar clientes ou grupos de ISSQN.
                Recarregue a página.
              </Alert>
            ) : null}

            {!groupsQuery.isPending && groups.length === 0 ? (
              <EmptyState
                icon={<ReceiptLongOutlined sx={{ fontSize: 24 }} />}
                title="Nenhum Grupo de ISSQN cadastrado"
                description="É preciso cadastrar um Grupo de ISSQN antes de emitir NFS-e — ele define o código municipal, a exigibilidade e a alíquota da nota."
                action={
                  <Button
                    component={Link}
                    href="/configuracoes/fiscal/grupos?tributo=issqn"
                  >
                    Cadastrar Grupo de ISSQN
                  </Button>
                }
              />
            ) : (
              <FormControl fullWidth disabled={issueMutation.isPending}>
                <InputLabel id="nfse-group-label">Grupo de ISSQN</InputLabel>
                <Select
                  labelId="nfse-group-label"
                  label="Grupo de ISSQN"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {selectedGroup ? (
              <Alert severity="info" variant="outlined">
                Código municipal <b>{selectedGroup.issqnServiceCode}</b> ·
                cTribNac <b>{selectedGroup.issqnNationalCode}</b> ·
                Exigibilidade{" "}
                <b>
                  {selectedGroup.issqnTribType
                    ? (ISSQN_TRIB_TYPE_LABEL[selectedGroup.issqnTribType] ??
                      selectedGroup.issqnTribType)
                    : "—"}
                </b>
                {selectedGroup.issqnRate != null
                  ? ` · Alíquota ${selectedGroup.issqnRate}%`
                  : ""}
              </Alert>
            ) : null}

            <TextField
              label="Descrição do serviço"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              multiline
              minRows={2}
              disabled={issueMutation.isPending}
              fullWidth
            />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <CurrencyInput
                label="Valor do serviço"
                value={totalValue}
                onValueChange={(value) => setTotalValue(value ?? 0)}
                disabled={issueMutation.isPending}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={issWithheld}
                      onChange={(e) => setIssWithheld(e.target.checked)}
                      disabled={issueMutation.isPending}
                    />
                  }
                  label="Há retenção de ISS"
                />
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", display: "block" }}
                >
                  A alíquota do grupo só é transmitida à nota quando há
                  retenção. Sem retenção, quem define a alíquota é o município.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </FormSection>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="contained"
            onClick={() => setConfirmOpen(true)}
            loading={issueMutation.isPending}
            disabled={!canEmit}
          >
            Emitir NFS-e
          </Button>
        </Box>

        <ConfirmationDialog
          open={confirmOpen}
          loading={issueMutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmEmit}
          title={`Emitir NFS-e em ${environment === "PRODUCTION" ? "PRODUÇÃO" : "HOMOLOGAÇÃO"}?`}
          description="A emissão é irreversível dentro do prazo legal. Confirme que os dados estão corretos antes de transmitir."
          confirmLabel="Emitir"
        />
      </Box>
    </FiscalScrollablePage>
  );
}
