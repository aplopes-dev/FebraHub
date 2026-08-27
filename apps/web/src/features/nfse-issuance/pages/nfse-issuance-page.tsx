"use client";

import { useMemo, useState } from "react";
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
import {
  Autocomplete,
  Button,
  ConfirmationDialog,
  CurrencyInput,
  PageHeader,
  toast,
} from "@/ui";
import { FiscalScrollablePage, FormSection } from "@/components/ui/form";
import { useFiscalCompany } from "@/features/facilita-nfe/hooks/use-fiscal-company";
import { useSelectableCustomersQuery } from "@/features/customers/hooks/use-customer-queries";
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
  const issueMutation = useIssueNfseMutation();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string>("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [totalValue, setTotalValue] = useState(0);
  const [issWithheld, setIssWithheld] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const customers = customersQuery.data ?? [];
  const groups: { id: string; name: string }[] = [];
  const customerFiscalQuery = useCustomerFiscalInfoQuery(customerId);
  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === groupId) ?? null,
    [groups, groupId],
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

  const canEmit =
    Boolean(fiscalCompany.companyId) &&
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
      toast.success(`NFS-e ${issued.status}.`, {
        description: issued.protocol
          ? `Protocolo ${issued.protocol}`
          : undefined,
      });
    } catch (error) {
      toast.error("Falha ao emitir a NFS-e", {
        description: errorMessage(error),
      });
    }
  }

  const header = (
    <PageHeader
      title="Emitir NFS-e"
      description="Emissão de nota fiscal de serviço (Padrão Nacional) — ambiente de homologação."
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
          <Alert severity="warning">
            Emitente fiscal não configurado. Configure o certificado digital da
            empresa antes de emitir NFS-e.
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
          label="Ambiente: HOMOLOGAÇÃO"
          color="warning"
          variant="outlined"
          sx={{ alignSelf: "flex-start" }}
        />

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
            />

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

            {customersQuery.isError ? (
              <Alert severity="error">
                Não foi possível carregar clientes. Recarregue a página.
              </Alert>
            ) : null}

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

            {selectedGroup ? (
              <Alert severity="info" variant="outlined">
                Grupo selecionado: <b>{selectedGroup.name}</b>
              </Alert>
            ) : groups.length === 0 ? (
              <Alert severity="warning" variant="outlined">
                Nenhum grupo de ISSQN disponível para seleção.
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
          title="Emitir NFS-e em HOMOLOGAÇÃO?"
          description="A emissão é irreversível dentro do prazo legal. Confirme que os dados estão corretos antes de transmitir."
          confirmLabel="Emitir"
        />
      </Box>
    </FiscalScrollablePage>
  );
}
