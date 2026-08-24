'use client';

import { PlusIcon, Trash2Icon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import { Button, Input } from '@citybox/ui/atoms';
import { CurrencyInput } from '@citybox/ui/molecules';
import type {
  ProductAttribute,
  ProductAttributeValue,
  ProductModifierGroup,
  ProductModifierOption,
} from '../types/product';

type ProductFormStepVariantsProps = {
  attributes: ProductAttribute[];
  modifiers: ProductModifierGroup[];
  onChange: (data: { attributes: ProductAttribute[]; modifiers: ProductModifierGroup[] }) => void;
};

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

export function ProductFormStepVariants({
  attributes,
  modifiers,
  onChange,
}: ProductFormStepVariantsProps) {
  // --- Attribute Mutators ---
  const handleAddAttribute = () => {
    const newAttr: ProductAttribute = {
      id: String(Date.now()),
      name: '',
      enabled: true,
      isExpanded: true,
      values: [
        { id: String(Date.now() + 1), name: '', priceCents: 0, enabled: true },
        { id: String(Date.now() + 2), name: '', priceCents: 0, enabled: true },
      ],
    };
    onChange({ attributes: [...attributes, newAttr], modifiers });
  };

  const handleUpdateAttribute = (attrIndex: number, fields: Partial<ProductAttribute>) => {
    const nextAttributes = attributes.map((attr, idx) =>
      idx === attrIndex ? { ...attr, ...fields } : attr,
    );
    onChange({ attributes: nextAttributes, modifiers });
  };

  const handleRemoveAttribute = (attrIndex: number) => {
    const nextAttributes = attributes.filter((_, idx) => idx !== attrIndex);
    onChange({ attributes: nextAttributes, modifiers });
  };

  const handleAddOption = (attrIndex: number) => {
    const nextAttributes = attributes.map((attr, idx) => {
      if (idx !== attrIndex) return attr;
      const newOption: ProductAttributeValue = {
        id: String(Date.now()),
        name: '',
        priceCents: 0,
        enabled: true,
      };
      return {
        ...attr,
        values: [...attr.values, newOption],
      };
    });
    onChange({ attributes: nextAttributes, modifiers });
  };

  const handleUpdateOption = (
    attrIndex: number,
    optIndex: number,
    fields: Partial<ProductAttributeValue>,
  ) => {
    const nextAttributes = attributes.map((attr, aIdx) => {
      if (aIdx !== attrIndex) return attr;
      const nextValues = attr.values.map((val, oIdx) =>
        oIdx === optIndex ? { ...val, ...fields } : val,
      );
      return { ...attr, values: nextValues };
    });
    onChange({ attributes: nextAttributes, modifiers });
  };

  const handleRemoveOption = (attrIndex: number, optIndex: number) => {
    const nextAttributes = attributes.map((attr, aIdx) => {
      if (aIdx !== attrIndex) return attr;
      return {
        ...attr,
        values: attr.values.filter((_, oIdx) => oIdx !== optIndex),
      };
    });
    onChange({ attributes: nextAttributes, modifiers });
  };

  // --- Modifier Mutators ---
  const handleAddModifier = () => {
    const newMod: ProductModifierGroup = {
      id: String(Date.now()),
      name: '',
      enabled: true,
      isExpanded: true,
      values: [{ id: String(Date.now() + 1), name: '', priceCents: 0, enabled: true }],
    };
    onChange({ attributes, modifiers: [...modifiers, newMod] });
  };

  const handleUpdateModifier = (modIndex: number, fields: Partial<ProductModifierGroup>) => {
    const nextModifiers = modifiers.map((mod, idx) =>
      idx === modIndex ? { ...mod, ...fields } : mod,
    );
    onChange({ attributes, modifiers: nextModifiers });
  };

  const handleRemoveModifier = (modIndex: number) => {
    const nextModifiers = modifiers.filter((_, idx) => idx !== modIndex);
    onChange({ attributes, modifiers: nextModifiers });
  };

  const handleAddModOption = (modIndex: number) => {
    const nextModifiers = modifiers.map((mod, idx) => {
      if (idx !== modIndex) return mod;
      const newOption: ProductModifierOption = {
        id: String(Date.now()),
        name: '',
        priceCents: 0,
        enabled: true,
      };
      return {
        ...mod,
        values: [...mod.values, newOption],
      };
    });
    onChange({ attributes, modifiers: nextModifiers });
  };

  const handleUpdateModOption = (
    modIndex: number,
    optIndex: number,
    fields: Partial<ProductModifierOption>,
  ) => {
    const nextModifiers = modifiers.map((mod, mIdx) => {
      if (mIdx !== modIndex) return mod;
      const nextValues = mod.values.map((val, oIdx) =>
        oIdx === optIndex ? { ...val, ...fields } : val,
      );
      return { ...mod, values: nextValues };
    });
    onChange({ attributes, modifiers: nextModifiers });
  };

  const handleRemoveModOption = (modIndex: number, optIndex: number) => {
    const nextModifiers = modifiers.map((mod, mIdx) => {
      if (mIdx !== modIndex) return mod;
      return {
        ...mod,
        values: mod.values.filter((_, oIdx) => oIdx !== optIndex),
      };
    });
    onChange({ attributes, modifiers: nextModifiers });
  };

  return (
    <div className="flex flex-col gap-6 text-[#171717]">
      {/* SEÇÃO 1: VARIANTE */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-[#171717]">Variantes</h3>

        {/* Lista de Atributos (Linhas/Cards editáveis inline) */}
        {attributes.map((attr, attrIdx) => {
          const isExpanded = attr.isExpanded !== false;
          return (
            <div
              key={attr.id || attrIdx}
              className="flex flex-col gap-3 rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-2xs"
            >
              {/* Linha Principal do Atributo */}
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={attr.enabled !== false}
                  onCheckedChange={(checked) =>
                    handleUpdateAttribute(attrIdx, { enabled: checked })
                  }
                />
                <Input
                  placeholder="Nome do Atributo (ex: Tamanho)"
                  value={attr.name}
                  onChange={(e) => handleUpdateAttribute(attrIdx, { name: e.target.value })}
                  className="flex-1 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAttribute(attrIdx)}
                  className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E5E5E5] bg-white text-[#737373] hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  title="Excluir atributo"
                >
                  <Trash2Icon className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAttribute(attrIdx, { isExpanded: !isExpanded })}
                  className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E5E5E5] bg-white text-[#737373] hover:bg-[#F5F5F5] transition-colors"
                  title={isExpanded ? 'Recolher' : 'Expandir'}
                >
                  {isExpanded ? (
                    <ChevronUpIcon className="size-4" />
                  ) : (
                    <ChevronDownIcon className="size-4" />
                  )}
                </button>
              </div>

              {/* Sub-itens de Variantes (se expandido) */}
              {isExpanded && (
                <div className="flex flex-col gap-3 pt-1 pl-4 sm:pl-8">
                  {attr.values.map((val, valIdx) => (
                    <div key={val.id || valIdx} className="flex items-center gap-3">
                      <ToggleSwitch
                        checked={val.enabled !== false}
                        onCheckedChange={(checked) =>
                          handleUpdateOption(attrIdx, valIdx, { enabled: checked })
                        }
                      />
                      <Input
                        placeholder="Nome da opção (ex: Padrão)"
                        value={val.name}
                        onChange={(e) =>
                          handleUpdateOption(attrIdx, valIdx, { name: e.target.value })
                        }
                        className="flex-1 text-sm font-normal"
                      />
                      <div className="relative w-36 shrink-0">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#737373]">
                          R$
                        </span>
                        <CurrencyInput
                          value={val.priceCents / 100}
                          onValueChange={(price) =>
                            handleUpdateOption(attrIdx, valIdx, {
                              priceCents: Math.round(price * 100),
                            })
                          }
                          className="!pl-10 text-sm"
                        />
                      </div>
                      {attr.values.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(attrIdx, valIdx)}
                          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E5E5E5] bg-white text-[#737373] hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Excluir opção"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Botão + Add Variant (ghost variant) */}
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleAddOption(attrIdx)}
                      className="flex h-10 cursor-pointer items-center justify-center gap-1.5 px-3.5 text-xs font-semibold text-[#171717] hover:bg-[#EFEFEF]"
                    >
                      <PlusIcon className="size-3.5" />
                      <span>Adicionar Variante</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Botão + Add Attribute (ghost variant) */}
        <Button
          type="button"
          variant="ghost"
          onClick={handleAddAttribute}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 border border-dashed border-[#E5E5E5] bg-white text-sm font-semibold text-[#171717] shadow-2xs transition-all hover:border-[#C4C4C4] hover:bg-[#FAFAFA] active:scale-[0.99]"
        >
          <PlusIcon className="size-4 text-[#171717]" strokeWidth={2.5} />
          <span>Adicionar Atributo</span>
        </Button>
      </div>

      {/* SEÇÃO 2: MODIFICADORES */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-bold text-[#171717]">Modificadores</h3>

        {/* Lista de Modificadores (Linhas/Cards editáveis inline) */}
        {modifiers.map((mod, modIdx) => {
          const isExpanded = mod.isExpanded !== false;
          return (
            <div
              key={mod.id || modIdx}
              className="flex flex-col gap-3 rounded-2xl border border-[#E5E5E5] bg-white p-4 shadow-2xs"
            >
              {/* Linha Principal do Modificador */}
              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={mod.enabled !== false}
                  onCheckedChange={(checked) => handleUpdateModifier(modIdx, { enabled: checked })}
                />
                <Input
                  placeholder="Nome do Modificador (ex: Queijo)"
                  value={mod.name}
                  onChange={(e) => handleUpdateModifier(modIdx, { name: e.target.value })}
                  className="flex-1 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateModifier(modIdx, { isExpanded: !isExpanded })}
                  className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E5E5E5] bg-white text-[#737373] hover:bg-[#F5F5F5] transition-colors"
                  title={isExpanded ? 'Recolher' : 'Expandir'}
                >
                  {isExpanded ? (
                    <ChevronUpIcon className="size-4" />
                  ) : (
                    <ChevronDownIcon className="size-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveModifier(modIdx)}
                  className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E5E5E5] bg-white text-[#737373] hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  title="Excluir modificador"
                >
                  <Trash2Icon className="size-4" />
                </button>
              </div>

              {/* Sub-itens de Modificadores (se expandido) */}
              {isExpanded && (
                <div className="flex flex-col gap-3 pt-1 pl-4 sm:pl-8">
                  {mod.values.map((val, valIdx) => (
                    <div key={val.id || valIdx} className="flex items-center gap-3">
                      <ToggleSwitch
                        checked={val.enabled !== false}
                        onCheckedChange={(checked) =>
                          handleUpdateModOption(modIdx, valIdx, { enabled: checked })
                        }
                      />
                      <Input
                        placeholder="Nome da opção (ex: Extra Queijo)"
                        value={val.name}
                        onChange={(e) =>
                          handleUpdateModOption(modIdx, valIdx, { name: e.target.value })
                        }
                        className="flex-1 text-sm font-normal"
                      />
                      <div className="relative w-36 shrink-0">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#737373]">
                          R$
                        </span>
                        <CurrencyInput
                          value={val.priceCents / 100}
                          onValueChange={(price) =>
                            handleUpdateModOption(modIdx, valIdx, {
                              priceCents: Math.round(price * 100),
                            })
                          }
                          className="!pl-10 text-sm"
                        />
                      </div>
                      {mod.values.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveModOption(modIdx, valIdx)}
                          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E5E5E5] bg-white text-[#737373] hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Excluir opção"
                        >
                          <Trash2Icon className="size-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Botão + Add Option (ghost variant) */}
                  <div className="pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleAddModOption(modIdx)}
                      className="flex h-10 cursor-pointer items-center justify-center gap-1.5 px-3.5 text-xs font-semibold text-[#171717] hover:bg-[#EFEFEF]"
                    >
                      <PlusIcon className="size-3.5" />
                      <span>Adicionar Opção</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Botão + Add Modifier (ghost variant) */}
        <Button
          type="button"
          variant="ghost"
          onClick={handleAddModifier}
          className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 border border-dashed border-[#E5E5E5] bg-white text-sm font-semibold text-[#171717] shadow-2xs transition-all hover:border-[#C4C4C4] hover:bg-[#FAFAFA] active:scale-[0.99]"
        >
          <PlusIcon className="size-4 text-[#171717]" strokeWidth={2.5} />
          <span>Adicionar Modificador</span>
        </Button>
      </div>
    </div>
  );
}
