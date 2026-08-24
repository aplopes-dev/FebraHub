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
import { PdvConfirmModal } from '@/components/pdv-confirm-modal';
import { preventDialogDismissOnToast, useToast } from '@/components/toast';
import { useProductsStore } from '@/features/products/hooks/use-products-store';
import { useStockStore } from '../hooks/use-stock-store';
import type { StockReason } from '../types/stock';

type StockExitModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProductId?: string | null;
};

export function StockExitModal({ open, onOpenChange, initialProductId }: StockExitModalProps) {
  const products = useProductsStore((state) => state.products);
  const registerExit = useStockStore((state) => state.registerExit);
  const getUnit = useStockStore((state) => state.getUnit);
  const { toast } = useToast();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<StockReason>('perda_avaria');
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
      setReason('perda_avaria');
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
        description: 'Escolha um produto para registrar a saída.',
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        variant: 'error',
        title: 'Quantidade inválida',
        description: 'A quantidade de saída deve ser maior que zero.',
      });
      return;
    }

    if (quantity > selectedProduct.stock) {
      toast({
        variant: 'error',
        title: 'Estoque insuficiente',
        description: `O estoque atual de ${selectedProduct.name} é de ${selectedProduct.stock} ${unit}.`,
      });
      return;
    }

    setConfirmOpen(true);
  };

  const handleExecuteExit = () => {
    if (!selectedProduct) return;

    const success = registerExit({
      productId: selectedProduct.id,
      quantity,
      reason,
      notes: notes.trim() || undefined,
      operator: 'Operador do Sistema',
    });

    setConfirmOpen(false);
    if (success) {
      toast({
        variant: 'success',
        title: 'Saída registrada',
        description: `Saída de ${quantity} ${unit} de ${selectedProduct.name} registrada com sucesso.`,
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
          <DialogTitle className="sr-only">Saída / Ajuste de Estoque</DialogTitle>

          {/* Cabeçalho */}
          <div className="flex shrink-0 items-center justify-center bg-[#E5E5E5] px-6 py-4 text-[#171717]">
            <h2 className="text-xl font-bold tracking-tight">Saída / Ajuste de Estoque</h2>
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
                      {prod.name} ({prod.id}) — Disponível: {prod.stock} {getUnit(prod.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantidade a retirar */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Qtd. de Saída ({unit}) *
              </label>
              <Input
                type="number"
                min="1"
                max={selectedProduct?.stock || 999}
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="h-11 font-bold text-sm"
                required
              />
              {selectedProduct && (
                <span className="text-xs text-[#737373]">
                  Disponível em estoque: <strong className="text-[#171717]">{selectedProduct.stock} {unit}</strong>
                </span>
              )}
            </div>

            {/* Motivo da Saída */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Motivo da Saída *
              </label>
              <Select value={reason} onValueChange={(val) => setReason(val as StockReason)}>
                <SelectTrigger className="!h-11 w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 text-sm font-medium text-[#171717]">
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="perda_avaria">Perda / Avaria</SelectItem>
                  <SelectItem value="validade_vencimento">Validade / Vencimento</SelectItem>
                  <SelectItem value="ajuste_inventario">Ajuste de Balanço / Inventário</SelectItem>
                  <SelectItem value="consumo_interno">Consumo Interno</SelectItem>
                  <SelectItem value="outro">Outro Motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Observações / Motivo Detalhado
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Embalagem danificada no manuseio..."
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
                Registrar Saída
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <PdvConfirmModal
        open={confirmOpen}
        variant="warning"
        title="Confirmar Saída de Estoque?"
        description={`Tem certeza que deseja registrar a saída de ${quantity} ${unit} de "${selectedProduct?.name}"?`}
        confirmLabel="Confirmar Saída"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleExecuteExit}
      />
    </>
  );
}
