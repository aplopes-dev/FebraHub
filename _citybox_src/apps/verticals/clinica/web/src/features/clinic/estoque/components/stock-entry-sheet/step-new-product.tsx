"use client";

import { useId } from "react";

import { cn } from "@citybox/ui";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";

import { CATEGORY_OPTIONS } from "../stock-table/options";
import { ProductPhotoUpload } from "./product-photo-upload";
import { SupplierSelect } from "../supplier-select/supplier-select";
import type { NewProductFormData } from "./types";

function formatCurrency(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}

function parseCurrencyInput(inputValue: string): number {
  const numericString = inputValue.replace(/\D/g, "");
  if (!numericString) return 0;
  return parseInt(numericString, 10) / 100;
}

interface TextEntryProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function TextEntry({ label, value, onChange, className }: TextEntryProps) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

interface NumberEntryProps {
  label: string;
  value: number;
  min?: number;
  step?: number;
  onChange: (value: number) => void;
}

function NumberEntry({ label, value, min, step, onChange }: NumberEntryProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") return onChange(0);

          const next = Number(raw);
          if (!Number.isFinite(next)) return onChange(0);

          // Quantidades são inteiros no backend.
          if (step === 1) return onChange(Math.trunc(next));
          return onChange(next);
        }}
      />
    </div>
  );
}

interface StepNewProductProps {
  formData: NewProductFormData;
  onFormDataChange: (data: Partial<NewProductFormData>) => void;
  isEditMode?: boolean;
}

export function StepNewProduct({
  formData,
  onFormDataChange,
  isEditMode = false,
}: StepNewProductProps) {
  const categoryId = useId();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? "Atualize as informações do produto"
            : "Preencha os dados do novo produto"}
        </p>
      </div>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="grid min-w-0 flex-1 gap-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextEntry
              label="Nome do produto"
              value={formData.name}
              onChange={(name) => onFormDataChange({ name })}
              className="sm:col-span-2"
            />
            <TextEntry
              label="SKU"
              value={formData.sku}
              onChange={(sku) => onFormDataChange({ sku })}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SupplierSelect
              value={formData.supplierId || null}
              onValueChange={(value) => onFormDataChange({ supplierId: value })}
              label="Fornecedor"
            />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={categoryId}>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => onFormDataChange({ category: value })}
              >
                <SelectTrigger id={categoryId} className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberEntry
              label="Quantidade em estoque"
              min={0}
              step={1}
              value={formData.quantity}
              onChange={(quantity) => onFormDataChange({ quantity })}
            />
            <TextEntry
              label="Custo unitário"
              value={formatCurrency(formData.unitCost)}
              onChange={(value) =>
                onFormDataChange({ unitCost: parseCurrencyInput(value) })
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberEntry
              label="Quantidade ideal (mínimo)"
              min={0}
              step={1}
              value={formData.minQuantity}
              onChange={(minQuantity) => onFormDataChange({ minQuantity })}
            />
          </div>
        </div>

        <div className="mx-auto w-full max-w-44 shrink-0 sm:mx-0 sm:w-44">
          <ProductPhotoUpload
            existingPhotoUrl={formData.existingPhotoUrl}
            photoFile={formData.photoFile}
            photoRemoved={formData.photoRemoved}
            onSelectFile={(file) => onFormDataChange({ photoFile: file, photoRemoved: false })}
            onRemove={() => onFormDataChange({ photoFile: null, photoRemoved: true })}
          />
        </div>
      </div>
    </div>
  );
}
