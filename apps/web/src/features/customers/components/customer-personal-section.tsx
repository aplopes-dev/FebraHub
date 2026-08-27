"use client";

import Add from "@mui/icons-material/Add";
import ChevronRight from "@mui/icons-material/ChevronRight";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import {
  Autocomplete,
  Button,
  DatePicker,
  FormField,
  IconButton,
  Select,
} from "@/ui";
import {
  createEmptyCustomerCategoryFormValues,
  CustomerCategoryFormDialog,
} from "@/features/customer-categories";
import { useCreateCustomerCategoryMutation } from "@/features/customer-categories/hooks/use-customer-category-mutations";
import { useAllCustomerCategoriesQuery } from "@/features/customer-categories/hooks/use-customer-category-queries";
import { CustomerSection } from "@/features/customers/components/customer-section";
import { parseIsoDate, toIsoDate } from "@/lib/date";
import {
  documentLabel,
  PERSON_TYPE_LABELS,
  type CustomerFormValues,
  type PersonType,
} from "@/features/customers/types/customer-form";
import { ProductUnitsDrawer } from "@/features/products/components/product-units-drawer";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";

const NOTES_MAX = 600;
const CREATE_CATEGORY_ID = "__create__";

type CategoryOption = {
  id: string;
  label: string;
};

type CustomerPersonalSectionProps = {
  values: CustomerFormValues;
  onChange: <K extends keyof CustomerFormValues>(
    key: K,
    value: CustomerFormValues[K],
  ) => void;
};

export function CustomerPersonalSection({
  values,
  onChange,
}: CustomerPersonalSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const isPf = values.personType === "fisica";
  const birthDate = parseIsoDate(values.birthDate);
  const units = useBranchUnits();
  const categoriesQuery = useAllCustomerCategoriesQuery();
  const createCategoryMutation = useCreateCustomerCategoryMutation();

  const categoryOptions = useMemo<CategoryOption[]>(
    () =>
      (categoriesQuery.data ?? []).map((category) => ({
        id: category.id,
        label: category.name,
      })),
    [categoriesQuery.data],
  );

  const selectedCategory =
    categoryOptions.find((option) => option.id === values.categoryId) ?? null;

  function addAdditionalPhone() {
    onChange("additionalPhones", [...values.additionalPhones, ""]);
  }

  function updateAdditionalPhone(index: number, phone: string) {
    const next = values.additionalPhones.map((item, i) =>
      i === index ? phone : item,
    );
    onChange("additionalPhones", next);
  }

  function removeAdditionalPhone(index: number) {
    onChange(
      "additionalPhones",
      values.additionalPhones.filter((_, i) => i !== index),
    );
  }

  function handleCreateCategory(formValues: {
    name: string;
    discountPercentage: number;
  }) {
    createCategoryMutation.mutate(formValues, {
      onSuccess: (created) => {
        onChange("categoryId", created.id);
        setCategoryDialogOpen(false);
      },
    });
  }

  return (
    <>
      <CustomerSection
        title="Dados pessoais"
        description="Informações importantes para identificar o cliente e facilitar o contato, garantindo um atendimento mais ágil e personalizado"
      >
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <FormField
            id="cus-name"
            label="Nome"
            value={values.name}
            onChange={(event) => onChange("name", event.target.value)}
          />
          <Autocomplete
            label="Categoria"
            options={categoryOptions}
            value={selectedCategory}
            onChange={(_, option) => {
              if (option?.id === CREATE_CATEGORY_ID) {
                setCategoryDialogOpen(true);
                return;
              }
              onChange("categoryId", option?.id ?? "");
            }}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(options, state) => {
              const input = state.inputValue.trim().toLowerCase();
              const filtered = input
                ? options.filter((option) =>
                    option.label.toLowerCase().includes(input),
                  )
                : options;
              return [
                ...filtered,
                { id: CREATE_CATEGORY_ID, label: "Nova categoria" },
              ];
            }}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                {option.id === CREATE_CATEGORY_ID ? (
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Add sx={{ fontSize: 16 }} />
                    <span>Nova categoria</span>
                  </Stack>
                ) : (
                  option.label
                )}
              </Box>
            )}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: {
              sm: isPf ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          <FormControl fullWidth>
            <InputLabel id="cus-person-type-label">Tipo</InputLabel>
            <Select
              labelId="cus-person-type-label"
              id="cus-person-type"
              label="Tipo"
              value={values.personType}
              onChange={(event) =>
                onChange("personType", event.target.value as PersonType)
              }
            >
              {(Object.keys(PERSON_TYPE_LABELS) as PersonType[]).map((type) => (
                <MenuItem key={type} value={type}>
                  {PERSON_TYPE_LABELS[type]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormField
            id="cus-document"
            label={documentLabel(values.personType)}
            value={values.document}
            onChange={(event) => onChange("document", event.target.value)}
          />
          {isPf ? (
            <FormField
              id="cus-rg"
              label="RG"
              value={values.rg}
              onChange={(event) => onChange("rg", event.target.value)}
            />
          ) : null}
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { sm: isPf ? "repeat(2, minmax(0, 1fr))" : "1fr" },
          }}
        >
          {isPf ? (
            <DatePicker
              id="cus-birth"
              label="Data de nascimento"
              value={birthDate}
              onChange={(date) =>
                onChange("birthDate", date ? toIsoDate(date) : "")
              }
            />
          ) : null}
          <FormField
            id="cus-email"
            label="E-mail"
            type="email"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
          />
        </Box>

        <Stack spacing={2}>
          <Box
            sx={{
              display: "grid",
              gap: 2.5,
              alignItems: "end",
              gridTemplateColumns: {
                sm: "minmax(0, 1fr) minmax(0, 1fr) auto",
              },
            }}
          >
            <FormField
              id="cus-mobile"
              label="Celular"
              placeholder="(DDD)+Telefone"
              value={values.mobile}
              onChange={(event) => onChange("mobile", event.target.value)}
            />
            <FormField
              id="cus-phone"
              label="Telefone"
              placeholder="(DDD)+Telefone"
              value={values.phone}
              onChange={(event) => onChange("phone", event.target.value)}
            />
            <Button
              type="button"
              variant="text"
              startIcon={<AddIcon fontSize="small" />}
              onClick={addAdditionalPhone}
              sx={{ justifyContent: { xs: "flex-start", sm: "center" }, mb: 0.5 }}
            >
              Telefone adicional
            </Button>
          </Box>

          {values.additionalPhones.map((phone, index) => (
            <Box
              key={`extra-phone-${index}`}
              sx={{
                display: "grid",
                gap: 2,
                alignItems: "end",
                gridTemplateColumns: { sm: "minmax(0, 1fr) auto" },
              }}
            >
              <FormField
                id={`cus-extra-phone-${index}`}
                label="Telefone adicional"
                placeholder="(DDD)+Telefone"
                value={phone}
                onChange={(event) =>
                  updateAdditionalPhone(index, event.target.value)
                }
              />
              <IconButton
                aria-label="Remover telefone adicional"
                onClick={() => removeAdditionalPhone(index)}
                sx={{ mb: 0.5 }}
              >
                <DeleteOutlined sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>

        <Box
          role="button"
          tabIndex={0}
          onClick={() => setDrawerOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setDrawerOpen(true);
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            width: "100%",
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.default",
            px: 2,
            py: 1.5,
            cursor: "pointer",
            transition: "background-color 0.2s",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Escolha em quais unidades exibir
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {values.selectedUnitIds.length} de {units.length} unidades
              selecionadas
            </Typography>
          </Box>
          <Button
            type="button"
            variant="outlined"
            onClick={(event) => {
              event.stopPropagation();
              setDrawerOpen(true);
            }}
            endIcon={<ChevronRight sx={{ fontSize: 16 }} />}
          >
            Selecionar unidades
          </Button>
        </Box>

        <Box sx={{ position: "relative" }}>
          <FormField
            id="cus-notes"
            label="Observações do cliente"
            value={values.notes}
            multiline
            rows={4}
            placeholder="Digite as anotações ou observações deste cliente"
            onChange={(event) => onChange("notes", event.target.value)}
            slotProps={{ htmlInput: { maxLength: NOTES_MAX } }}
          />
          <Typography
            variant="caption"
            sx={{
              pointerEvents: "none",
              position: "absolute",
              right: 12,
              bottom: 8,
              color: "text.secondary",
            }}
          >
            {values.notes.length}
          </Typography>
        </Box>
      </CustomerSection>

      <ProductUnitsDrawer
        units={units}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedUnitIds={values.selectedUnitIds}
        onSave={(unitIds) => onChange("selectedUnitIds", unitIds)}
      />

      <CustomerCategoryFormDialog
        open={categoryDialogOpen}
        mode="create"
        formKey={categoryDialogOpen ? "create-open" : "create-closed"}
        initialValues={createEmptyCustomerCategoryFormValues()}
        onOpenChange={setCategoryDialogOpen}
        onSave={handleCreateCategory}
      />
    </>
  );
}
