"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "@citybox/mui";
import { EntityFormFooter, FormSection } from "@/components/ui/form";
import { useUnsavedChangesGuard } from "@/features/fiscal-settings/lib/unsaved-guard";
import type { FiscalTaxRegime } from "@/features/fiscal-settings/api/fiscal-settings.dto";
import {
  PIS_COFINS_CST_OPTIONS,
  defaultAliquotasByRegime,
  isPisCofinsCstTributado,
  pisCofinsCstFaixa,
} from "../lib/pis-cofins-options";
import {
  useCreatePisCofinsGroupMutation,
  useUpdatePisCofinsGroupMutation,
  usePisCofinsGroupProductsQuery,
} from "../hooks/use-pis-cofins-groups";
import type { PisCofinsGroupDto } from "../api/pis-cofins-group.dto";
import { businessErrorMessage } from "@/lib/api/business-error-message";

const LIST_PATH = "/configuracoes/fiscal/grupos-pis-cofins";
const UNSAVED_KEY = "pis-cofins-group";

function errorMessage(error: unknown): string {
  return businessErrorMessage(error);
}

function toAliquotaString(value: number | null): string {
  return value == null ? "" : String(value);
}

function parseAliquota(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

type FormState = {
  name: string;
  pisCst: string;
  pisAliquota: string;
  cofinsCst: string;
  cofinsAliquota: string;
};

function initialState(group: PisCofinsGroupDto | undefined): FormState {
  return {
    name: group?.name ?? "",
    pisCst: group?.pisCst ?? "",
    pisAliquota: toAliquotaString(group?.pisAliquota ?? null),
    cofinsCst: group?.cofinsCst ?? "",
    cofinsAliquota: toAliquotaString(group?.cofinsAliquota ?? null),
  };
}

type PisCofinsGroupFormViewProps = {
  /** Presente em edição; ausente em criação. */
  group?: PisCofinsGroupDto;
  regime?: FiscalTaxRegime;
};

/** Formulário de grupo de PIS/COFINS (spec erp/015). Remontar via key ao trocar de grupo. */
export function PisCofinsGroupFormView({
  group,
  regime,
}: PisCofinsGroupFormViewProps) {
  const router = useRouter();
  const isEditing = Boolean(group);
  const [tab, setTab] = useState<"config" | "products">("config");
  const [form, setForm] = useState<FormState>(() => initialState(group));
  const [saved, setSaved] = useState<FormState>(() => initialState(group));

  const createMutation = useCreatePisCofinsGroupMutation();
  const updateMutation = useUpdatePisCofinsGroupMutation(group?.id ?? "");
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const isDirty = (Object.keys(form) as (keyof FormState)[]).some(
    (key) => form[key] !== saved[key],
  );
  useUnsavedChangesGuard(UNSAVED_KEY, isDirty);

  const pisTributado = form.pisCst !== "" && isPisCofinsCstTributado(form.pisCst);
  const cofinsTributado =
    form.cofinsCst !== "" && isPisCofinsCstTributado(form.cofinsCst);

  const faixaDiverge =
    form.pisCst !== "" &&
    form.cofinsCst !== "" &&
    pisCofinsCstFaixa(form.pisCst) !== pisCofinsCstFaixa(form.cofinsCst);

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  /** Espelha a situação do PIS na do COFINS e pré-preenche alíquotas pelo regime. */
  function handlePisCstChange(value: string) {
    const tributado = value !== "" && isPisCofinsCstTributado(value);
    const prefill = defaultAliquotasByRegime(regime);
    setForm((prev) => ({
      ...prev,
      pisCst: value,
      cofinsCst: value, // espelhamento — o usuário pode alterar depois
      // Só pré-preenche o PIS se estava vazio (não sobrescreve o que o usuário
      // digitou); idem COFINS — preserva uma alíquota já divergida de propósito.
      pisAliquota: tributado
        ? prev.pisAliquota || toAliquotaString(prefill?.pis ?? null)
        : "",
      cofinsAliquota: tributado
        ? prev.cofinsAliquota || toAliquotaString(prefill?.cofins ?? null)
        : "",
    }));
  }

  function handleCofinsCstChange(value: string) {
    const tributado = value !== "" && isPisCofinsCstTributado(value);
    const prefill = defaultAliquotasByRegime(regime);
    setForm((prev) => ({
      ...prev,
      cofinsCst: value,
      cofinsAliquota: tributado
        ? prev.cofinsAliquota || toAliquotaString(prefill?.cofins ?? null)
        : "",
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }
    if (!form.pisCst || !form.cofinsCst) {
      toast.error("Selecione a situação de PIS e de COFINS.");
      return;
    }
    // CST tributado (01/02) exige alíquota — não deixa gravar grupo incompleto.
    if (pisTributado && parseAliquota(form.pisAliquota) == null) {
      toast.error("Informe a alíquota do PIS.");
      return;
    }
    if (cofinsTributado && parseAliquota(form.cofinsAliquota) == null) {
      toast.error("Informe a alíquota do COFINS.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      pisCst: form.pisCst,
      pisAliquota: pisTributado ? parseAliquota(form.pisAliquota) : null,
      cofinsCst: form.cofinsCst,
      cofinsAliquota: cofinsTributado ? parseAliquota(form.cofinsAliquota) : null,
    };
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
        setSaved(form);
        setHasSavedOnce(true);
        toast.success("Grupo atualizado.");
      } else {
        const created = await createMutation.mutateAsync(payload);
        setSaved(form);
        toast.success("Grupo criado.");
        router.replace(`${LIST_PATH}/${created.id}`);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function handleDiscard() {
    setForm(saved);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Tabs
        value={tab}
        onChange={(_, next: "config" | "products") => setTab(next)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
      >
        <Tab value="config" label="Configuração" />
        <Tab
          value="products"
          label="Produtos"
          disabled={!isEditing}
          title={isEditing ? undefined : "Salve o grupo para ver os produtos"}
        />
      </Tabs>

      {tab === "config" ? (
        <FormSection
          title="Informações Gerais"
          description="Defina a situação tributária e as alíquotas de PIS e COFINS deste grupo."
        >
          <Stack spacing={2} sx={{ maxWidth: 520 }}>
            <TextField
              label="Nome"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              disabled={isSaving}
              slotProps={{ htmlInput: { maxLength: 120 } }}
              required
            />

            <CstSelect
              id="pis-cst"
              label="Situação do PIS"
              value={form.pisCst}
              onChange={handlePisCstChange}
              disabled={isSaving}
            />
            {pisTributado ? (
              <AliquotaField
                id="pis-aliquota"
                label="Alíquota do PIS (%)"
                value={form.pisAliquota}
                onChange={(value) => setField("pisAliquota", value)}
                disabled={isSaving}
              />
            ) : null}

            <CstSelect
              id="cofins-cst"
              label="Situação do COFINS"
              value={form.cofinsCst}
              onChange={handleCofinsCstChange}
              disabled={isSaving}
            />
            {cofinsTributado ? (
              <AliquotaField
                id="cofins-aliquota"
                label="Alíquota do COFINS (%)"
                value={form.cofinsAliquota}
                onChange={(value) => setField("cofinsAliquota", value)}
                disabled={isSaving}
              />
            ) : null}

            {faixaDiverge ? (
              <Alert severity="warning">
                A situação do PIS e do COFINS estão em faixas diferentes
                (tributado vs. não tributado). Divergir é permitido, mas confira
                se não é engano de digitação.
              </Alert>
            ) : null}
          </Stack>
        </FormSection>
      ) : (
        <ProductsTab groupId={group?.id ?? null} />
      )}

      {tab === "config" ? (
        <Box sx={{ position: "sticky", bottom: 0, zIndex: 1, mt: 3 }}>
          <EntityFormFooter
            mode="dirty"
            ariaLabel="Ações do formulário de Grupo de PIS/COFINS"
            isDirty={isDirty}
            hasSavedOnce={hasSavedOnce}
            isSaving={isSaving}
            savedMessage="Grupo atualizado"
            onCancel={() => undefined}
            onDiscard={handleDiscard}
            onSave={() => void handleSave()}
          />
        </Box>
      ) : null}
    </Box>
  );
}

function CstSelect({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <FormControl fullWidth disabled={disabled}>
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      <Select
        labelId={`${id}-label`}
        id={id}
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {PIS_COFINS_CST_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={Boolean(option.disabledReason)}
          >
            {option.label}
            {option.disabledReason ? ` — ${option.disabledReason}` : ""}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

function AliquotaField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <TextField
      id={id}
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      // type="text" + inputMode decimal: `type=number` recusa a vírgula, e o
      // parse aceita "0,65" (pt-BR). O intervalo 0–100 é validado no back.
      type="text"
      slotProps={{
        htmlInput: { inputMode: "decimal", pattern: "[0-9.,]*" },
      }}
    />
  );
}

function ProductsTab({ groupId }: { groupId: string | null }) {
  const productsQuery = usePisCofinsGroupProductsQuery(groupId);

  if (productsQuery.isPending) {
    return (
      <Typography variant="body2" color="text.secondary">
        Carregando produtos…
      </Typography>
    );
  }
  if (productsQuery.isError) {
    return (
      <Alert severity="error">Não foi possível carregar os produtos.</Alert>
    );
  }
  const products = productsQuery.data ?? [];
  if (products.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nenhum produto usa este grupo ainda.
      </Typography>
    );
  }
  return (
    <Stack spacing={1}>
      {products.map((product) => (
        <Box
          key={product.productId}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            p: 1.5,
            border: 1,
            borderColor: "divider",
            borderRadius: 1.5,
          }}
        >
          <Typography variant="body2">{product.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {product.sku}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
