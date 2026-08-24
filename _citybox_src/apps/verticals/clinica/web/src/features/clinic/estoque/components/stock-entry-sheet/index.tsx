"use client";

import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "@citybox/ui";
import {
  Button,
  ScrollArea,
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@citybox/ui/atoms";
import { ConfirmDialog } from "@citybox/ui/organisms";
import { toast } from "sonner";

import { CLINIC_FLOATING_SHEET_CONTENT_CLASS } from "@/features/clinic/lib/clinic-sheet-styles";
import { ClinicaApiError } from "@/features/clinic/shared/api";

import type { StockProduct } from "../../types";
import { stockService } from "../../services/stock.service";
import { useCreateProduct } from "../../hooks/use-create-product";
import { useUpdateProduct } from "../../hooks/use-update-product";
import { useStockBulkEntry } from "../../hooks/use-stock-bulk-entry";
import { STOCK_MOVEMENTS_KEY } from "../../hooks/use-stock-movements";
import { STOCK_PRODUCTS_KEY } from "../../hooks/use-stock-products";
import { STOCK_STATS_KEY } from "../../hooks/use-stock-stats";
import { useStockProducts } from "../../hooks/use-stock-products";
import { StepSelectOption } from "./step-select-option";
import { StepNewProduct } from "./step-new-product";
import { StepAddQuantity } from "./step-add-quantity";
import { useClinicId } from "../../lib/use-clinic-id";
import type {
  NewProductFormData,
  ProductQuantityEntry,
  StockEntryOption,
  StockEntryStep,
} from "./types";

interface StockEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: StockProduct | null;
}

const INITIAL_FORM_DATA: NewProductFormData = {
  name: "",
  sku: "",
  supplierId: "",
  category: "",
  quantity: 0,
  minQuantity: 0,
  unitCost: 0,
  existingPhotoUrl: null,
  photoFile: null,
  photoRemoved: false,
};

function getFormDataFromProduct(product: StockProduct): NewProductFormData {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku ?? "",
    supplierId: product.supplierId ?? "",
    category: product.category,
    quantity: product.quantity,
    minQuantity: product.minQuantity,
    unitCost: product.unitCost,
    existingPhotoUrl: product.photoUrl ?? null,
    photoFile: null,
    photoRemoved: false,
  };
}

export function StockEntrySheet({
  open,
  onOpenChange,
  productToEdit,
}: StockEntrySheetProps) {
  const isEditMode = !!productToEdit;
  const queryClient = useQueryClient();
  const { clinicId } = useClinicId();
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);

  const initialStep: StockEntryStep = isEditMode ? "new-product" : "select-option";
  const initialFormData = productToEdit
    ? getFormDataFromProduct(productToEdit)
    : INITIAL_FORM_DATA;

  const [step, setStep] = useState<StockEntryStep>(initialStep);
  const [selectedOption, setSelectedOption] = useState<StockEntryOption | null>(null);
  const [newProductData, setNewProductData] =
    useState<NewProductFormData>(initialFormData);
  const [quantityEntries, setQuantityEntries] = useState<ProductQuantityEntry[]>([]);
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = useState(false);

  const [lastProductId, setLastProductId] = useState<string | null>(
    productToEdit?.id ?? null,
  );

  if (productToEdit && productToEdit.id !== lastProductId) {
    setLastProductId(productToEdit.id);
    setStep("new-product");
    setNewProductData(getFormDataFromProduct(productToEdit));
  }

  if (!productToEdit && lastProductId !== null) {
    setLastProductId(null);
  }

  const { mutateAsync: createProduct, isPending: isCreating } = useCreateProduct();
  const { mutateAsync: updateProduct, isPending: isUpdating } = useUpdateProduct();
  const { mutate: bulkEntry, isPending: isBulkPending } = useStockBulkEntry();
  const { data: productsData } = useStockProducts();

  const resetState = useCallback(() => {
    setStep("select-option");
    setSelectedOption(null);
    setNewProductData(INITIAL_FORM_DATA);
    setQuantityEntries([]);
    setLastProductId(null);
    setIsConfirmBulkOpen(false);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleContinue = () => {
    if (selectedOption === "new-product") {
      setStep("new-product");
    } else if (selectedOption === "existing-product") {
      setStep("add-quantity");
    }
  };

  const handleFormDataChange = (data: Partial<NewProductFormData>) => {
    setNewProductData((prev) => ({ ...prev, ...data }));
  };

  const handleSaveNewProduct = async () => {
    if (!clinicId) {
      toast.error("Selecione uma loja para salvar o produto.");
      return;
    }

    setIsPhotoBusy(true);
    try {
      if (isEditMode && newProductData.id) {
        await updateProduct({
          id: newProductData.id,
          data: {
            name: newProductData.name,
            category: newProductData.category,
            minQuantity: Math.trunc(newProductData.minQuantity),
            unitCost: newProductData.unitCost,
            sku: newProductData.sku || null,
            supplierId: newProductData.supplierId || null,
          },
        });

        if (newProductData.photoRemoved) {
          try {
            await stockService.products.deletePhoto(clinicId, newProductData.id);
          } catch (err) {
            if (err instanceof ClinicaApiError && err.status === 404) {
              // Sem foto previamente (sem objeto na storage): sem-op.
            } else {
              throw err;
            }
          }
        } else if (newProductData.photoFile) {
          await stockService.products.uploadPhoto(
            clinicId,
            newProductData.id,
            newProductData.photoFile,
          );
        }
      } else {
        const created = await createProduct({
          name: newProductData.name,
          category: newProductData.category,
          quantity: Math.trunc(newProductData.quantity),
          minQuantity: Math.trunc(newProductData.minQuantity),
          unitCost: newProductData.unitCost,
          sku: newProductData.sku || undefined,
          supplierId: newProductData.supplierId || undefined,
        });

        if (newProductData.photoFile) {
          await stockService.products.uploadPhoto(clinicId, created.id, newProductData.photoFile);
        }
      }

      void queryClient.invalidateQueries({ queryKey: [...STOCK_PRODUCTS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: [...STOCK_STATS_KEY, clinicId] });
      void queryClient.invalidateQueries({ queryKey: [...STOCK_MOVEMENTS_KEY, clinicId] });

      handleOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar produto.";
      toast.error(msg);
    } finally {
      setIsPhotoBusy(false);
    }
  };

  const handleConfirmBulk = () => {
    bulkEntry(
      { items: quantityEntries },
      {
        onSuccess: () => {
          setIsConfirmBulkOpen(false);
          handleOpenChange(false);
        },
        onError: () => {
          setIsConfirmBulkOpen(false);
        },
      },
    );
  };

  const getProductName = (productId: string) => {
    return productsData?.products.find((p) => p.id === productId)?.name ?? productId;
  };

  const getTitle = (): string => {
    switch (step) {
      case "new-product":
        return isEditMode ? "Editar produto" : "Adicionar produto ao estoque";
      case "add-quantity":
        return "Adicionar quantidade";
      default:
        return "Fazer entrada no estoque";
    }
  };

  const canContinue = selectedOption !== null;
  const canSaveNewProduct = Boolean(
    newProductData.name && newProductData.category && newProductData.supplierId,
  );
  const canSaveQuantityEntries = quantityEntries.length > 0;
  const isSavingProduct = isCreating || isUpdating || isPhotoBusy;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          className={cn(
            "flex flex-col gap-0 p-0",
            CLINIC_FLOATING_SHEET_CONTENT_CLASS,
            "data-[side=right]:sm:max-w-[min(56rem,calc(100%-2rem))]",
          )}
        >
          <SheetHeader className="shrink-0 border-b border-border/50 px-6 py-5">
            <div className="flex items-center gap-2">
              {step !== "select-option" && !isEditMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep("select-option")}
                  className="size-8 shrink-0"
                >
                  <ArrowLeft className="size-4" />
                </Button>
              )}
              <SheetTitle className="text-base font-semibold">{getTitle()}</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="h-full flex-1">
              <div className="p-6">
                {step === "select-option" && (
                  <StepSelectOption
                    selectedOption={selectedOption}
                    onSelectOption={setSelectedOption}
                  />
                )}
                {step === "new-product" && (
                  <StepNewProduct
                    formData={newProductData}
                    onFormDataChange={handleFormDataChange}
                    isEditMode={isEditMode}
                  />
                )}
                {step === "add-quantity" && (
                  <StepAddQuantity
                    entries={quantityEntries}
                    onEntriesChange={setQuantityEntries}
                  />
                )}
              </div>
            </ScrollArea>
          </div>

          <SheetFooter className="flex-row justify-end gap-3 border-t border-border/50 px-6 py-5">
            <SheetClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </SheetClose>
            {step === "select-option" && (
              <Button className="px-8" onClick={handleContinue} disabled={!canContinue}>
                Continuar
              </Button>
            )}
            {step === "new-product" && (
              <Button
                className="px-8"
                onClick={handleSaveNewProduct}
                disabled={!canSaveNewProduct || isSavingProduct}
              >
                {isSavingProduct
                  ? "Salvando..."
                  : isEditMode
                    ? "Salvar alterações"
                    : "Salvar produto"}
              </Button>
            )}
            {step === "add-quantity" && (
              <Button
                className="px-8"
                onClick={() => setIsConfirmBulkOpen(true)}
                disabled={!canSaveQuantityEntries}
              >
                Salvar entradas
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={isConfirmBulkOpen}
        onOpenChange={setIsConfirmBulkOpen}
        onConfirm={handleConfirmBulk}
        title="Confirmar entradas em lote"
        confirmLabel={isBulkPending ? "Salvando..." : "Confirmar entradas"}
        cancelLabel="Revisar"
        isConfirming={isBulkPending}
        description={
          <span className="block space-y-3">
            <span className="block">Revise as entradas antes de confirmar:</span>
            <span className="block space-y-1 rounded-md border bg-muted/40 p-3 text-sm">
              {quantityEntries.map((entry) => (
                <span key={entry.productId} className="flex justify-between">
                  <span className="font-medium">{getProductName(entry.productId)}</span>
                  <span className="text-muted-foreground">+{entry.quantity} unid.</span>
                </span>
              ))}
            </span>
            <span className="block text-xs text-muted-foreground">
              Se qualquer item falhar, todas as entradas serão canceladas.
            </span>
          </span>
        }
      />
    </>
  );
}
