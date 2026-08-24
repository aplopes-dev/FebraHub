'use client';

import { useState } from 'react';
import { SearchIcon, InfoIcon, Trash2Icon, PlusIcon } from 'lucide-react';
import { Input, Button } from '@citybox/ui/atoms';
import type { ProductIngredient, ProductIngredientsConfig } from '../types/product';

type ProductFormStepIngredientsProps = {
  values: ProductIngredientsConfig;
  onChange: (next: ProductIngredientsConfig) => void;
};

const SUGGESTED_INGREDIENTS = [
  'Bun',
  'Pão',
  'Cheese',
  'Queijo',
  'Tomatoes',
  'Tomate',
  'Lettuce',
  'Alface',
  'Onion',
  'Cebola',
  'Hambúrguer 150g',
  'Bacon',
  'Molho Especial',
  'Maionese',
  'Cheddar',
  'Picles',
];

type ToggleSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function ToggleSwitch({ checked, onCheckedChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[#171717]' : 'bg-[#E5E5E5]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-6 rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function ProductFormStepIngredients({
  values,
  onChange,
}: ProductFormStepIngredientsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredSuggestions = SUGGESTED_INGREDIENTS.filter(
    (item) =>
      item.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !values.ingredients.some((existing) => existing.name.toLowerCase() === item.toLowerCase()),
  );

  const handleAddIngredient = (name: string) => {
    if (!name.trim()) return;
    const trimmed = name.trim();
    if (values.ingredients.some((ing) => ing.name.toLowerCase() === trimmed.toLowerCase())) {
      setSearchTerm('');
      setIsDropdownOpen(false);
      return;
    }

    const newIngredient: ProductIngredient = {
      id: String(Date.now()),
      name: trimmed,
      quantity: 1,
    };

    onChange({
      ...values,
      ingredients: [...values.ingredients, newIngredient],
    });
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    const nextIngredients = values.ingredients.map((ing) =>
      ing.id === id ? { ...ing, quantity: Math.max(0, quantity) } : ing,
    );
    onChange({ ...values, ingredients: nextIngredients });
  };

  const handleRemoveIngredient = (id: string) => {
    const nextIngredients = values.ingredients.filter((ing) => ing.id !== id);
    onChange({ ...values, ingredients: nextIngredients });
  };

  const calculatedAvailability = values.unlimitedAvailability
    ? 'Ilimitado'
    : values.ingredients.length > 0
      ? 55
      : 0;

  return (
    <div className="flex flex-col gap-6 text-[#171717]">
      <h3 className="text-base font-bold text-[#171717]">Ingredientes</h3>

      {/* Linha Disponibilidade Ilimitada */}
      <div className="flex items-center justify-between rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-[#171717]">Disponibilidade Ilimitada</span>
          <span className="text-xs text-[#737373]">
            Ative esta opção para que o estoque do produto não seja afetado pelo uso de ingredientes
          </span>
        </div>
        <ToggleSwitch
          checked={values.unlimitedAvailability}
          onCheckedChange={(checked) =>
            onChange({ ...values, unlimitedAvailability: checked })
          }
        />
      </div>

      {/* Input de Busca de Ingredientes */}
      <div className="relative">
        <div className="relative flex items-center">
          <SearchIcon className="pointer-events-none absolute left-3.5 size-4 text-[#737373]" />
          <Input
            placeholder="Buscar ingrediente..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm.trim()) {
                e.preventDefault();
                handleAddIngredient(searchTerm);
              }
            }}
            className="!pl-10 text-sm font-medium"
          />
          {searchTerm.trim() && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleAddIngredient(searchTerm)}
              className="absolute right-1.5 h-8 px-2.5 text-xs font-semibold text-primary"
            >
              <PlusIcon className="size-3.5" /> Adicionar
            </Button>
          )}
        </div>

        {/* Dropdown de Sugestões de Busca */}
        {isDropdownOpen && searchTerm.trim() && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#E5E5E5] bg-white py-1 shadow-lg">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAddIngredient(suggestion)}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-[#171717] hover:bg-[#F5F5F5] transition-colors"
              >
                <span>{suggestion}</span>
                <span className="text-xs font-semibold text-primary">+ Selecionar</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Card / Lista de Ingredientes */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E5E5E5] bg-[#F5F5F5] p-5 shadow-2xs">
        {values.ingredients.length === 0 ? (
          /* Estado Vazio (Image 1) */
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <InfoIcon className="size-6 text-[#737373]" />
            <p className="max-w-[280px] text-xs font-medium text-[#737373]">
              Busque o ingrediente e selecione para ver a disponibilidade
            </p>
          </div>
        ) : (
          /* Estado Preenchido (Image 2) */
          <div className="flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-1">
            {values.ingredients.map((ing) => (
              <div key={ing.id} className="flex items-center gap-3">
                {/* Nome do ingrediente em card cinza */}
                <div className="flex h-11 flex-1 items-center rounded-xl border border-[#E5E5E5] bg-[#EFEFEF] px-4 text-sm font-medium text-[#171717]">
                  {ing.name}
                </div>

                {/* Input de Quantidade */}
                <div className="flex h-11 items-center gap-2 rounded-xl border border-[#E5E5E5] bg-white px-3 shadow-2xs">
                  <span className="text-xs font-semibold text-[#737373]">Qtd</span>
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    value={ing.quantity}
                    onChange={(e) =>
                      handleUpdateQuantity(ing.id, parseFloat(e.target.value) || 0)
                    }
                    className="!h-8 !min-h-8 w-20 border-none !bg-transparent p-0 text-center font-bold text-[#171717] focus-visible:ring-0"
                  />
                </div>

                {/* Botão Remover */}
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(ing.id)}
                  className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E5E5E5] bg-white text-[#737373] hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  title="Remover ingrediente"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé do Card: Disponibilidade calculada */}
        <div className="flex flex-col gap-1 border-t border-[#E5E5E5] pt-3">
          <span className="text-xs text-[#737373]">Disponibilidade com base nos ingredientes:</span>
          <span className="text-2xl font-bold text-[#171717]">{calculatedAvailability}</span>
        </div>
      </div>
    </div>
  );
}
