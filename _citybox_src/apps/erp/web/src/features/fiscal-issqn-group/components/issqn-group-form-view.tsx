"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "@citybox/mui";
import { EntityFormFooter, FormSection } from "@/components/ui/form";
import { useUnsavedChangesGuard } from "@/features/fiscal-settings/lib/unsaved-guard";
import {
  ISSQN_NATIONAL_CODE_RE,
  ISSQN_SERVICE_CODE_RE,
  ISSQN_TRIB_TYPE_OPTIONS,
} from "../lib/issqn-options";
import {
  useCreateIssqnGroupMutation,
  useUpdateIssqnGroupMutation,
} from "../hooks/use-issqn-groups";
import type { IssqnGroupDto } from "../api/issqn-group.dto";
import { businessErrorMessage } from "@/lib/api/business-error-message";

const LIST_PATH = "/configuracoes/fiscal/grupos-issqn";
const UNSAVED_KEY = "issqn-group";

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
  issqnServiceCode: string;
  issqnNationalCode: string;
  issqnRate: string;
  issqnTribType: string;
};

function initialState(group: IssqnGroupDto | undefined): FormState {
  return {
    name: group?.name ?? "",
    issqnServiceCode: group?.issqnServiceCode ?? "",
    issqnNationalCode: group?.issqnNationalCode ?? "",
    issqnRate: toRateString(group?.issqnRate ?? null),
    issqnTribType: group?.issqnTribType ?? "1",
  };
}

type Props = { group?: IssqnGroupDto };

export function IssqnGroupFormView({ group }: Props) {
  const router = useRouter();
  const isEditing = Boolean(group);
  const initial = initialState(group);

  const [form, setForm] = useState<FormState>(initial);
  const createMutation = useCreateIssqnGroupMutation();
  const updateMutation = useUpdateIssqnGroupMutation(group?.id ?? "");
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  // Estado sujo computado durante o render (sem effect).
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useUnsavedChangesGuard(UNSAVED_KEY, dirty);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do grupo.");
      return;
    }
    if (!ISSQN_SERVICE_CODE_RE.test(form.issqnServiceCode.trim())) {
      toast.error("O código municipal do serviço deve estar no formato NN.NN.");
      return;
    }
    if (!ISSQN_NATIONAL_CODE_RE.test(form.issqnNationalCode.trim())) {
      toast.error("O código de tributação nacional (cTribNac) deve ter 6 dígitos.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      issqnServiceCode: form.issqnServiceCode.trim(),
      issqnNationalCode: form.issqnNationalCode.trim(),
      issqnRate: parseRate(form.issqnRate),
      issqnTribType: form.issqnTribType,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
        setHasSavedOnce(true);
        toast.success("Grupo de ISSQN atualizado.");
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success("Grupo de ISSQN criado.");
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
      <FormSection
        title="Informações Gerais"
        description="Perfil fiscal do serviço reutilizado na emissão da NFS-e."
      >
        <Stack spacing={2.5}>
          <TextField
            label="Nome"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            slotProps={{ htmlInput: { maxLength: 120 } }}
            disabled={isSaving}
            fullWidth
          />
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Código municipal do serviço"
              placeholder="17.02"
              helperText="Formato NN.NN (LC 116)."
              value={form.issqnServiceCode}
              onChange={(e) => setField("issqnServiceCode", e.target.value)}
              slotProps={{ htmlInput: { maxLength: 5 } }}
              disabled={isSaving}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <TextField
              label="Código de tributação nacional (cTribNac)"
              placeholder="170200"
              helperText="6 dígitos — tabela nacional."
              value={form.issqnNationalCode}
              onChange={(e) => setField("issqnNationalCode", e.target.value)}
              slotProps={{ htmlInput: { maxLength: 6 } }}
              disabled={isSaving}
              sx={{ flex: 1, minWidth: 200 }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <TextField
              label="Alíquota do ISS (%)"
              type="text"
              inputMode="decimal"
              placeholder="Ex.: 5"
              helperText="Só é transmitida à nota quando há retenção."
              value={form.issqnRate}
              onChange={(e) => setField("issqnRate", e.target.value)}
              disabled={isSaving}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <FormControl sx={{ flex: 1, minWidth: 200 }} disabled={isSaving}>
              <InputLabel id="issqn-trib-type-label">
                Exigibilidade do ISS
              </InputLabel>
              <Select
                labelId="issqn-trib-type-label"
                label="Exigibilidade do ISS"
                value={form.issqnTribType}
                onChange={(e) => setField("issqnTribType", e.target.value)}
              >
                {ISSQN_TRIB_TYPE_OPTIONS.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                    {option.disabled && option.disabledReason ? (
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{ color: "text.secondary", ml: 1 }}
                      >
                        — {option.disabledReason}
                      </Typography>
                    ) : null}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </FormSection>

      <Box sx={{ position: "sticky", bottom: 0, zIndex: 1 }}>
        <EntityFormFooter
          mode="dirty"
          ariaLabel="Ações do formulário de Grupo de ISSQN"
          isDirty={dirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={isSaving}
          savedMessage="Grupo de ISSQN atualizado"
          onCancel={() => undefined}
          onDiscard={handleDiscard}
          onSave={() => void handleSave()}
        />
      </Box>
    </Box>
  );
}
