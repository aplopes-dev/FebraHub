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
import {
  IPI_CST_OPTIONS,
  IPI_ENQUADRAMENTO_OPTIONS,
  isIpiCstTributado,
} from "../lib/ipi-options";
import {
  useCreateIpiGroupMutation,
  useIpiGroupProductsQuery,
  useUpdateIpiGroupMutation,
} from "../hooks/use-ipi-groups";
import type { IpiGroupDto } from "../api/ipi-group.dto";
import { businessErrorMessage } from "@/lib/api/business-error-message";

const LIST_PATH = "/configuracoes/fiscal/grupos-ipi";
const UNSAVED_KEY = "ipi-group";
const MAX_RATE = 100;

function errorMessage(error: unknown): string {
  return businessErrorMessage(error);
}

function toRateString(value: number | null): string {
  return value == null ? "" : String(value);
}

function parseRate(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

type FormState = {
  name: string;
  ipiCst: string;
  ipiEnquadramento: string;
  ipiRate: string;
};

function initialState(group: IpiGroupDto | undefined): FormState {
  return {
    name: group?.name ?? "",
    ipiCst: group?.ipiCst ?? "50",
    ipiEnquadramento: group?.ipiEnquadramento ?? "999",
    ipiRate: toRateString(group?.ipiRate ?? null),
  };
}

type Props = { group?: IpiGroupDto };

export function IpiGroupFormView({ group }: Props) {
  const router = useRouter();
  const isEditing = Boolean(group);
  const initial = initialState(group);

  const [tab, setTab] = useState<"config" | "products">("config");
  const [form, setForm] = useState<FormState>(initial);
  const createMutation = useCreateIpiGroupMutation();
  const updateMutation = useUpdateIpiGroupMutation(group?.id ?? "");
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  // Estado sujo computado durante o render (sem effect).
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useUnsavedChangesGuard(UNSAVED_KEY, dirty);

  // Percentual só se aplica ao CST tributado (50, 99) — não renderiza campo
  // que não vale para a situação escolhida (FR-003).
  const showRate = isIpiCstTributado(form.ipiCst);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }
    if (!form.ipiEnquadramento) {
      toast.error("Selecione um Grupo de Enquadramento Legal do IPI (cEnq).");
      return;
    }
    const rate = parseRate(form.ipiRate);
    if (showRate) {
      if (rate === null) {
        toast.error("Informe o percentual do IPI para a situação selecionada.");
        return;
      }
      if (rate < 0 || rate > MAX_RATE) {
        toast.error(`O percentual do IPI deve estar entre 0 e ${MAX_RATE}.`);
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      ipiCst: form.ipiCst,
      ipiEnquadramento: form.ipiEnquadramento,
      // CST não tributado não carrega percentual — envia null.
      ipiRate: showRate ? rate : null,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
        setHasSavedOnce(true);
        toast.success("Grupo de IPI atualizado.");
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success("Grupo de IPI criado.");
        router.replace(`${LIST_PATH}/${created.id}`);
        return;
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function handleDiscard() {
    setForm(initial);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Tabs
        value={tab}
        onChange={(_event, next: "config" | "products") => setTab(next)}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab value="config" label="Configuração" />
        <Tab
          value="products"
          label="Produtos"
          disabled={!isEditing}
          title={isEditing ? undefined : "Salve o grupo para ver os produtos"}
        />
      </Tabs>

      {tab === "products" ? (
        <IpiGroupProductsTab groupId={group?.id ?? null} />
      ) : (
        <>
      <FormSection
        title="Informações gerais"
        description="Defina as regras fiscais e alíquotas aplicadas a este grupo de IPI."
      >
        <Stack spacing={2.5}>
          <TextField
            label="Nome"
            placeholder="Nome do grupo"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            slotProps={{ htmlInput: { maxLength: 120 } }}
            disabled={isSaving}
            fullWidth
          />
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <FormControl sx={{ flex: 1, minWidth: 220 }} disabled={isSaving}>
              <InputLabel id="ipi-cst-label">Grupo tributário de IPI</InputLabel>
              <Select
                labelId="ipi-cst-label"
                label="Grupo tributário de IPI"
                value={form.ipiCst}
                onChange={(e) => setField("ipiCst", e.target.value)}
              >
                {IPI_CST_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1, minWidth: 220 }} disabled={isSaving}>
              <InputLabel id="ipi-enq-label">
                Grupo de Enquadramento Legal do IPI
              </InputLabel>
              <Select
                labelId="ipi-enq-label"
                label="Grupo de Enquadramento Legal do IPI"
                value={form.ipiEnquadramento}
                onChange={(e) => setField("ipiEnquadramento", e.target.value)}
              >
                {IPI_ENQUADRAMENTO_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {showRate ? (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                label="Percentual (%)"
                type="text"
                inputMode="decimal"
                placeholder="Ex.: 10"
                helperText="Alíquota do IPI aplicada na saída tributada."
                value={form.ipiRate}
                onChange={(e) => setField("ipiRate", e.target.value)}
                disabled={isSaving}
                sx={{ flex: 1, minWidth: 220 }}
              />
            </Box>
          ) : null}
        </Stack>
      </FormSection>
        </>
      )}

      {tab === "config" ? (
        <Box sx={{ position: "sticky", bottom: 0, zIndex: 1 }}>
          <EntityFormFooter
            mode="dirty"
            ariaLabel="Ações do formulário de Grupo de IPI"
            isDirty={dirty}
            hasSavedOnce={hasSavedOnce}
            isSaving={isSaving}
            savedMessage="Grupo de IPI atualizado"
            onCancel={() => undefined}
            onDiscard={handleDiscard}
            onSave={() => void handleSave()}
          />
        </Box>
      ) : null}
    </Box>
  );
}

/** Lista somente-leitura dos produtos que usam este grupo de IPI (spec erp/019, FR-005). */
function IpiGroupProductsTab({ groupId }: { groupId: string | null }) {
  const productsQuery = useIpiGroupProductsQuery(groupId);

  if (productsQuery.isPending) {
    return (
      <Typography variant="body2" color="text.secondary">
        Carregando produtos…
      </Typography>
    );
  }
  if (productsQuery.isError) {
    return <Alert severity="error">Não foi possível carregar os produtos.</Alert>;
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
