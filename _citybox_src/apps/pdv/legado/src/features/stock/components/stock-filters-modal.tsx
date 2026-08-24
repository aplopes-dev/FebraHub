'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@citybox/ui/atoms';
import { preventDialogDismissOnToast } from '@/components/toast';
import type { StockFilters } from '../types/stock';

type StockFiltersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: StockFilters;
  onDraftChange: (next: StockFilters | ((prev: StockFilters) => StockFilters)) => void;
  categories: readonly string[];
  onCancel: () => void;
  onApply: () => void;
};

export function isStockFiltersActive(filters: StockFilters): boolean {
  return (
    filters.stockLevel !== 'all' ||
    filters.category !== 'all' ||
    filters.itemType !== 'all' ||
    filters.movementType !== 'all'
  );
}

export function StockFiltersModal({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  categories,
  onCancel,
  onApply,
}: StockFiltersModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-full max-w-[480px] flex-col gap-0 overflow-hidden rounded-2xl border-none bg-transparent p-0 shadow-2xl sm:max-w-[480px]"
        onPointerDownOutside={preventDialogDismissOnToast}
        onInteractOutside={preventDialogDismissOnToast}
        onFocusOutside={preventDialogDismissOnToast}
      >
        <DialogTitle className="sr-only">Filtros de Estoque</DialogTitle>

        <div className="flex shrink-0 items-center justify-center bg-[#E5E5E5] px-6 py-4 text-[#171717]">
          <h2 className="text-xl font-bold tracking-tight">Filtros de Estoque</h2>
        </div>

        <div className="flex flex-col gap-5 bg-[#F7F7F7] p-6 text-[#171717]">
          {/* Tipo de Item (Analítico: Revenda vs Insumos) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Tipo de Item no Estoque
            </label>
            <Select
              value={draft.itemType}
              onValueChange={(val) =>
                onDraftChange((prev) => ({
                  ...prev,
                  itemType: val as StockFilters['itemType'],
                }))
              }
            >
              <SelectTrigger className="!h-11 w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 text-sm font-medium text-[#171717]">
                <SelectValue placeholder="Selecione o tipo de item..." />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="retail">Produtos Prontos (Revenda Direta)</SelectItem>
                <SelectItem value="ingredient">Insumos / Ingredientes (Matéria-Prima)</SelectItem>
                <SelectItem value="prepared">Produtos Preparados (Receita / Cozinha)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nível do Estoque */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Status do Estoque
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'in_stock', label: 'Em Estoque' },
                { id: 'low_stock', label: 'Estoque Baixo' },
                { id: 'out_of_stock', label: 'Sem Estoque' },
              ].map((opt) => {
                const isActive = draft.stockLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      onDraftChange((prev) => ({
                        ...prev,
                        stockLevel: opt.id as StockFilters['stockLevel'],
                      }))
                    }
                    className={`flex h-10 items-center justify-center rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-[#E5E5E5] bg-white text-[#171717] hover:bg-black/[0.02]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Categoria do Produto
            </label>
            <Select
              value={draft.category}
              onValueChange={(val) => onDraftChange((prev) => ({ ...prev, category: val }))}
            >
              <SelectTrigger className="!h-11 w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 text-sm font-medium text-[#171717]">
                <SelectValue placeholder="Selecione a categoria..." />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Movimentação */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Tipo de Movimentação
            </label>
            <Select
              value={draft.movementType}
              onValueChange={(val) =>
                onDraftChange((prev) => ({
                  ...prev,
                  movementType: val as StockFilters['movementType'],
                }))
              }
            >
              <SelectTrigger className="!h-11 w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 text-sm font-medium text-[#171717]">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Todas as movimentações</SelectItem>
                <SelectItem value="entry">Apenas Entradas</SelectItem>
                <SelectItem value="exit">Apenas Saídas / Avarias</SelectItem>
                <SelectItem value="sale">Apenas Vendas no PDV</SelectItem>
                <SelectItem value="adjustment">Apenas Ajustes de Balanço</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rodapé do Modal */}
          <div className="mt-2 flex items-center justify-end gap-3 border-t border-[#E5E5E5] pt-4">
            <button
              type="button"
              className="h-11 px-4 text-sm font-semibold text-[#737373] hover:text-[#171717] cursor-pointer"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onApply}
              className="pdv-primary-gradient-btn flex h-11 items-center justify-center px-6 text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

