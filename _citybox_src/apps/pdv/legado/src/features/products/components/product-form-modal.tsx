'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@citybox/ui/atoms';
import { PdvConfirmModal } from '@/components/pdv-confirm-modal';
import { preventDialogDismissOnToast, useToast } from '@/components/toast';
import { PRODUCT_CATEGORIES } from '../data/placeholder-products';
import { useProductsStore } from '../hooks/use-products-store';
import type {
  PdvProduct,
  ProductAttribute,
  ProductIngredientsConfig,
  ProductModifierGroup,
  ProductStatus,
} from '../types/product';
import { ProductFormStepIngredients } from './product-form-step-ingredients';
import {
  ProductFormStepInfo,
  type ProductInfoFormErrors,
  type ProductInfoFormValues,
} from './product-form-step-info';
import {
  ProductFormStepPricing,
  type ProductPricingFormErrors,
  type ProductPricingFormValues,
} from './product-form-step-pricing';
import { ProductFormStepVariants } from './product-form-step-variants';
import { ProductFormStepper, type ProductFormStepConfig } from './product-form-stepper';

const STEPS: readonly ProductFormStepConfig[] = [
  {
    id: 'info',
    label: 'Informações',
    description: 'Defina os detalhes do produto.',
  },
  {
    id: 'pricing',
    label: 'Precificação',
    description: 'Defina preço e impostos.',
  },
  {
    id: 'variants',
    label: 'Variantes e modificadores',
    description: 'Variações e opções personalizáveis.',
  },
  {
    id: 'ingredients',
    label: 'Ingredientes',
    description: 'Defina ingredientes e estoque.',
  },
] as const;

const EMPTY_INFO: ProductInfoFormValues = {
  imageUrl: null,
  isEnabled: false,
  name: '',
  sku: '',
  description: '',
  category: '',
};

const EMPTY_PRICING: ProductPricingFormValues = {
  price: 0,
  takeawayPrice: 0,
  taxPercent: 0,
};

const EMPTY_INGREDIENTS: ProductIngredientsConfig = {
  unlimitedAvailability: false,
  ingredients: [],
};

type ProductFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: PdvProduct | null;
};

function normalizeSku(sku: string): string {
  return sku.trim();
}

export function ProductFormModal({ open, onOpenChange, productToEdit }: ProductFormModalProps) {
  const products = useProductsStore((state) => state.products);
  const addProduct = useProductsStore((state) => state.addProduct);
  const updateProduct = useProductsStore((state) => state.updateProduct);
  const skuExists = useProductsStore((state) => state.skuExists);
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [info, setInfo] = useState<ProductInfoFormValues>(EMPTY_INFO);
  const [pricing, setPricing] = useState<ProductPricingFormValues>(EMPTY_PRICING);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [modifiers, setModifiers] = useState<ProductModifierGroup[]>([]);
  const [ingredientsConfig, setIngredientsConfig] =
    useState<ProductIngredientsConfig>(EMPTY_INGREDIENTS);
  const [infoErrors, setInfoErrors] = useState<ProductInfoFormErrors>({});
  const [pricingErrors, setPricingErrors] = useState<ProductPricingFormErrors>({});

  const categoryOptions = Array.from(
    new Set([...PRODUCT_CATEGORIES, ...products.map((product) => product.category)]),
  ).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (open && productToEdit) {
      setCurrentIndex(0);
      setConfirmAddOpen(false);
      setInfo({
        imageUrl: productToEdit.imageUrl,
        isEnabled: productToEdit.status === 'active',
        name: productToEdit.name,
        sku: productToEdit.id,
        description: productToEdit.description || '',
        category: productToEdit.category || '',
      });
      setPricing({
        price: productToEdit.priceCents / 100,
        takeawayPrice: 0,
        taxPercent: 0,
      });
      setAttributes(productToEdit.attributes ? [...productToEdit.attributes] : []);
      setModifiers(productToEdit.modifiers ? [...productToEdit.modifiers] : []);
      setIngredientsConfig(
        productToEdit.ingredientsConfig
          ? { ...productToEdit.ingredientsConfig }
          : { unlimitedAvailability: false, ingredients: [] },
      );
      setInfoErrors({});
      setPricingErrors({});
    } else if (!open) {
      const timeout = window.setTimeout(() => {
        setCurrentIndex(0);
        setConfirmAddOpen(false);
        setInfo(EMPTY_INFO);
        setPricing(EMPTY_PRICING);
        setAttributes([]);
        setModifiers([]);
        setIngredientsConfig(EMPTY_INGREDIENTS);
        setInfoErrors({});
        setPricingErrors({});
      }, 200);
      return () => window.clearTimeout(timeout);
    }
  }, [open, productToEdit]);

  const validateInfo = (): { errors: ProductInfoFormErrors; skuDuplicate: boolean } => {
    const nextErrors: ProductInfoFormErrors = {};
    const sku = normalizeSku(info.sku);
    let skuDuplicate = false;

    if (!info.imageUrl) nextErrors.imageUrl = true;
    if (!info.name.trim()) nextErrors.name = true;
    if (!sku) {
      nextErrors.sku = true;
    } else if (skuExists(sku, productToEdit?.id)) {
      nextErrors.sku = true;
      skuDuplicate = true;
    }

    return { errors: nextErrors, skuDuplicate };
  };

  const validatePricing = (): ProductPricingFormErrors => {
    const nextErrors: ProductPricingFormErrors = {};
    if (pricing.price <= 0) nextErrors.price = true;
    return nextErrors;
  };

  const buildProduct = (status: ProductStatus): PdvProduct => ({
    id: normalizeSku(info.sku),
    name: info.name.trim(),
    description: info.description.trim(),
    imageUrl: info.imageUrl,
    category: info.category || 'Sem categoria',
    stock: productToEdit ? productToEdit.stock : 0,
    priceCents: Math.round(pricing.price * 100),
    status,
    attributes: attributes.length > 0 ? attributes : undefined,
    modifiers: modifiers.length > 0 ? modifiers : undefined,
    ingredientsConfig,
  });

  const persistProduct = (status: ProductStatus) => {
    const { errors: nextInfoErrors, skuDuplicate } = validateInfo();
    setInfoErrors(nextInfoErrors);
    if (Object.keys(nextInfoErrors).length > 0) {
      setCurrentIndex(0);
      if (skuDuplicate) {
        toast({
          variant: 'error',
          title: 'SKU já existe',
          description: 'Informe um SKU diferente dos produtos cadastrados.',
        });
      } else {
        toast({
          variant: 'error',
          title: 'Campos obrigatórios',
          description: 'Preencha imagem, nome e SKU para continuar.',
        });
      }
      return false;
    }

    const updatedProduct = buildProduct(status);
    if (productToEdit) {
      updateProduct(productToEdit.id, updatedProduct);
      toast({
        variant: 'success',
        title: status === 'draft' ? 'Rascunho salvo' : 'Produto atualizado',
        description:
          status === 'draft'
            ? `${info.name.trim()} foi salvo como rascunho.`
            : `${info.name.trim()} foi atualizado com sucesso.`,
      });
    } else {
      addProduct(updatedProduct);
      toast({
        variant: 'success',
        title: status === 'draft' ? 'Rascunho salvo' : 'Produto adicionado',
        description:
          status === 'draft'
            ? `${info.name.trim()} foi salvo como rascunho.`
            : `${info.name.trim()} foi adicionado com sucesso.`,
      });
    }

    onOpenChange(false);
    return true;
  };

  const handleNext = () => {
    if (currentIndex === 0) {
      const { errors: nextErrors, skuDuplicate } = validateInfo();
      setInfoErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        if (skuDuplicate) {
          toast({
            variant: 'error',
            title: 'SKU já existe',
            description: 'Informe um SKU diferente dos produtos cadastrados.',
          });
        } else {
          toast({
            variant: 'error',
            title: 'Campos obrigatórios',
            description: 'Preencha imagem, nome e SKU para continuar.',
          });
        }
        return;
      }
    }

    if (currentIndex === 1) {
      const nextPricingErrors = validatePricing();
      setPricingErrors(nextPricingErrors);
      if (Object.keys(nextPricingErrors).length > 0) {
        toast({
          variant: 'error',
          title: 'Campos obrigatórios',
          description: 'Informe o preço do produto para continuar.',
        });
        return;
      }
    }

    if (currentIndex >= STEPS.length - 1) {
      // Valida os passos prévios antes de abrir a confirmação
      const { errors: nextInfoErrors } = validateInfo();
      if (Object.keys(nextInfoErrors).length > 0) {
        setCurrentIndex(0);
        toast({
          variant: 'error',
          title: 'Campos obrigatórios',
          description: 'Preencha imagem, nome e SKU para continuar.',
        });
        return;
      }
      const nextPricingErrors = validatePricing();
      if (Object.keys(nextPricingErrors).length > 0) {
        setCurrentIndex(1);
        toast({
          variant: 'error',
          title: 'Campos obrigatórios',
          description: 'Informe o preço do produto para continuar.',
        });
        return;
      }
      setConfirmAddOpen(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
  };

  const handleBack = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

  const handleSaveDraft = () => {
    persistProduct('draft');
  };

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === STEPS.length - 1;

  const modalTitle = productToEdit ? 'Editar Produto' : 'Adicionar Produto';
  const saveButtonText = productToEdit ? 'Salvar' : 'Adicionar';
  const confirmModalTitle = productToEdit ? 'Salvar Alterações?' : 'Adicionar Produto?';
  const confirmModalDescription = productToEdit
    ? 'Tem certeza que deseja salvar as alterações deste produto?'
    : 'Tem certeza que deseja adicionar este novo produto? Certifique-se de que todos os dados estão corretos.';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[90vh] w-full max-w-[720px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[720px]"
          onPointerDownOutside={preventDialogDismissOnToast}
          onInteractOutside={preventDialogDismissOnToast}
          onFocusOutside={preventDialogDismissOnToast}
        >
          <DialogTitle className="sr-only">{modalTitle}</DialogTitle>

          <div className="flex shrink-0 items-center justify-center bg-[#E5E5E5] px-8 py-5 text-[#171717]">
            <h2 className="text-xl font-bold tracking-tight">{modalTitle}</h2>
          </div>

          <div className="shrink-0 border-b border-[#e5e5e5] bg-[#F7F7F7] px-8 py-5">
            <ProductFormStepper steps={STEPS} currentIndex={currentIndex} />
          </div>

          <div className="min-h-0 max-h-[min(55vh,520px)] flex-1 overflow-y-auto overscroll-none bg-[#F7F7F7]">
            <div className="px-8 py-6 pb-8 text-[#171717]">
              {currentIndex === 0 ? (
                <ProductFormStepInfo
                  values={info}
                  errors={infoErrors}
                  categories={categoryOptions}
                  onChange={(next) => {
                    setInfo(next);
                    setInfoErrors({});
                  }}
                  onImageReject={(message) => {
                    toast({
                      variant: 'error',
                      title: 'Imagem inválida',
                      description: message,
                    });
                  }}
                />
              ) : currentIndex === 1 ? (
                <ProductFormStepPricing
                  values={pricing}
                  errors={pricingErrors}
                  onChange={(next) => {
                    setPricing(next);
                    setPricingErrors({});
                  }}
                />
              ) : currentIndex === 2 ? (
                <ProductFormStepVariants
                  attributes={attributes}
                  modifiers={modifiers}
                  onChange={({ attributes: nextAttrs, modifiers: nextMods }) => {
                    setAttributes(nextAttrs);
                    setModifiers(nextMods);
                  }}
                />
              ) : (
                <ProductFormStepIngredients
                  values={ingredientsConfig}
                  onChange={setIngredientsConfig}
                />
              )}
            </div>
          </div>

          <div className="relative z-10 flex shrink-0 items-center justify-end gap-2 border-t border-[#E5E5E5] bg-white px-8 py-4">
            <button
              type="button"
              className="flex h-11 items-center justify-center rounded-[var(--pdv-control-radius)] px-4 text-sm font-semibold text-[#737373] hover:text-[#171717] cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="pdv-gradient-border-btn flex h-11 items-center justify-center px-4 text-sm font-semibold text-[#171717] cursor-pointer"
              onClick={handleSaveDraft}
            >
              Salvar rascunho
            </button>
            <button
              type="button"
              disabled={isFirst}
              className="pdv-gradient-border-btn flex h-11 items-center justify-center px-4 text-sm font-semibold text-[#171717] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleBack}
            >
              Voltar
            </button>
            <button
              type="button"
              className="pdv-primary-gradient-btn flex h-11 min-w-[110px] items-center justify-center px-5 text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
              onClick={handleNext}
            >
              {isLast ? saveButtonText : 'Próximo'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação ao clicar em Adicionar / Salvar */}
      <PdvConfirmModal
        open={confirmAddOpen}
        variant="warning"
        title={confirmModalTitle}
        description={confirmModalDescription}
        confirmLabel={saveButtonText}
        onCancel={() => setConfirmAddOpen(false)}
        onConfirm={() => {
          setConfirmAddOpen(false);
          const status: ProductStatus = info.isEnabled ? 'active' : 'inactive';
          persistProduct(status);
        }}
      />
    </>
  );
}
