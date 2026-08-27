"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import {
  FormControl,
  FormField,
  InputLabel,
  MenuItem,
  Select,
} from "@/ui";
import { VEHICLE_TYPE_OPTIONS } from "@/features/vehicle-models/lib/vehicle-model-labels";
import { VehicleModelImageUpload } from "@/features/vehicle-models/components/vehicle-model-image-upload";
import type {
  VehicleModelFormValues,
  VehicleModelType,
} from "@/features/vehicle-models/types/vehicle-model";

type VehicleModelFormProps = {
  initialValues: VehicleModelFormValues;
  onSubmit: (values: VehicleModelFormValues) => void;
  formId: string;
};

export function VehicleModelForm({
  initialValues,
  onSubmit,
  formId,
}: VehicleModelFormProps) {
  const [brand, setBrand] = useState(initialValues.brand);
  const [model, setModel] = useState(initialValues.model);
  const [version, setVersion] = useState(initialValues.version);
  const [year, setYear] = useState(initialValues.year);
  const [type, setType] = useState<VehicleModelType>(initialValues.type);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    initialValues.imagePreviewUrl,
  );
  const [imageFile, setImageFile] = useState<File | null>(
    initialValues.imageFile,
  );

  function handleImageChange(next: {
    previewUrl: string | null;
    file: File | null;
  }) {
    setImagePreviewUrl((current) => {
      if (current?.startsWith("blob:") && current !== next.previewUrl) {
        URL.revokeObjectURL(current);
      }
      return next.previewUrl;
    });
    setImageFile(next.file);
  }

  return (
    <Box
      component="form"
      id={formId}
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          brand,
          model,
          version,
          year,
          type,
          imagePreviewUrl,
          imageFile,
        });
      }}
    >
      <VehicleModelImageUpload
        previewUrl={imagePreviewUrl}
        onChange={handleImageChange}
      />

      <FormField
        id="vehicle-model-brand"
        label="Marca"
        value={brand}
        onChange={(event) => setBrand(event.target.value)}
        placeholder="Ex.: Toyota"
        required
        autoFocus
      />

      <FormField
        id="vehicle-model-name"
        label="Modelo"
        value={model}
        onChange={(event) => setModel(event.target.value)}
        placeholder="Ex.: Corolla"
        required
      />

      <FormField
        id="vehicle-model-version"
        label="Versão"
        value={version}
        onChange={(event) => setVersion(event.target.value)}
        placeholder="Opcional"
      />

      <FormField
        id="vehicle-model-year"
        label="Ano"
        type="number"
        value={year}
        onChange={(event) => setYear(event.target.value)}
        placeholder="Opcional"
        slotProps={{
          htmlInput: { min: 1900, max: 2100, step: 1 },
        }}
      />

      <FormControl fullWidth>
        <InputLabel id="vehicle-model-type-label">Tipo</InputLabel>
        <Select
          labelId="vehicle-model-type-label"
          id="vehicle-model-type"
          label="Tipo"
          value={type}
          onChange={(event) => setType(event.target.value as VehicleModelType)}
        >
          {VEHICLE_TYPE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
