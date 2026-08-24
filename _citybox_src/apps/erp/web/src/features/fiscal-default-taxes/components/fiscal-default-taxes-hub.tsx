"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import CompareArrowsOutlined from "@mui/icons-material/CompareArrowsOutlined";
import Skeleton from "@mui/material/Skeleton";
import { Button, Card, CardContent, toast } from "@citybox/mui";
import {
  EntityFormFooter,
  FormSection,
  SelectField,
} from "@/components/ui/form";
import { CFOP_OPTIONS } from "@/features/fiscal-parameters/data/fiscal-options";
import { FiscalSelectField } from "@/features/fiscal-parameters/components/fiscal-form-fields";
import { useUnsavedChangesGuard } from "@/features/fiscal-settings/lib/unsaved-guard";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import { useFiscalAdditionalInfoCountsQuery } from "@/features/fiscal-additional-info/hooks/use-fiscal-additional-info-queries";
import { useOperationNaturesQuery } from "@/features/fiscal-operation-natures/hooks/use-operation-natures";
import { useFiscalDefaultTaxesMutation } from "../hooks/use-fiscal-default-taxes";
import type {
  FiscalDefaultTaxesDto,
  FiscalGroupDto,
  FiscalTaxType,
} from "../api/fiscal-default-taxes.dto";

type TributoCard = {
  taxType: FiscalTaxType;
  label: string;
  manageHref: string;
};

const TRIBUTO_CARDS: TributoCard[] = [
  {
    taxType: "ICMS",
    label: "ICMS",
    manageHref: "/configuracoes/fiscal/grupos?tributo=icms",
  },
  {
    taxType: "IPI",
    label: "IPI",
    manageHref: "/configuracoes/fiscal/grupos?tributo=ipi",
  },
  {
    taxType: "PIS_COFINS",
    label: "PIS/COFINS",
    manageHref: "/configuracoes/fiscal/grupos?tributo=pis_cofins",
  },
  {
    taxType: "ISSQN",
    label: "ISSQN",
    manageHref: "/configuracoes/fiscal/grupos?tributo=issqn",
  },
];

function errorMessage(error: unknown): string {
  return businessErrorMessage(error);
}

type FormState = {
  icmsGroupId: string;
  ipiGroupId: string;
  pisCofinsGroupId: string;
  issqnGroupId: string;
  cfop: string;
};

function slotFieldKey(taxType: FiscalTaxType): keyof FormState {
  switch (taxType) {
    case "ICMS":
      return "icmsGroupId";
    case "IPI":
      return "ipiGroupId";
    case "PIS_COFINS":
      return "pisCofinsGroupId";
    case "ISSQN":
      return "issqnGroupId";
  }
}

type OtherFiscalCardProps = {
  icon: ReactNode;
  title: string;
  manageHref: string;
  manageLabel: string;
  isLoading: boolean;
  isError: boolean;
  /** `null` = ainda não carregou; `0` é um valor real, distinto de "sem dado". */
  count: number | null;
  emptyDescription: string;
};

/**
 * Card dos cadastros fiscais que não são "grupo por tributo" (spec erp/022,
 * N7 do re-teste): mesma moldura visual dos 4 cards de tributo acima — ícone
 * + título + contagem real (nunca placeholder) + botão de gerenciar. Estado
 * vazio explica pra que o cadastro serve, em vez de só um link sem contexto.
 */
function OtherFiscalCard({
  icon,
  title,
  manageHref,
  manageLabel,
  isLoading,
  isError,
  count,
  emptyDescription,
}: OtherFiscalCardProps) {
  return (
    <Card variant="outlined" sx={{ display: "flex", flexDirection: "column" }}>
      <CardContent
        sx={{ display: "flex", flexDirection: "column", gap: 1.5, flex: 1 }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {icon}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Stack>
          {isLoading ? (
            <Skeleton variant="text" width={90} />
          ) : isError ? null : (
            <Typography variant="caption" color="text.secondary">
              {count === 0
                ? "Nenhum registro"
                : `${count} registro${count === 1 ? "" : "s"} cadastrado${count === 1 ? "" : "s"}`}
            </Typography>
          )}
        </Stack>

        {isError ? (
          <Typography variant="body2" color="error">
            Não foi possível carregar a contagem. Tente novamente.
          </Typography>
        ) : !isLoading && count === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {emptyDescription}
          </Typography>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}

        <Button
          component={Link}
          href={manageHref}
          variant="outlined"
          size="small"
          sx={{ alignSelf: "flex-start", mt: "auto" }}
        >
          {manageLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

type FiscalDefaultTaxesHubProps = {
  defaults: FiscalDefaultTaxesDto;
  groups: FiscalGroupDto[];
};

/**
 * Hub de Padrões fiscais (spec erp/022, D4; N7 do re-teste erp/023) —
 * substitui a lista plana de selects por um card por tributo, com contexto
 * (nº de grupos cadastrados, qual está definido como padrão) e o atalho para
 * a tela unificada de Grupos fiscais. Mantém o mesmo `SelectField` de escolha
 * do padrão dentro do card — não perde a função, só ganha moldura visual
 * (D4: "não substitui, só ganha contexto"). Os cadastros que não são "grupo
 * por tributo" (Informações adicionais, Naturezas de operação) entram no
 * mesmo grid como `OtherFiscalCard` — antes eram 2 links de texto crus no
 * rodapé, achado do re-teste (N7): destoavam do resto da tela já redesenhada.
 * CFOP padrão continua abaixo dos cards, comportamento inalterado.
 */
export function FiscalDefaultTaxesHub({
  defaults,
  groups,
}: FiscalDefaultTaxesHubProps) {
  const initial: FormState = {
    icmsGroupId: defaults.icmsGroupId ?? "",
    ipiGroupId: defaults.ipiGroupId ?? "",
    pisCofinsGroupId: defaults.pisCofinsGroupId ?? "",
    issqnGroupId: defaults.issqnGroupId ?? "",
    cfop: defaults.cfop ?? "",
  };
  const [form, setForm] = useState<FormState>(initial);
  const [saved, setSaved] = useState<FormState>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const mutation = useFiscalDefaultTaxesMutation();
  const additionalInfoCountsQuery = useFiscalAdditionalInfoCountsQuery();
  const operationNaturesQuery = useOperationNaturesQuery();

  const isDirty = (Object.keys(form) as (keyof FormState)[]).some(
    (key) => form[key] !== saved[key],
  );
  useUnsavedChangesGuard("fiscal-defaults", isDirty);

  function groupsFor(taxType: FiscalTaxType): FiscalGroupDto[] {
    return groups.filter((group) => group.taxType === taxType);
  }

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      await mutation.mutateAsync({
        icmsGroupId: form.icmsGroupId || null,
        ipiGroupId: form.ipiGroupId || null,
        pisCofinsGroupId: form.pisCofinsGroupId || null,
        issqnGroupId: form.issqnGroupId || null,
        cfop: form.cfop.trim(),
      });
      setSaved(form);
      setHasSavedOnce(true);
      toast.success("Padrões fiscais salvos.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function handleDiscard() {
    setForm(saved);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Stack spacing={3} sx={{ mt: 1 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
            },
            gap: 2,
          }}
        >
          {TRIBUTO_CARDS.map((card) => {
            const options = groupsFor(card.taxType);
            const fieldKey = slotFieldKey(card.taxType);
            const isEmpty = options.length === 0;
            const selectedGroup = options.find(
              (option) => option.id === form[fieldKey],
            );

            return (
              <Card
                key={card.taxType}
                variant="outlined"
                sx={{ display: "flex", flexDirection: "column" }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    flex: 1,
                  }}
                >
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center" }}
                    >
                      <ReceiptLongOutlined
                        sx={{ fontSize: 20, color: "text.secondary" }}
                      />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {card.label}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {options.length === 0
                        ? "Nenhum grupo cadastrado"
                        : `${options.length} grupo${options.length > 1 ? "s" : ""} cadastrado${options.length > 1 ? "s" : ""}`}
                    </Typography>
                  </Stack>

                  {isEmpty ? (
                    <Typography variant="body2" color="text.secondary">
                      Nenhum padrão definido — cadastre um grupo de {card.label}{" "}
                      para poder escolhê-lo como padrão.
                    </Typography>
                  ) : (
                    <SelectField
                      id={`fiscal-default-${card.taxType}`}
                      label={`Padrão de ${card.label}`}
                      value={form[fieldKey]}
                      onChange={(value) => setField(fieldKey, value)}
                      options={[
                        { value: "", label: "Nenhum padrão definido" },
                        ...options.map((group) => ({
                          value: group.id,
                          label: group.name,
                        })),
                      ]}
                      disabled={mutation.isPending}
                    />
                  )}
                  {!isEmpty && !selectedGroup ? (
                    <Typography variant="caption" color="text.secondary">
                      Nenhum padrão definido.
                    </Typography>
                  ) : null}

                  <Button
                    component={Link}
                    href={card.manageHref}
                    variant="outlined"
                    size="small"
                    sx={{ alignSelf: "flex-start", mt: "auto" }}
                  >
                    Gerenciar grupos de {card.label}
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          <OtherFiscalCard
            icon={
              <DescriptionOutlined
                sx={{ fontSize: 20, color: "text.secondary" }}
              />
            }
            title="Informações adicionais"
            manageHref="/configuracoes/fiscal/informacoes-adicionais"
            manageLabel="Gerenciar informações adicionais"
            isLoading={additionalInfoCountsQuery.isPending}
            isError={additionalInfoCountsQuery.isError}
            count={additionalInfoCountsQuery.data?.total ?? null}
            emptyDescription="Textos fixos que entram automaticamente nas notas fiscais, por tipo de documento. Nenhum cadastrado ainda."
          />

          <OtherFiscalCard
            icon={
              <CompareArrowsOutlined
                sx={{ fontSize: 20, color: "text.secondary" }}
              />
            }
            title="Naturezas de operação"
            manageHref="/configuracoes/fiscal/naturezas-operacao"
            manageLabel="Gerenciar naturezas de operação"
            isLoading={operationNaturesQuery.isPending}
            isError={operationNaturesQuery.isError}
            count={operationNaturesQuery.data?.length ?? null}
            emptyDescription="Regras de-para que, dada uma operação de entrada, determinam o CFOP e os grupos fiscais da saída correspondente. Nenhuma cadastrada ainda."
          />
        </Box>

        <FormSection
          title="CFOP padrão"
          description="Usado como referência para produtos que não têm CFOP próprio preenchido."
        >
          <Stack spacing={2.5} sx={{ maxWidth: 520 }}>
            <FiscalSelectField
              id="fiscal-default-cfop"
              label="CFOP padrão"
              value={form.cfop}
              onChange={(value) => setField("cfop", value)}
              options={CFOP_OPTIONS}
              disabled={mutation.isPending}
            />
          </Stack>
        </FormSection>
      </Stack>

      {/* `position: sticky` — mesmo padrão de `general-settings-form.tsx` (T017). */}
      <Box sx={{ position: "sticky", bottom: 0, zIndex: 1, mt: 3 }}>
        <EntityFormFooter
          mode="dirty"
          ariaLabel="Ações do formulário de Padrões fiscais"
          isDirty={isDirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={mutation.isPending}
          savedMessage="Padrões fiscais salvos"
          onCancel={() => undefined}
          onDiscard={handleDiscard}
          onSave={() => void handleSave()}
        />
      </Box>
    </Box>
  );
}
