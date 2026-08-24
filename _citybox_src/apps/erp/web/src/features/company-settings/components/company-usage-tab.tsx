"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, ConfirmationDialog, PasswordInput, toast } from "@citybox/mui";

import { useStocksQuery } from "@/features/stock/hooks/use-stock-queries";
import { usePriceListsByPriorityQuery } from "@/features/price-lists/hooks/use-price-list-queries";

import { evaluatePasswordStrength } from "../lib/company-formatters";
import type { CompanyOption } from "../lib/company-options";
import type { CompanySettingsFormApi } from "../hooks/use-company-settings-form";
import { SelectField } from "@/components/ui/form";
import {
  FormSection as CompanySettingsSection,
  formFieldGridSx as companyFieldGridSx,
  formFieldSpanSx as span,
} from "@/components/ui/form";
import { CompanySoonAlert } from "./company-soon-alert";

const STOCK_SELECT_PARAMS = { page: 1, perPage: 100, search: "" } as const;

type CompanyUsageTabProps = {
  form: CompanySettingsFormApi;
};

export function CompanyUsageTab({ form }: CompanyUsageTabProps) {
  const { values, setUsageField } = form;
  const [revokeOpen, setRevokeOpen] = useState(false);
  const usageLocked = true;

  const stocksQuery = useStocksQuery(STOCK_SELECT_PARAMS);
  const priceListsQuery = usePriceListsByPriorityQuery();

  const stockOptions = useMemo<CompanyOption[]>(
    () => (stocksQuery.data?.data ?? []).map((stock) => ({ value: stock.id, label: stock.name })),
    [stocksQuery.data],
  );

  const priceListOptions = useMemo<CompanyOption[]>(
    () => (priceListsQuery.data ?? []).map((list) => ({ value: list.id, label: list.name })),
    [priceListsQuery.data],
  );

  const passwordStrength = evaluatePasswordStrength(values.usage.adminPassword);

  return (
    <>
      <Stack spacing={5}>
        <CompanySoonAlert>
          Preferências de uso ainda não são salvas na API. O botão Salvar do
          rodapé atualiza apenas o cadastro da empresa (aba Cadastro) e a cor de
          marca. O certificado digital é gerenciado na tela Fiscal.
        </CompanySoonAlert>

        <CompanySettingsSection
          title="Informações de estoque"
          description="Defina qual será o estoque movimentado por padrão nas suas operações de compra e venda"
        >
          <Box sx={companyFieldGridSx}>
            <Box sx={span(6)}>
              <SelectField
                id="usage-stock-sale"
                label="Padrão venda PDV"
                value={values.usage.defaultStockSale}
                onChange={(value) => setUsageField("defaultStockSale", value)}
                options={stockOptions}
                placeholder="Selecione uma opção"
                helperText="Em breve"
                disabled={usageLocked}
              />
            </Box>
            <Box sx={span(6)}>
              <SelectField
                id="usage-stock-purchase"
                label="Padrão de compras"
                value={values.usage.defaultStockPurchase}
                onChange={(value) => setUsageField("defaultStockPurchase", value)}
                options={stockOptions}
                placeholder="Selecione uma opção"
                helperText="Em breve"
                disabled={usageLocked}
              />
            </Box>
          </Box>
        </CompanySettingsSection>

        <CompanySettingsSection
          title="Informações de preço"
          description="Defina a lista de preços padrão que será utilizada para vendas, atendimento e relatórios"
        >
          <Box sx={companyFieldGridSx}>
            <Box sx={span(6)}>
              <SelectField
                id="usage-price-sale"
                label="Padrão de venda"
                value={values.usage.defaultPriceListSale}
                onChange={(value) => setUsageField("defaultPriceListSale", value)}
                options={priceListOptions}
                disabled={usageLocked}
                helperText="Em breve"
              />
            </Box>
            <Box sx={span(6)}>
              <SelectField
                id="usage-price-pdv"
                label="Padrão PDV"
                value={values.usage.defaultPriceListPdv}
                onChange={(value) => setUsageField("defaultPriceListPdv", value)}
                options={priceListOptions}
                disabled={usageLocked}
                helperText="Em breve"
              />
            </Box>
            <Box sx={span(6)}>
              <SelectField
                id="usage-price-service"
                label="Padrão de atendimento"
                value={values.usage.defaultPriceListService}
                onChange={(value) => setUsageField("defaultPriceListService", value)}
                options={priceListOptions}
                disabled={usageLocked}
                helperText="Em breve"
              />
            </Box>
            <Box sx={span(6)}>
              <SelectField
                id="usage-price-reports"
                label="Padrão de relatórios"
                value={values.usage.defaultPriceListReports}
                onChange={(value) => setUsageField("defaultPriceListReports", value)}
                options={priceListOptions}
                disabled={usageLocked}
                helperText="Em breve"
              />
            </Box>
          </Box>
        </CompanySettingsSection>

        <CompanySettingsSection
          title="Senha dos aplicativos"
          description="Defina a senha de administrador que será utilizada para a área de manutenção dos seus aplicativos"
        >
          <Box sx={companyFieldGridSx}>
            <Box sx={span(6)}>
              <Stack spacing={1}>
                <PasswordInput
                  label="Senha do administrador"
                  value={values.usage.adminPassword}
                  onChange={(event) => setUsageField("adminPassword", event.target.value)}
                  autoComplete="new-password"
                  fullWidth
                  disabled={usageLocked}
                  helperText="Em breve"
                />
                <LinearProgress
                  variant="determinate"
                  value={passwordStrength.progress}
                  color={passwordStrength.color}
                  aria-label="Força da senha"
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Força da senha: {passwordStrength.label}
                </Typography>
              </Stack>
            </Box>
          </Box>
        </CompanySettingsSection>

        <CompanySettingsSection
          title="Certificado digital (NF-e)"
          description="O certificado digital A1 usado para assinar as notas fiscais é gerenciado na tela Fiscal"
        >
          <Button
            variant="outlined"
            component={Link}
            href="/configuracoes/fiscal"
            startIcon={<OpenInNewOutlined sx={{ fontSize: 18 }} />}
            sx={{ alignSelf: "flex-start" }}
          >
            Ir para Certificado digital
          </Button>
        </CompanySettingsSection>

        <CompanySettingsSection
          title="Configurações adicionais"
          description="Controle as chaves de API para integrações e administre o acesso. Proceda com cuidado"
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Escolha a ação
          </Typography>

          <AdditionalActionRow
            title="Revogar licença"
            description="Cancela o acesso de todos os aplicativos de uma só vez"
            actionLabel="Revogar licença"
            onAction={() => setRevokeOpen(true)}
            color="error"
            disabled={usageLocked}
          />

          <AdditionalActionRow
            title="Gerenciar API"
            description="Visualize ou copie os tokens de integração"
            actionLabel="Visualizar token"
            onAction={() =>
              toast.info("Tokens de integração", {
                description: "A gestão de tokens estará disponível em breve.",
              })
            }
            disabled={usageLocked}
          />
        </CompanySettingsSection>
      </Stack>

      <ConfirmationDialog
        open={revokeOpen}
        onCancel={() => setRevokeOpen(false)}
        title="Revogar licença dos aplicativos?"
        description="Todos os aplicativos conectados (PDV, KDS e dispositivos) perderão o acesso e precisarão ser reativados manualmente."
        confirmLabel="Revogar licença"
        cancelLabel="Cancelar"
        confirmColor="error"
        onConfirm={() => {
          setRevokeOpen(false);
          toast.info("Em breve", {
            description: "A revogação de licença ainda não está disponível.",
          });
        }}
      />
    </>
  );
}

type AdditionalActionRowProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  color?: "primary" | "error";
  disabled?: boolean;
};

function AdditionalActionRow({
  title,
  description,
  actionLabel,
  onAction,
  color = "primary",
  disabled = false,
}: AdditionalActionRowProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{
        p: 2,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        alignItems: { sm: "center" },
        justifyContent: "space-between",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        color={color}
        onClick={onAction}
        disabled={disabled}
        sx={{ flexShrink: 0 }}
      >
        {disabled ? "Em breve" : actionLabel}
      </Button>
    </Stack>
  );
}
