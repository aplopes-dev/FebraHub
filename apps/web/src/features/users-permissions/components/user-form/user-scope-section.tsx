"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MenuItem, Select } from "@/ui";
import { formFieldGridSx, formFieldSpanSx as span, FormSection } from "@/components/ui/form";
import { useOrganizationStructureQuery } from "@/features/branches/hooks/use-branch-queries";
import { useActorScope } from "@/features/users-permissions/hooks/use-actor-scope";
import type { UserFormApi } from "@/features/users-permissions/hooks/use-user-form";
import {
  availableBranchIdsForMatrix,
  availableMatrixIds,
  availableScopeOptions,
} from "@/features/users-permissions/lib/scope-rules";
import type { GeographicScopeLevel } from "@/features/users-permissions/types/user";

const SCOPE_OPTION_LABELS: Record<GeographicScopeLevel, string> = {
  group: "Todo o grupo",
  matrix: "Empresa (matriz)",
  branch: "Unidade(s) — filial",
};

type UserScopeSectionProps = {
  form: UserFormApi;
};

export function UserScopeSection({ form }: UserScopeSectionProps) {
  const { values, setField } = form;
  const { scope: actorScope } = useActorScope();
  const structureQuery = useOrganizationStructureQuery();
  const structure = structureQuery.data ?? null;

  const matrixIds = useMemo(
    () => structure?.matrices.map((matrix) => matrix.id) ?? [],
    [structure],
  );

  const allowedScopeLevels = availableScopeOptions(actorScope);
  const selectableMatrixIds = availableMatrixIds(actorScope, matrixIds);

  const storesByMatrix = structure?.storesByMatrix ?? {};

  const branchOptionsByMatrix = useMemo(() => {
    const result: Record<string, { id: string; name: string }[]> = {};
    for (const matrixId of selectableMatrixIds) {
      const allowed = availableBranchIdsForMatrix(
        actorScope,
        matrixId,
        Object.fromEntries(
          Object.entries(storesByMatrix).map(([key, stores]) => [
            key,
            stores.map((store) => store.id),
          ]),
        ),
      );
      result[matrixId] = (storesByMatrix[matrixId] ?? [])
        .filter((store) => allowed.includes(store.id))
        .map((store) => ({ id: store.id, name: store.displayName }));
    }
    return result;
  }, [actorScope, selectableMatrixIds, storesByMatrix]);

  const handleScopeLevelChange = (level: GeographicScopeLevel) => {
    setField("scopeLevel", level);
    if (level === "group") {
      setField("matrixId", null);
      setField("branchIds", []);
      return;
    }
    if (level === "matrix") {
      const defaultMatrix = selectableMatrixIds[0] ?? null;
      setField("matrixId", defaultMatrix);
      setField("branchIds", []);
      return;
    }
    const defaultMatrix = selectableMatrixIds[0] ?? null;
    setField("matrixId", defaultMatrix);
    const defaultBranch = defaultMatrix
      ? (branchOptionsByMatrix[defaultMatrix]?.[0]?.id ?? null)
      : null;
    setField("branchIds", defaultBranch ? [defaultBranch] : []);
  };

  const toggleBranch = (branchId: string, checked: boolean) => {
    const next = new Set(values.branchIds);
    if (checked) {
      next.add(branchId);
    } else {
      next.delete(branchId);
    }
    setField("branchIds", [...next]);
  };

  return (
    <FormSection
      title="Escopo de atuação"
      description="Define onde este usuário pode operar na hierarquia Grupo → Matriz → Filial."
    >
      <Box sx={formFieldGridSx}>
        <Box sx={span(12)}>
          <FormLabel sx={{ mb: 1, display: "block" }}>Nível de atuação</FormLabel>
          <RadioGroup
            value={values.scopeLevel}
            onChange={(_, value) =>
              handleScopeLevelChange(value as GeographicScopeLevel)
            }
          >
            {(["group", "matrix", "branch"] as const).map((level) => (
              <FormControlLabel
                key={level}
                value={level}
                control={<Radio size="small" />}
                label={SCOPE_OPTION_LABELS[level]}
                disabled={!allowedScopeLevels.includes(level)}
              />
            ))}
          </RadioGroup>
        </Box>

        {values.scopeLevel !== "group" ? (
          <Box sx={span(6)}>
            <FormLabel sx={{ mb: 1, display: "block" }}>Empresa (matriz)</FormLabel>
            <Select
              size="small"
              fullWidth
              value={values.matrixId ?? ""}
              onChange={(event) => {
                const matrixId = String(event.target.value) || null;
                setField("matrixId", matrixId);
                if (values.scopeLevel === "branch") {
                  const firstBranch = matrixId
                    ? (branchOptionsByMatrix[matrixId]?.[0]?.id ?? null)
                    : null;
                  setField("branchIds", firstBranch ? [firstBranch] : []);
                } else {
                  setField("branchIds", []);
                }
              }}
            >
              {selectableMatrixIds.map((matrixId) => {
                const matrix = structure?.matrices.find((item) => item.id === matrixId);
                return (
                  <MenuItem key={matrixId} value={matrixId}>
                    {matrix?.displayName ?? matrixId}
                  </MenuItem>
                );
              })}
            </Select>
          </Box>
        ) : null}

        {values.scopeLevel === "branch" && values.matrixId ? (
          <Box sx={span(12)}>
            <FormLabel sx={{ mb: 1, display: "block" }}>Filiais</FormLabel>
            <Stack spacing={0.5}>
              {(branchOptionsByMatrix[values.matrixId] ?? []).map((branch) => (
                <FormControlLabel
                  key={branch.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={values.branchIds.includes(branch.id)}
                      onChange={(event) =>
                        toggleBranch(branch.id, event.target.checked)
                      }
                    />
                  }
                  label={<Typography variant="body2">{branch.name}</Typography>}
                />
              ))}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
              {values.branchIds.length} filial(is) selecionada(s)
            </Typography>
          </Box>
        ) : null}
      </Box>
    </FormSection>
  );
}
