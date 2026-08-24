"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Button, FormField, PageHeader, ScrollArea } from "@citybox/mui";
import { FormSection } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { CentsField } from "@/features/pos-policies/components/cents-field";
import {
  usePosPolicyQuery,
  useSavePosPolicyMutation,
} from "@/features/pos-policies/hooks/use-pos-policy";
import {
  toPosPolicyFormValues,
  type PosPolicy,
  type PosPolicyFormValues,
} from "@/features/pos-policies/types/pos-policy";

/** Full-bleed: o `main` do shell é `overflow: hidden`, e o scroll nasce aqui. */
const pageSx = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  minWidth: 0,
  overflow: "hidden",
  m: -3,
  width: (theme: { spacing: (n: number) => string }) =>
    `calc(100% + ${theme.spacing(6)})`,
  maxWidth: "none",
} as const;

export function PosPolicyPage() {
  const query = usePosPolicyQuery();

  if (query.isError) {
    return (
      <Box sx={pageSx}>
        <PageHeader sx={{ flexShrink: 0, mb: 0, px: 3, pt: 3, pb: 2 }} title="Alçadas" />
        <Box sx={{ px: 3 }}>
          <ListLoadErrorAlert
            title="Não foi possível carregar as alçadas"
            onRetry={query.refetch}
          />
        </Box>
      </Box>
    );
  }

  if (!query.data) {
    return (
      <Box sx={pageSx}>
        <PageHeader sx={{ flexShrink: 0, mb: 0, px: 3, pt: 3, pb: 2 }} title="Alçadas" />
        <Box sx={{ px: 3 }}>
          <Skeleton variant="rounded" height={220} />
        </Box>
      </Box>
    );
  }

  // `key` no lugar de sincronizar por efeito: quando o servidor devolve uma
  // versão nova, o formulário **remonta** com os valores dela. É o mesmo
  // padrão de `formKey` dos diálogos de cadastro — e evita `setState` dentro
  // de `useEffect`, que dispara render em cascata.
  return <PosPolicyEditor key={query.data.updatedAt} policy={query.data} />;
}

function PosPolicyEditor({ policy }: { policy: PosPolicy }) {
  const saveMutation = useSavePosPolicyMutation();
  const [values, setValues] = useState<PosPolicyFormValues>(() =>
    toPosPolicyFormValues(policy),
  );

  function set<K extends keyof PosPolicyFormValues>(
    key: K,
    value: PosPolicyFormValues[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <Box sx={pageSx}>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0, px: 3, pt: 3, pb: 2 }}
        title="Alçadas"
        actions={
          <Button
            type="button"
            variant="contained"
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate(values)}
          >
            Salvar
          </Button>
        }
      />

      <ScrollArea sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <Box sx={{ px: 3, pb: 4, minWidth: 0 }}>
          <FormSection
            title="Limites do operador"
            description="Até onde o operador de caixa vai sozinho. Acima destes valores, o PDV pede o PIN de um supervisor."
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Vale para <strong>todos os terminais da empresa</strong>. Limite
              que muda de caixa para caixa é contornável escolhendo o mais
              frouxo.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 2.5,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
              }}
            >
              <FormField
                id="pos-policy-discount"
                label="Desconto sem supervisor (até %)"
                value={String(values.discountSupervisorAbovePercent)}
                helperText="100 = nunca pede supervisor"
                slotProps={{ htmlInput: { inputMode: "numeric" } }}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "");
                  // Trava em 100 na digitação: a API recusaria com 422, e o
                  // operador de backoffice só descobriria ao salvar.
                  set(
                    "discountSupervisorAbovePercent",
                    Math.min(digits ? Number(digits) : 0, 100),
                  );
                }}
              />

              <CentsField
                id="pos-policy-withdrawal"
                label="Sangria sem supervisor (até)"
                value={values.withdrawalSupervisorAboveCents}
                helperText="R$ 0,00 = sempre pede supervisor"
                onChange={(cents) =>
                  set("withdrawalSupervisorAboveCents", cents)
                }
              />
            </Box>
          </FormSection>

          <FormSection
            title="Operações que exigem supervisor"
            description="Exceções que saem do fluxo normal de venda e ficam registradas com quem autorizou."
          >
            <PolicySwitch
              label="Cancelamento de venda"
              description="Cancelar uma venda já concluída."
              checked={values.cancellationRequiresSupervisor}
              onChange={(checked) =>
                set("cancellationRequiresSupervisor", checked)
              }
            />
            <PolicySwitch
              label="Devolução"
              description="Devolver itens de uma venda anterior."
              checked={values.refundRequiresSupervisor}
              onChange={(checked) => set("refundRequiresSupervisor", checked)}
            />

            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Sem rede, estas operações ficam bloqueadas mesmo com supervisor
              presente — elas não podem ser conferidas contra o servidor no
              momento em que acontecem.
            </Typography>
          </FormSection>
        </Box>
      </ScrollArea>
    </Box>
  );
}

function PolicySwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
    >
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {description}
        </Typography>
      </Box>
      <Switch
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        slotProps={{ input: { "aria-label": label } }}
      />
    </Stack>
  );
}
