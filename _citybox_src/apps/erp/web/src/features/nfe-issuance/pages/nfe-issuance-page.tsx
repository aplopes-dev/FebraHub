"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import {
  Autocomplete,
  Button,
  ConfirmationDialog,
  PageHeader,
  toast,
} from "@citybox/mui";
import { FiscalScrollablePage, FormSection } from "@/components/ui/form";
import { useFiscalCompany } from "@/features/facilita-nfe/hooks/use-fiscal-company";
import { resolveFiscalDocumentStatusLabel } from "@/features/facilita-nfe/lib/fiscal-document-format";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import {
  useCustomerNfeFiscalInfoQuery,
  useEligibleSaleOrdersQuery,
  useIssueNfeMutation,
  useNfePreviewQuery,
} from "../hooks/use-nfe-issuances";
import type { EligibleSaleOrder } from "../api/nfe-issuance.service";

function errorMessage(error: unknown): string {
  return businessErrorMessage(
    error,
    "Não foi possível emitir a NF-e. Tente novamente.",
  );
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const TRIBUTO_LABEL: Record<"ICMS" | "PIS_COFINS" | "IPI", string> = {
  ICMS: "ICMS",
  PIS_COFINS: "PIS/COFINS",
  IPI: "IPI",
};

/**
 * Tela de emissão de NF-e a partir de um pedido de venda (spec erp/026) — a
 * primeira do ERP que resolve ICMS/PIS-COFINS/IPI reais do produto (não
 * fallback zerado nem dado manual, como a emissão via Swagger expunha).
 * `FiscalScrollablePage` desde o início (não repete o gap que `nfse-issuance`
 * teve — corrigido só depois, spec 022).
 */
export function NfeIssuancePage() {
  const fiscalCompany = useFiscalCompany();
  const issueMutation = useIssueNfeMutation();

  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<EligibleSaleOrder | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ordersQuery = useEligibleSaleOrdersQuery(search);
  const orders = ordersQuery.data ?? [];

  const previewQuery = useNfePreviewQuery(selectedOrder?.id ?? null);
  const preview = previewQuery.data ?? null;

  // FR-002: a NF-e exige CPF/CNPJ do tomador — resolvido pelo `customerId` do
  // pedido (mesmo endpoint que `nfse-issuance` já usa). Pedido sem cliente
  // identificado (`customerId: null`, venda de balcão sem cadastro) não tem
  // como emitir NF-e por esta tela — bloqueado explicitamente abaixo, não
  // silenciosamente com um documento vazio.
  const customerFiscalQuery = useCustomerNfeFiscalInfoQuery(
    selectedOrder?.customerId ?? null,
  );
  const customerMissing = Boolean(selectedOrder) && !selectedOrder?.customerId;
  // spec erp/028 (B1/FR-002): a NF-e exige endereço no grupo `dest`
  // (`enderDest`) — sem ele a SEFAZ recusa com 719. Bloqueia ANTES de
  // transmitir quando o resolvedor não achou um endereço utilizável (ausente
  // ou cidade fora da tabela IBGE estática), em vez de deixar o órgão recusar
  // de novo por um dado que o sistema já sabia estar incompleto.
  const customerAddressMissing =
    Boolean(selectedOrder?.customerId) &&
    !customerFiscalQuery.isPending &&
    Boolean(customerFiscalQuery.data) &&
    !customerFiscalQuery.data?.address;

  // spec erp/025 (P2): selo reflete o ambiente real do Emitente — mesma regra
  // de nfse-issuance-page.tsx (plataforma só sustenta emissão real em
  // HOMOLOGATION hoje).
  const environment = fiscalCompany.defaultEnvironment;
  const environmentUnsupported = environment === "PRODUCTION";
  const environmentLabel =
    environment === "PRODUCTION"
      ? "Ambiente: PRODUÇÃO (não suportado nesta plataforma)"
      : "Ambiente: HOMOLOGAÇÃO";

  const hasFallbackWarnings = (preview?.warnings.length ?? 0) > 0;

  const canEmit =
    Boolean(fiscalCompany.companyId) &&
    !environmentUnsupported &&
    Boolean(selectedOrder) &&
    !customerMissing &&
    Boolean(customerFiscalQuery.data?.document) &&
    Boolean(customerFiscalQuery.data?.address) &&
    Boolean(preview?.canIssue) &&
    !issueMutation.isPending;

  const groupedWarnings = useMemo(() => {
    if (!preview) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    for (const warning of preview.warnings) {
      const list = map.get(warning.productId) ?? [];
      list.push(TRIBUTO_LABEL[warning.tributo]);
      map.set(warning.productId, list);
    }
    return map;
  }, [preview]);

  async function handleConfirmEmit() {
    setConfirmOpen(false);
    if (
      !selectedOrder ||
      !fiscalCompany.companyId ||
      !customerFiscalQuery.data ||
      !customerFiscalQuery.data.address
    ) {
      return;
    }

    try {
      const customer = customerFiscalQuery.data;
      const issued = await issueMutation.mutateAsync({
        saleOrderId: selectedOrder.id,
        customer: {
          documentType: customer.documentType,
          document: customer.document,
          name: customer.name,
          email: customer.email,
          // spec erp/028 (B1/FR-001): grupo `dest` completo — sem isso a
          // SEFAZ recusa com 719 antes de avaliar qualquer outro critério.
          address: customer.address,
        },
      });
      // spec erp/028 (B2/FR-004/FR-005): só AUTHORIZED é sucesso. REJECTED/
      // DENIED pelo órgão foi transmitida com sucesso técnico, mas recusada
      // por um critério de negócio — toast.warning (decisão do clarify), com
      // o código+mensagem do órgão em português. Qualquer outro status
      // (achado do react-reviewer: um `ERROR` síncrono da fiscal-api, por
      // exemplo, não é uma recusa de negócio — cairia no mesmo warning sem
      // essa distinção) usa toast.error, mesmo peso do catch abaixo.
      const statusLabel = resolveFiscalDocumentStatusLabel(issued.status);
      if (issued.status === "AUTHORIZED") {
        toast.success(`NF-e ${statusLabel}.`, {
          description: issued.protocol
            ? `Protocolo ${issued.protocol}`
            : undefined,
        });
      } else {
        const description = issued.errorMessage
          ? `${issued.errorCode ? `[${issued.errorCode}] ` : ""}${issued.errorMessage}`
          : "Consulte o Facilita NF-e para mais detalhes.";
        if (issued.status === "REJECTED" || issued.status === "DENIED") {
          toast.warning(`NF-e ${statusLabel}.`, { description });
        } else {
          toast.error(`NF-e ${statusLabel}.`, { description });
        }
      }
      setSelectedOrder(null);
    } catch (error) {
      toast.error("Falha ao emitir a NF-e", {
        description: errorMessage(error),
      });
    }
  }

  const header = (
    <PageHeader
      title="Emitir NF-e"
      description="Emissão de NF-e a partir de um pedido de venda, com a parametrização fiscal real do produto."
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
              <Button component={Link} href="/configuracoes/fiscal" size="small">
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
          title="Pedido de venda"
          description="Escolha um pedido de venda fechado — a NF-e reflete os produtos e a parametrização fiscal das linhas dele."
        >
          <Stack spacing={2.5}>
            <Autocomplete
              id="nfe-sale-order"
              label="Pedido de venda"
              options={orders}
              loading={ordersQuery.isPending}
              getOptionLabel={(option) =>
                `#${option.number} — ${option.customerName} — ${formatCents(option.totalCents)}`
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedOrder}
              onInputChange={(_e, value, reason) => {
                // "reset"/"clear" disparam com o label formatado da opção
                // escolhida (ou vazio) — só "input" é digitação real.
                if (reason === "input") setSearch(value);
              }}
              onChange={(_e, option) => setSelectedOrder(option)}
              disabled={issueMutation.isPending}
              noOptionsText={
                // spec erp/027 (B3): texto padrão do MUI ("No options") não
                // explica o pré-requisito — nenhum pedido de venda fechado
                // disponível para emitir NF-e. Texto puro aqui (achado do
                // react-reviewer): um link dentro do `noOptionsText` do MUI
                // Autocomplete fica fora do `listboxRef` que segura o foco,
                // então Tab fecha o dropdown antes do link ganhar foco —
                // inacessível por teclado. O atalho real vem do Alert
                // abaixo, fora do popper.
                "Nenhum pedido de venda fechado disponível. Feche um pedido para poder emitir a NF-e."
              }
            />

            {!ordersQuery.isPending && orders.length === 0 ? (
              <Alert
                severity="info"
                action={
                  <Button
                    component={Link}
                    href="/vendas/pedidos-de-venda"
                    size="small"
                  >
                    Ver pedidos de venda
                  </Button>
                }
              >
                Nenhum pedido de venda fechado disponível ainda.
              </Alert>
            ) : null}

            {customerMissing ? (
              <Alert severity="error">
                Este pedido não tem um cliente identificado com CPF/CNPJ. A
                NF-e exige o documento do tomador — associe um cliente ao
                pedido antes de emitir.
              </Alert>
            ) : null}

            {selectedOrder &&
            selectedOrder.customerId &&
            customerFiscalQuery.isError ? (
              <Alert severity="error">
                Não foi possível carregar os dados fiscais do cliente. Tente
                novamente.
              </Alert>
            ) : null}

            {selectedOrder &&
            selectedOrder.customerId &&
            !customerFiscalQuery.isPending &&
            customerFiscalQuery.data &&
            !customerFiscalQuery.data.document ? (
              <Alert severity="warning">
                O cliente deste pedido não tem CPF/CNPJ cadastrado. Informe o
                documento no cadastro do cliente antes de emitir a NF-e.
              </Alert>
            ) : null}

            {customerAddressMissing ? (
              <Alert
                severity="warning"
                action={
                  <Button component={Link} href="/clientes" size="small">
                    Ir para Clientes
                  </Button>
                }
              >
                O cliente deste pedido não tem endereço cadastrado (ou o
                município não está na nossa base). A NF-e exige o endereço
                completo do destinatário — complete o cadastro do cliente em
                Clientes antes de emitir.
                {/* Não há tela de edição de cliente ainda (features/customers
                    só tem lista + cadastro) — o link leva à lista, não a um
                    deep link direto, achado desta feature (spec erp/028),
                    fora de escopo consertar aqui. */}
              </Alert>
            ) : null}

            {selectedOrder && previewQuery.isError ? (
              <Alert severity="error">
                Não foi possível carregar a prévia da emissão. Tente novamente.
              </Alert>
            ) : null}

            {selectedOrder && preview && !preview.canIssue ? (
              <Alert severity="warning">
                Este pedido já tem uma NF-e emitida — não é possível emitir
                uma segunda (FR-006).
              </Alert>
            ) : null}

            {selectedOrder && hasFallbackWarnings ? (
              <Alert severity="warning">
                Um ou mais itens vão sair com valor de fallback (produto sem
                grupo fiscal configurado para o tributo). A emissão não é
                bloqueada, mas revise antes de confirmar.
              </Alert>
            ) : null}

            {selectedOrder && previewQuery.isPending ? (
              <Skeleton variant="rounded" height={160} />
            ) : null}

            {selectedOrder && preview && preview.items.length > 0 ? (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" aria-label="Itens do pedido e avisos fiscais">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Qtd.</TableCell>
                      <TableCell align="right">Valor total</TableCell>
                      <TableCell>Avisos de fallback</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.items.map((item) => {
                      const warnings = groupedWarnings.get(item.productId);
                      return (
                        <TableRow key={item.productId}>
                          <TableCell>
                            {item.productName}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              {item.productSku}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">
                            {formatCents(item.totalValueCents)}
                          </TableCell>
                          <TableCell>
                            {warnings ? (
                              <Stack
                                direction="row"
                                spacing={0.5}
                                sx={{ flexWrap: "wrap" }}
                              >
                                {warnings.map((label) => (
                                  <Chip
                                    key={label}
                                    label={label}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                ))}
                              </Stack>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            ) : null}
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
            Emitir NF-e
          </Button>
        </Box>

        <ConfirmationDialog
          open={confirmOpen}
          loading={issueMutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmEmit}
          title={`Emitir NF-e em ${environment === "PRODUCTION" ? "PRODUÇÃO" : "HOMOLOGAÇÃO"}?`}
          description={
            hasFallbackWarnings
              ? "A emissão é irreversível dentro do prazo legal. Um ou mais itens vão sair com valor de fallback — confirme que está ciente antes de prosseguir."
              : "A emissão é irreversível dentro do prazo legal. Confirme que os dados estão corretos antes de transmitir."
          }
          confirmLabel="Emitir"
        />
      </Box>
    </FiscalScrollablePage>
  );
}
