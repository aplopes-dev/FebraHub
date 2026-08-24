'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon, MinusIcon, PlusIcon } from 'lucide-react';
import { Button, Dialog, DialogContent, DialogTitle, ScrollArea } from '@citybox/ui/atoms';
import { preventDialogDismissOnToast } from '@/components/toast';
import type { CatalogProduct } from '../types/catalog-product';
import type { OrderItem, OrderItemOption } from '../types/order';
import { formatCatalogPrice } from '../data/placeholder-catalog-products';
import { usePosStore } from '../hooks/use-pos-store';

type ProductCustomizeModalProps = {
  product: CatalogProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem?: OrderItem | null;
};

export function ProductCustomizeModal({
  product,
  open,
  onOpenChange,
  editingItem,
}: ProductCustomizeModalProps) {
  const addItem = usePosStore((state) => state.addItem);
  const updateItem = usePosStore((state) => state.updateItem);
  const removeItem = usePosStore((state) => state.removeItem);

  // Initialize states dynamically based on whether we are editing an existing item
  const [quantity, setQuantity] = useState(() => {
    return editingItem ? editingItem.quantity : 1;
  });

  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>(() => {
    if (editingItem) {
      const initial: Record<string, string[]> = {};
      product?.options?.forEach((group) => {
        initial[group.id] = [];
      });
      editingItem.selectedOptions.forEach((opt) => {
        if (!initial[opt.groupId]) {
          initial[opt.groupId] = [];
        }
        initial[opt.groupId].push(opt.valueId);
      });
      return initial;
    }

    const initial: Record<string, string[]> = {};
    product?.options?.forEach((group) => {
      if (group.required && group.values.length > 0) {
        initial[group.id] = [group.values[0].id];
      } else {
        initial[group.id] = [];
      }
    });
    return initial;
  });

  const [notes, setNotes] = useState(() => {
    return editingItem ? (editingItem.notes || '') : '';
  });

  if (!product) return null;

  const handleOptionSelect = (groupId: string, valueId: string, maxChoices: number) => {
    setSelectedValues((prev) => {
      const current = prev[groupId] || [];
      if (maxChoices === 1) {
        // Single select
        return {
          ...prev,
          [groupId]: [valueId],
        };
      } else {
        // Multi select
        const exists = current.includes(valueId);
        let updated: string[];
        if (exists) {
          updated = current.filter((id) => id !== valueId);
        } else {
          if (current.length < maxChoices) {
            updated = [...current, valueId];
          } else {
            updated = current; // ignore if max choices exceeded
          }
        }
        return {
          ...prev,
          [groupId]: updated,
        };
      }
    });
  };

  // Calculate pricing
  const basePrice = product.priceCents;
  let optionsPrice = 0;
  const chosenOptions: OrderItemOption[] = [];

  product.options?.forEach((group) => {
    const selectedIds = selectedValues[group.id] || [];
    selectedIds.forEach((valueId) => {
      const optionValue = group.values.find((val) => val.id === valueId);
      if (optionValue) {
        optionsPrice += optionValue.priceCents;
        chosenOptions.push({
          groupId: group.id,
          groupName: group.name,
          valueId: optionValue.id,
          valueName: optionValue.name,
          priceCents: optionValue.priceCents,
        });
      }
    });
  });

  const singleItemTotal = basePrice + optionsPrice;
  const overallTotal = singleItemTotal * quantity;

  const handleConfirmAdd = () => {
    const fields = {
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      imageUrl: product.imageUrl,
      quantity,
      notes: notes.trim() || undefined,
      selectedOptions: chosenOptions,
    };

    if (editingItem) {
      updateItem(editingItem.id, fields);
    } else {
      addItem(fields);
    }
    onOpenChange(false);
  };

  const handleRemove = () => {
    if (editingItem) {
      removeItem(editingItem.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        onPointerDownOutside={preventDialogDismissOnToast}
        onInteractOutside={preventDialogDismissOnToast}
        onFocusOutside={preventDialogDismissOnToast}
        className="p-0 gap-0 overflow-hidden max-w-[540px] sm:max-w-[540px] w-full bg-transparent border-none shadow-2xl rounded-2xl"
      >
        <DialogTitle className="sr-only">Personalizar {product.name}</DialogTitle>

        {/* Header - bg #E5E5E5 */}
        <div className="bg-[#E5E5E5] p-6 flex items-start gap-4 text-[#171717]">
          <div className="relative size-16 shrink-0 rounded-2xl bg-white border border-[#c4c4c4] flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt=""
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <ImageIcon className="size-8 text-[#a3a3a3]" aria-hidden />
            )}
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-[20px] font-bold leading-tight truncate">
              {product.name}
            </h2>
            {product.description && (
              <p className="text-[12px] text-[#525252] leading-normal line-clamp-2">
                {product.description}
              </p>
            )}
            <span className="text-[16px] font-medium mt-1">
              {formatCatalogPrice(product.priceCents)}
            </span>
          </div>
        </div>

        {/* Body — ScrollArea quando há vários adicionais / grupos */}
        <ScrollArea
          type="scroll"
          className="max-h-[min(60vh,480px)] bg-[#F7F7F7] text-[#171717] overscroll-none"
        >
          <div className="flex flex-col gap-6 p-6">
            {/* Quantidade */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base">Quantidade</span>
              <div className="flex items-center gap-4 bg-white border border-[#e5e5e5] rounded-full p-1.5 shadow-sm">
                <button
                  type="button"
                  className="size-9 rounded-full flex items-center justify-center border border-[#e5e5e5] bg-white text-[#525252] hover:bg-[#f5f5f5] active:bg-[#e5e5e5] transition-colors"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <MinusIcon className="size-4" strokeWidth={2} />
                </button>
                <span className="font-bold text-lg min-w-[28px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="size-9 rounded-full flex items-center justify-center border border-[#e5e5e5] bg-white text-[#525252] hover:bg-[#f5f5f5] active:bg-[#e5e5e5] transition-colors"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  <PlusIcon className="size-4" strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Opções dinâmicas */}
            {product.options?.map((group) => {
              const currentSelected = selectedValues[group.id] || [];
              return (
                <div key={group.id} className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-base">{group.name}</span>
                    {group.required && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-1.5 py-0.5">
                        Obrigatório
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {group.values.map((val) => {
                      const isSelected = currentSelected.includes(val.id);
                      return (
                        <button
                          key={val.id}
                          type="button"
                          className={`w-full border rounded-xl py-3 px-4 flex justify-between items-center text-sm font-medium transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 font-semibold text-primary shadow-xs'
                              : 'bg-white border-[#e5e5e5] text-[#525252] hover:bg-[#f5f5f5]/60'
                          }`}
                          onClick={() =>
                            handleOptionSelect(group.id, val.id, group.maxChoices)
                          }
                        >
                          <span className="truncate">{val.name}</span>
                          <span className="shrink-0 text-xs font-semibold ml-2 text-muted-foreground">
                            {val.priceCents > 0
                              ? `+ ${formatCatalogPrice(val.priceCents)}`
                              : 'Grátis'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Anotações */}
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-base">Anotações</span>
              <textarea
                className="w-full min-h-[80px] p-3 text-sm border border-[#e5e5e5] rounded-xl bg-white placeholder-[#a3a3a3] outline-none focus:border-[#a3a3a3] transition-colors resize-none"
                placeholder="Adicione uma observação para este item..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Total Section - bg branco, h 70px */}
        <div className="bg-white h-[70px] px-6 flex justify-between items-center border-t border-[#e5e5e5] text-[#171717]">
          <span className="font-medium text-[#525252] text-base">Total</span>
          <span className="text-2xl font-bold text-foreground">
            {formatCatalogPrice(overallTotal)}
          </span>
        </div>

        {/* Footer actions - bg branco, max-h 100px */}
        <div className="bg-white px-6 pb-6 pt-2 flex gap-3 h-[90px] max-h-[100px] items-center border-t border-[#e5e5e5] text-[#171717]">
          {editingItem ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-[#c4c4c4] bg-white text-[#171717] hover:bg-[#f5f5f5]"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent font-semibold shadow-sm transition-colors"
                onClick={handleRemove}
              >
                Remover
              </Button>
              <Button
                type="button"
                className="flex-1 bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90"
                onClick={handleConfirmAdd}
              >
                Salvar
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-[#c4c4c4] bg-white text-[#171717] hover:bg-[#f5f5f5]"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90"
                onClick={handleConfirmAdd}
              >
                Adicionar
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
