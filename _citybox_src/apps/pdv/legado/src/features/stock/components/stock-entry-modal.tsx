'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { CurrencyInput } from '@citybox/ui/molecules';
import { PdvConfirmModal } from '@/components/pdv-confirm-modal';
import { preventDialogDismissOnToast, useToast } from '@/components/toast';
import { useProductsStore } from '@/features/products/hooks/use-products-store';
import { useStockStore } from '../hooks/use-stock-store';
import type { StockReason } from '../types/stock';
import { STOCK_REASON_LABEL } from '../types/stock';

type StockEntryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductId?: string | null;
};

export function StockEntryModal({ open, onOpenChange, initialProductId }: StockEntryModalProps) {
  const products = useProductsStore((state) => state.products);
  const registerEntry = useStockStore((state) => state.registerEntry);
  const getUnit = useStockStore((state) => state.getUnit);
  const { toast } = useToast();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<StockReason>('compra_fornecedor');
  const [unitCost, setUnitCost] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialProductId) {
        setSelectedProductId(initialProductId);
      } else if (products.length > 0) {
        setSelectedProductId(products[0].id);
      }
      setQuantity(1);
      setReason('compra_fornecedor');
      setUnitCost(0);
      setNotes('');
      setConfirmOpen(false);
    }
  }, [open, initialProductId, products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const unit = selectedProduct ? getUnit(selectedProduct.id) : 'un';

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast({
        variant: 'error',
        title: 'Selecione um produto',
        description: 'Escolha um produto para registrar a entrada.',
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        variant: 'error',
        title: 'Quantidade inválida',
        description: 'A quantidade de entrada deve ser maior que zero.',
      });
      return;
    }

    setConfirmOpen(true);
  };

  const handleExecuteEntry = () => {
    if (!selectedProduct) return;

    const success = registerEntry({
      productId: selectedProduct.id,
      quantity,
      reason,
      unitPriceCents: unitCost > 0 ? Math.round(unitCost * 100) : undefined,
      notes: notes.trim() || undefined,
      operator: 'Operador de Caixa',
    });

    setConfirmOpen(false);
    if (success) {
      toast({
        variant: 'success',
        title: 'Entrada registrada',
        description: `Entrada de ${quantity} ${unit} para ${selectedProduct.name} registrada com sucesso.`,
      });
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="flex max-h-[90vh] w-full max-w-[560px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[560px]"
          onPointerDownOutside={preventDialogDismissOnToast}
          onInteractOutside={preventDialogDismissOnToast}
          onFocusOutside={preventDialogDismissOnToast}
        >
          <DialogTitle className="sr-only">Entrada de Estoque</DialogTitle>

          {/* Cabeçalho */}
          <div className="flex shrink-0 items-center justify-center bg-[#E5E5E5] px-6 py-4 text-[#171717]">
            <h2 className="text-xl font-bold tracking-tight">Entrada de Estoque</h2>
          </div>

          {/* Corpo do Formulário */}
          <form onSubmit={handleOpenConfirm} className="flex flex-col gap-5 bg-[#F7F7F7] p-6 text-[#171717]">
            {/* Seleção do Produto */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Produto / Insumo *
              </label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="!h-11 w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 text-sm font-medium text-[#171717]">
                  <SelectValue placeholder="Selecione o produto ou insumo..." />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {products.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.name} ({prod.id}) — Atual: {prod.stock} {getUnit(prod.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantidade e Preço de Custo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Qtd. de Entrada ({unit}) *
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="h-11 font-bold text-sm"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Custo Unitário (R$)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#737373]">
                    R$
                  </span>
                  <CurrencyInput
                    value={unitCost}
                    onValueChange={setUnitCost}
                    className="!pl-10 h-11 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Motivo da Entrada */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Motivo / Origem *
              </label>
              <Select value={reason} onValueChange={(val) => setReason(val as StockReason)}>
                <SelectTrigger className="!h-11 w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 text-sm font-medium text-[#171717]">
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="compra_fornecedor">Compra de Fornecedor</SelectItem>
                  <SelectItem value="devolucao_cliente">Devolução de Cliente</SelectItem>
                  <SelectItem value="ajuste_inventario">Ajuste de Inventário</SelectItem>
                  <SelectItem value="outro">Outro Motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Observações / Nota Fiscal
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Nota Fiscal #4812, fornecedor X..."
                className="w-full rounded-xl border border-[#E5E5E5] bg-white p-3 text-sm font-medium text-[#171717] focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Rodapé com botões */}
            <div className="mt-2 flex items-center justify-end gap-3 border-t border-[#E5E5E5] pt-4">
              <button
                type="button"
                className="h-11 px-4 text-sm font-semibold text-[#737373] hover:text-[#171717] cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="pdv-primary-gradient-btn flex h-11 items-center justify-center px-6 text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
              >
                Registrar Entrada
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <PdvConfirmModal
        open={confirmOpen}
        variant="warning"
        title="Confirmar Entrada de Estoque?"
        description={`Tem certeza que deseja registrar a entrada de ${quantity} ${unit} para "${selectedProduct?.name}"?`}
        confirmLabel="Confirmar Entrada"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleExecuteEntry}
      />
    </>
  );
}
