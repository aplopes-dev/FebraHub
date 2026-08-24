'use client';

import { useState } from 'react';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Switch,
  Textarea,
} from '@citybox/ui/atoms';
import { ProductImageUpload } from './product-image-upload';

export type ProductInfoFormValues = {
  imageUrl: string | null;
  isEnabled: boolean;
  name: string;
  sku: string;
  description: string;
  category: string;
};

export type ProductInfoFormErrors = {
  imageUrl?: boolean;
  name?: boolean;
  sku?: boolean;
  category?: boolean;
};

type ProductFormStepInfoProps = {
  values: ProductInfoFormValues;
  errors: ProductInfoFormErrors;
  categories: readonly string[];
  onChange: (next: ProductInfoFormValues) => void;
  onImageReject: (message: string) => void;
};

export function ProductFormStepInfo({
  values,
  errors,
  categories,
  onChange,
  onImageReject,
}: ProductFormStepInfoProps) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-base font-bold text-[#171717]">Informações do produto</h3>

      <ProductImageUpload
        imageUrl={values.imageUrl}
        onChange={(imageUrl) => onChange({ ...values, imageUrl })}
        onReject={onImageReject}
        error={Boolean(errors.imageUrl)}
      />

      <div className="flex items-center justify-between gap-4 rounded-[var(--pdv-control-radius)] border border-[#e5e5e5] bg-white px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#171717]">Status</p>
          <p className="text-xs font-medium text-[#a3a3a3]">
            Ativar e exibir este produto no cardápio
          </p>
        </div>
        <Switch
          checked={values.isEnabled}
          onCheckedChange={(checked) => onChange({ ...values, isEnabled: checked })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#171717]">
          Nome do produto <span className="text-[#ef4444]">*</span>
        </label>
        <Input
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          placeholder="Digite o nome do produto"
          aria-invalid={Boolean(errors.name)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#171717]">
          SKU <span className="text-[#ef4444]">*</span>
        </label>
        <Input
          value={values.sku}
          onChange={(event) => onChange({ ...values, sku: event.target.value })}
          placeholder="Digite o SKU"
          aria-invalid={Boolean(errors.sku)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#171717]">Descrição</label>
        <Textarea
          value={values.description}
          onChange={(event) => onChange({ ...values, description: event.target.value })}
          placeholder="Adicione uma descrição"
          rows={3}
          className="min-h-[88px] resize-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#171717]">Categoria</label>
        <DropdownMenu open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="pdv-field flex w-full items-center justify-between text-left font-normal text-[#171717] hover:bg-black/[0.01] cursor-pointer"
            >
              <span className={values.category ? 'text-[#171717]' : 'text-[#a3a3a3]'}>
                {values.category || 'Escolher categoria'}
              </span>
              <ChevronDownIcon className="size-4 text-[#737373]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[var(--radix-dropdown-menu-trigger-width)]"
          >
            {categories.map((category) => (
              <DropdownMenuItem
                key={category}
                onClick={() => onChange({ ...values, category })}
              >
                <span className="flex-1">{category}</span>
                {values.category === category && (
                  <CheckIcon className="size-4" strokeWidth={2.5} />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
