"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import { Button, CurrencyInput, NumberInput, Select } from "@citybox/mui";
import { FinancialEntryAttachmentUpload } from "@/features/financial-entries/components/financial-entry-form/financial-entry-attachment-upload";
import { FinancialEntrySection } from "@/features/financial-entries/components/financial-entry-form/financial-entry-form-primitives";
import { useChartOfAccountOptionsQuery } from "@/features/chart-of-accounts/hooks/use-chart-of-account-options-query";
import { useCostCenterOptionsQuery } from "@/features/cost-centers/hooks/use-cost-center-options-query";
import {
  computeEntryTotal,
  remainingAllocation,
  sumAllocations,
  type FinancialEntryFormValues,
} from "@/features/financial-entries/lib/financial-entry-form-values";
import { formatCurrencyBRL } from "@/features/financial-entries/lib/financial-entry-format";
import type { ChartOfAccountOption } from "@/features/chart-of-accounts/api/chart-of-accounts.service";
import type { CostCenterOption } from "@/features/cost-centers/api/cost-centers.service";

const NO_CATEGORIES: ChartOfAccountOption[] = [];
const NO_COST_CENTERS: CostCenterOption[] = [];

type FinancialEntryAllocationsSectionProps = {
  values: FinancialEntryFormValues;
  onAddAllocation: () => void;
  onRemoveAllocation: (allocationId: string) => void;
  onUpdateAllocationField: (
    allocationId: string,
    field: "categoryId" | "costCenterId",
    value: string,
  ) => void;
  onUpdateAllocationAmount: (
    allocationId: string,
    amount: number,
    total: number,
  ) => void;
  onUpdateAllocationPercentage: (
    allocationId: string,
    percentage: number,
    total: number,
  ) => void;
  /** Presente só em edição — anexos exigem o lançamento já existir. */
  financialEntryId: string | null;
  pendingAttachmentFiles: readonly File[];
  onAddAttachmentFiles: (files: File[]) => void;
  onRemovePendingAttachmentFile: (index: number) => void;
  onRemoveExistingAttachment: (attachmentId: string) => void;
  readOnly?: boolean;
  /** `true` após uma tentativa de salvar falha — realça linhas sem centro de custo (FR-010). */
  showValidation?: boolean;
};

export function FinancialEntryAllocationsSection({
  values,
  onAddAllocation,
  onRemoveAllocation,
  onUpdateAllocationField,
  onUpdateAllocationAmount,
  onUpdateAllocationPercentage,
  financialEntryId,
  pendingAttachmentFiles,
  onAddAttachmentFiles,
  onRemovePendingAttachmentFile,
  onRemoveExistingAttachment,
  readOnly,
  showValidation,
}: FinancialEntryAllocationsSectionProps) {
  const total = computeEntryTotal(values);
  const allocated = sumAllocations(values.allocations);
  const remaining = remainingAllocation(total, allocated);
  const { data: categories = NO_CATEGORIES } = useChartOfAccountOptionsQuery();
  const { data: costCenters = NO_COST_CENTERS } = useCostCenterOptionsQuery();

  return (
    <FinancialEntrySection
      title="Categoria & anexos"
      description="Defina categorias e centros de custo para organizar este lançamento. Ajuste valores proporcionalmente, se aplicável."
    >
      <Stack spacing={2.5}>
        <Stack spacing={2}>
          {values.allocations.map((allocation, index) => (
            <Box
              key={allocation.id}
              sx={{
                display: "grid",
                gap: 2,
                alignItems: "end",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "minmax(0, 1fr) minmax(0, 1fr) 8rem 6.5rem auto",
                },
              }}
            >
              <FormControl fullWidth disabled={readOnly}>
                {index === 0 ? (
                  <InputLabel id={`fin-alloc-cat-label-${allocation.id}`}>
                    Categoria
                  </InputLabel>
                ) : null}
                <Select
                  labelId={index === 0 ? `fin-alloc-cat-label-${allocation.id}` : undefined}
                  label={index === 0 ? "Categoria" : undefined}
                  value={allocation.categoryId}
                  onChange={(event) =>
                    onUpdateAllocationField(
                      allocation.id,
                      "categoryId",
                      event.target.value as string,
                    )
                  }
                >
                  <MenuItem value="">
                    <em>Selecione uma opção</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                fullWidth
                disabled={readOnly}
                error={showValidation && !allocation.costCenterId}
              >
                {index === 0 ? (
                  <InputLabel id={`fin-alloc-cc-label-${allocation.id}`}>
                    Centro de custo
                  </InputLabel>
                ) : null}
                <Select
                  labelId={index === 0 ? `fin-alloc-cc-label-${allocation.id}` : undefined}
                  label={index === 0 ? "Centro de custo" : undefined}
                  value={allocation.costCenterId}
                  onChange={(event) =>
                    onUpdateAllocationField(
                      allocation.id,
                      "costCenterId",
                      event.target.value as string,
                    )
                  }
                >
                  <MenuItem value="">
                    <em>Selecione uma opção</em>
                  </MenuItem>
                  {costCenters.map((center) => (
                    <MenuItem key={center.id} value={center.id}>
                      {center.name}
                    </MenuItem>
                  ))}
                </Select>
                {showValidation && !allocation.costCenterId ? (
                  <FormHelperText>Centro de custo é obrigatório.</FormHelperText>
                ) : null}
              </FormControl>

              <Box>
                {index === 0 ? (
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    Valor
                  </Typography>
                ) : null}
                <CurrencyInput
                  value={allocation.amount}
                  onValueChange={(amount) =>
                    onUpdateAllocationAmount(allocation.id, amount, total)
                  }
                  disabled={readOnly}
                  aria-label="Valor rateado"
                />
              </Box>

              <Box>
                {index === 0 ? (
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    Porcentagem
                  </Typography>
                ) : null}
                <NumberInput
                  minValue={0}
                  maxValue={100}
                  step={0.01}
                  value={allocation.percentage}
                  onValueChange={(percentage) =>
                    onUpdateAllocationPercentage(
                      allocation.id,
                      percentage,
                      total,
                    )
                  }
                  disabled={readOnly}
                  aria-label="Porcentagem rateada"
                />
              </Box>

              <IconButton
                size="small"
                disabled={readOnly || values.allocations.length <= 1}
                aria-label={`Remover categoria ${index + 1}`}
                onClick={() => onRemoveAllocation(allocation.id)}
                sx={{ mb: 0.5 }}
              >
                <DeleteOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>

        <Button
          type="button"
          variant="text"
          startIcon={<AddIcon fontSize="small" />}
          onClick={onAddAllocation}
          disabled={readOnly}
          sx={{ alignSelf: "flex-start", px: 0 }}
        >
          Adicionar categoria
        </Button>

        <Stack
          direction="row"
          spacing={3}
          sx={{
            flexWrap: "wrap",
            justifyContent: "flex-end",
            pt: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: remaining === 0 ? "success.main" : "warning.main",
            }}
          >
            Rateio restante: {formatCurrencyBRL(remaining)}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Total rateado: {formatCurrencyBRL(allocated)}
          </Typography>
        </Stack>

        <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider" }}>
          <FinancialEntryAttachmentUpload
            financialEntryId={financialEntryId}
            existingAttachments={values.attachments}
            pendingFiles={pendingAttachmentFiles}
            onAddFiles={onAddAttachmentFiles}
            onRemovePendingFile={onRemovePendingAttachmentFile}
            onRemoveExistingAttachment={onRemoveExistingAttachment}
            readOnly={readOnly}
          />
        </Box>
      </Stack>
    </FinancialEntrySection>
  );
}
