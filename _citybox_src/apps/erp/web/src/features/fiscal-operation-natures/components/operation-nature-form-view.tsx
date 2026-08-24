"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import AddIcon from "@mui/icons-material/Add";
import { Button, toast } from "@citybox/mui";
import { EntityFormFooter, FormSection } from "@/components/ui/form";
import { useUnsavedChangesGuard } from "@/features/fiscal-settings/lib/unsaved-guard";
import { useFiscalGroupsQuery } from "@/features/fiscal-default-taxes/hooks/use-fiscal-default-taxes";
import {
  ENTRADA_CFOP_OPTIONS,
  ICMS_LIVRE_OPTIONS,
  SAIDA_CFOP_OPTIONS,
  type IcmsLivreCondition,
} from "../lib/cfop-options";
import {
  useCreateOperationNatureMutation,
  useUpdateOperationNatureMutation,
} from "../hooks/use-operation-natures";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import type {
  OperationNatureCfopRuleDto,
  OperationNatureDto,
  OperationNatureGroupRuleDto,
} from "../api/operation-nature.dto";

const LIST_PATH = "/configuracoes/fiscal/naturezas-operacao";
const UNSAVED_KEY = "operation-nature";
const DESCRIPTION_MAX = 300;

function errorMessage(error: unknown): string {
  return businessErrorMessage(error);
}

type CfopRuleRow = OperationNatureCfopRuleDto & { key: string };
type GroupRuleRow = { key: string; fromGroupId: string; toGroupId: string };

let rowKeySeq = 0;
function nextRowKey(): string {
  rowKeySeq += 1;
  return `row-${rowKeySeq}`;
}

function toCfopRows(rules: OperationNatureCfopRuleDto[]): CfopRuleRow[] {
  return rules.map((rule) => ({ ...rule, key: nextRowKey() }));
}

function toGroupRows(rules: OperationNatureGroupRuleDto[]): GroupRuleRow[] {
  return rules.map((rule) => ({
    key: nextRowKey(),
    fromGroupId: rule.fromGroupId,
    toGroupId: rule.toGroupId,
  }));
}

type FormState = {
  name: string;
  description: string;
  cfopRules: CfopRuleRow[];
  icmsGroupRules: GroupRuleRow[];
  pisCofinsGroupRules: GroupRuleRow[];
};

function initialState(nature: OperationNatureDto | undefined): FormState {
  const icmsGroupRules = (nature?.groupRules ?? []).filter(
    (rule) => rule.taxType === "ICMS",
  );
  const pisCofinsGroupRules = (nature?.groupRules ?? []).filter(
    (rule) => rule.taxType === "PIS_COFINS",
  );
  return {
    name: nature?.name ?? "",
    description: nature?.description ?? "",
    cfopRules: toCfopRows(nature?.cfopRules ?? []),
    icmsGroupRules: toGroupRows(icmsGroupRules),
    pisCofinsGroupRules: toGroupRows(pisCofinsGroupRules),
  };
}

function stripKey<T extends { key: string }>(row: T): Omit<T, "key"> {
  const { key, ...rest } = row;
  void key;
  return rest;
}

function serializeState(state: FormState) {
  return JSON.stringify({
    name: state.name,
    description: state.description,
    cfopRules: state.cfopRules.map(stripKey),
    icmsGroupRules: state.icmsGroupRules.map(stripKey),
    pisCofinsGroupRules: state.pisCofinsGroupRules.map(stripKey),
  });
}

type Props = { nature?: OperationNatureDto };

export function OperationNatureFormView({ nature }: Props) {
  const router = useRouter();
  const isEditing = Boolean(nature);
  // Lazy initializers: `initialState` chama `nextRowKey()` (efeito colateral no
  // contador de módulo) — com valor plano em vez de função, rodaria a cada
  // render, não só no mount (achado react-review).
  const [initial] = useState<FormState>(() => initialState(nature));
  const [form, setForm] = useState<FormState>(() => initialState(nature));
  const groupsQuery = useFiscalGroupsQuery();
  const createMutation = useCreateOperationNatureMutation();
  const updateMutation = useUpdateOperationNatureMutation(nature?.id ?? "");
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  // Estado sujo computado durante o render (sem effect).
  const dirty = serializeState(form) !== serializeState(initial);
  useUnsavedChangesGuard(UNSAVED_KEY, dirty);

  const icmsGroups = (groupsQuery.data ?? []).filter(
    (group) => group.taxType === "ICMS",
  );
  const pisCofinsGroups = (groupsQuery.data ?? []).filter(
    (group) => group.taxType === "PIS_COFINS",
  );

  function addCfopRow() {
    setForm((prev) => ({
      ...prev,
      cfopRules: [
        ...prev.cfopRules,
        { key: nextRowKey(), fromCfop: "", toCfop: "", icmsLivre: "AMBOS" },
      ],
    }));
  }

  function updateCfopRow(key: string, patch: Partial<CfopRuleRow>) {
    setForm((prev) => ({
      ...prev,
      cfopRules: prev.cfopRules.map((row) =>
        row.key === key ? { ...row, ...patch } : row,
      ),
    }));
  }

  function removeCfopRow(key: string) {
    setForm((prev) => ({
      ...prev,
      cfopRules: prev.cfopRules.filter((row) => row.key !== key),
    }));
  }

  function addGroupRow(field: "icmsGroupRules" | "pisCofinsGroupRules") {
    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], { key: nextRowKey(), fromGroupId: "", toGroupId: "" }],
    }));
  }

  function updateGroupRow(
    field: "icmsGroupRules" | "pisCofinsGroupRules",
    key: string,
    patch: Partial<GroupRuleRow>,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((row) => (row.key === key ? { ...row, ...patch } : row)),
    }));
  }

  function removeGroupRow(
    field: "icmsGroupRules" | "pisCofinsGroupRules",
    key: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((row) => row.key !== key),
    }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Informe o nome da natureza de operação.");
      return;
    }
    if (form.description.length > DESCRIPTION_MAX) {
      toast.error(`A descrição deve ter no máximo ${DESCRIPTION_MAX} caracteres.`);
      return;
    }
    for (const row of form.cfopRules) {
      if (!row.fromCfop || !row.toCfop) {
        toast.error("Preencha o CFOP de origem e de destino em todas as linhas.");
        return;
      }
    }
    for (const row of [...form.icmsGroupRules, ...form.pisCofinsGroupRules]) {
      if (!row.fromGroupId || !row.toGroupId) {
        toast.error("Preencha o grupo de origem e de destino em todas as linhas.");
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      cfopRules: form.cfopRules.map(stripKey),
      groupRules: [
        ...form.icmsGroupRules.map((row) => ({
          taxType: "ICMS" as const,
          fromGroupId: row.fromGroupId,
          toGroupId: row.toGroupId,
        })),
        ...form.pisCofinsGroupRules.map((row) => ({
          taxType: "PIS_COFINS" as const,
          fromGroupId: row.fromGroupId,
          toGroupId: row.toGroupId,
        })),
      ],
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(payload);
        setHasSavedOnce(true);
        toast.success("Natureza de operação atualizada.");
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success("Natureza de operação criada.");
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
        title="Informações gerais"
        description="Nome e descrição da natureza de operação."
      >
        <Stack spacing={2.5}>
          <TextField
            label="Nome"
            placeholder="Ex.: Devolução de mercadoria para fornecedor"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            slotProps={{ htmlInput: { maxLength: 160 } }}
            disabled={isSaving}
            fullWidth
          />
          <TextField
            label="Descrição"
            placeholder="Opcional"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            slotProps={{ htmlInput: { maxLength: DESCRIPTION_MAX } }}
            helperText={`${form.description.length}/${DESCRIPTION_MAX}`}
            disabled={isSaving}
            multiline
            minRows={2}
            fullWidth
          />
          <Tooltip title="Depende do código de benefício fiscal por UF, ainda não disponível.">
            <FormControlLabel
              control={<Checkbox checked={false} disabled />}
              label="Manter Código de Benefício Fiscal na UF (em breve)"
            />
          </Tooltip>
        </Stack>
      </FormSection>

      <FormSection
        title="De-para de CFOP"
        description="Dado um CFOP de entrada, define o CFOP de saída e a condição de ICMS Livre em que a linha se aplica."
      >
        <Stack spacing={2}>
          {form.cfopRules.map((row) => (
            <Box
              key={row.key}
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <FormControl sx={{ flex: 1, minWidth: 200 }} disabled={isSaving}>
                <InputLabel id={`from-cfop-${row.key}`}>De (entrada)</InputLabel>
                <Select
                  labelId={`from-cfop-${row.key}`}
                  label="De (entrada)"
                  value={row.fromCfop}
                  onChange={(e) =>
                    updateCfopRow(row.key, { fromCfop: e.target.value })
                  }
                >
                  {ENTRADA_CFOP_OPTIONS.map((option) => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1, minWidth: 200 }} disabled={isSaving}>
                <InputLabel id={`to-cfop-${row.key}`}>Para (saída)</InputLabel>
                <Select
                  labelId={`to-cfop-${row.key}`}
                  label="Para (saída)"
                  value={row.toCfop}
                  onChange={(e) => updateCfopRow(row.key, { toCfop: e.target.value })}
                >
                  {SAIDA_CFOP_OPTIONS.map((option) => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1, minWidth: 180 }} disabled={isSaving}>
                <InputLabel id={`icms-livre-${row.key}`}>ICMS Livre</InputLabel>
                <Select
                  labelId={`icms-livre-${row.key}`}
                  label="ICMS Livre"
                  value={row.icmsLivre}
                  onChange={(e) =>
                    updateCfopRow(row.key, {
                      icmsLivre: e.target.value as IcmsLivreCondition,
                    })
                  }
                >
                  {ICMS_LIVRE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <IconButton
                aria-label="Remover linha"
                onClick={() => removeCfopRow(row.key)}
                disabled={isSaving}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addCfopRow}
            disabled={isSaving}
            sx={{ alignSelf: "flex-start" }}
          >
            Adicionar campo
          </Button>
        </Stack>
      </FormSection>

      <GroupRuleSection
        title="De-para de Grupo de ICMS"
        description="Quando o item tem um grupo de ICMS na lista, aplica o grupo mapeado na saída."
        rows={form.icmsGroupRules}
        options={icmsGroups}
        optionsLoading={groupsQuery.isPending}
        isSaving={isSaving}
        onAdd={() => addGroupRow("icmsGroupRules")}
        onUpdate={(key, patch) => updateGroupRow("icmsGroupRules", key, patch)}
        onRemove={(key) => removeGroupRow("icmsGroupRules", key)}
      />

      <GroupRuleSection
        title="De-para de Grupo de PIS/COFINS"
        description="Quando o item tem um grupo de PIS/COFINS na lista, aplica o grupo mapeado na saída."
        rows={form.pisCofinsGroupRules}
        options={pisCofinsGroups}
        optionsLoading={groupsQuery.isPending}
        isSaving={isSaving}
        onAdd={() => addGroupRow("pisCofinsGroupRules")}
        onUpdate={(key, patch) => updateGroupRow("pisCofinsGroupRules", key, patch)}
        onRemove={(key) => removeGroupRow("pisCofinsGroupRules", key)}
      />

      <Box sx={{ position: "sticky", bottom: 0, zIndex: 1 }}>
        <EntityFormFooter
          mode="dirty"
          ariaLabel="Ações do formulário de Natureza de operação"
          isDirty={dirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={isSaving}
          savedMessage="Natureza de operação atualizada"
          onCancel={() => undefined}
          onDiscard={handleDiscard}
          onSave={() => void handleSave()}
        />
      </Box>
    </Box>
  );
}

type GroupOption = { id: string; name: string };

type GroupRuleSectionProps = {
  title: string;
  description: string;
  rows: GroupRuleRow[];
  options: GroupOption[];
  optionsLoading: boolean;
  isSaving: boolean;
  onAdd: () => void;
  onUpdate: (key: string, patch: Partial<GroupRuleRow>) => void;
  onRemove: (key: string) => void;
};

function GroupRuleSection({
  title,
  description,
  rows,
  options,
  optionsLoading,
  isSaving,
  onAdd,
  onUpdate,
  onRemove,
}: GroupRuleSectionProps) {
  const disabled = isSaving || optionsLoading;
  return (
    <FormSection title={title} description={description}>
      <Stack spacing={2}>
        {options.length === 0 && !optionsLoading ? (
          <Alert severity="info">
            Nenhum grupo cadastrado ainda para este tributo — cadastre um grupo antes
            de criar uma regra.
          </Alert>
        ) : null}
        {rows.map((row) => (
          <Box
            key={row.key}
            sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
          >
            <FormControl sx={{ flex: 1, minWidth: 220 }} disabled={disabled}>
              <InputLabel id={`from-group-${row.key}`}>De (grupo)</InputLabel>
              <Select
                labelId={`from-group-${row.key}`}
                label="De (grupo)"
                value={row.fromGroupId}
                onChange={(e) => onUpdate(row.key, { fromGroupId: e.target.value })}
              >
                {options.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1, minWidth: 220 }} disabled={disabled}>
              <InputLabel id={`to-group-${row.key}`}>Para (grupo)</InputLabel>
              <Select
                labelId={`to-group-${row.key}`}
                label="Para (grupo)"
                value={row.toGroupId}
                onChange={(e) => onUpdate(row.key, { toGroupId: e.target.value })}
              >
                {options.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              aria-label="Remover linha"
              onClick={() => onRemove(row.key)}
              disabled={isSaving}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onAdd}
          disabled={disabled || options.length === 0}
          sx={{ alignSelf: "flex-start" }}
        >
          Adicionar campo
        </Button>
        {rows.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            Sem regras — itens deste tributo mantêm o grupo original ao aplicar esta
            natureza.
          </Typography>
        ) : null}
      </Stack>
    </FormSection>
  );
}
