'use client';

import { useState } from 'react';
import { useMaskInput } from 'use-mask-input';
import {
  StoreIcon,
  TagIcon,
  SlidersIcon,
  CreditCardIcon,
  ReceiptIcon,
  PercentIcon,
  FileTextIcon,
  PrinterIcon,
  UploadIcon,
  PhoneIcon,
  MessageSquareIcon,
  CheckIcon,
  PlusIcon,
  Trash2Icon,
  ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@citybox/ui';
import { Input, Button, Switch } from '@citybox/ui/atoms';
import { useToast } from '@/components/toast';
import { useSettingsStore } from '../hooks/use-settings-store';
import type { SettingsTabId } from '../types/settings';

type NavTabItem = {
  id: SettingsTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PHONE_MASK = ['(99) 9999-9999', '(99) 99999-9999'] as const;

const SETTINGS_NAV_TABS: readonly NavTabItem[] = [
  { id: 'store', label: 'Configurações da Loja', icon: StoreIcon },
  { id: 'categories', label: 'Categorias', icon: TagIcon },
  { id: 'modifiers', label: 'Modificadores e Adicionais', icon: SlidersIcon },
  { id: 'payments', label: 'Métodos de Pagamento', icon: CreditCardIcon },
  { id: 'taxes', label: 'Impostos e Taxas', icon: PercentIcon },
  { id: 'discounts', label: 'Descontos e Cupons', icon: ReceiptIcon },
  { id: 'receipt', label: 'Opções de Recibo', icon: FileTextIcon },
  { id: 'printer', label: 'Impressoras', icon: PrinterIcon },
] as const;

export function SettingsLayout() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>('store');
  const { toast } = useToast();

  const storeSettings = useSettingsStore((state) => state.storeSettings);
  const updateStoreSettings = useSettingsStore((state) => state.updateStoreSettings);
  const paymentMethods = useSettingsStore((state) => state.paymentMethods);
  const togglePaymentMethod = useSettingsStore((state) => state.togglePaymentMethod);
  const printers = useSettingsStore((state) => state.printers);
  const receiptConfig = useSettingsStore((state) => state.receiptConfig);
  const updateReceiptConfig = useSettingsStore((state) => state.updateReceiptConfig);
  const taxConfig = useSettingsStore((state) => state.taxConfig);
  const updateTaxConfig = useSettingsStore((state) => state.updateTaxConfig);

  // Máscaras de entrada (use-mask-input)
  const phoneMaskRef = useMaskInput({ mask: [...PHONE_MASK] });
  const whatsappMaskRef = useMaskInput({ mask: [...PHONE_MASK] });
  const postCodeMaskRef = useMaskInput({ mask: '99999-999' });
  const cnpjMaskRef = useMaskInput({ mask: '99.999.999/9999-99' });

  // Form State para Configurações da Loja
  const [formData, setFormData] = useState({ ...storeSettings });
  const [logoPreview, setLogoPreview] = useState<string | null>(storeSettings.logoUrl);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'error',
          title: 'Arquivo muito grande',
          description: 'A imagem deve ter no máximo 2MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData((prev) => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(formData);
    toast({
      variant: 'success',
      title: 'Configurações salvas',
      description: 'As alterações da loja foram salvas com sucesso!',
    });
  };

  return (
    <div className="flex h-full min-h-0 w-full bg-[#F7F7F7] p-6 gap-6 select-none overflow-hidden">
      {/* MENU LATERAL DE NAVEGAÇÃO DE CONFIGURAÇÕES */}
      <div className="flex w-64 shrink-0 flex-col gap-1 rounded-2xl border border-[#E5E5E5] bg-white p-3 shadow-2xs h-fit">
        {SETTINGS_NAV_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all cursor-pointer text-left',
                isActive
                  ? 'bg-black/5 text-[#171717] font-bold'
                  : 'text-[#737373] hover:bg-black/[0.02] hover:text-[#171717]',
              )}
            >
              {/* Indicador de item ativo com a cor primária do PDV (#171717) */}
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#171717]" />
              )}
              <Icon
                className={cn(
                  'size-4 shrink-0 transition-colors',
                  isActive ? 'text-[#171717]' : 'text-[#737373]',
                )}
              />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTEÚDO PRINCIPAL DAS CONFIGURAÇÕES */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-xs">
        {/* ABA 1: CONFIGURAÇÕES DA LOJA (STORE SETTING) */}
        {activeTab === 'store' && (
          <form onSubmit={handleSaveStoreSettings} className="flex flex-col gap-6">
            {/* Cabeçalho com Título e Botão de Salvar */}
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <h1 className="text-xl font-bold tracking-tight text-[#171717]">
                Configurações da Loja
              </h1>
              <button
                type="submit"
                className="pdv-primary-gradient-btn flex h-10 items-center justify-center px-6 text-sm font-semibold text-white shadow-xs cursor-pointer transition-opacity hover:opacity-90"
              >
                Salvar Alterações
              </button>
            </div>

            {/* Upload de Logo */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Logo da Loja
              </label>
              <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#E5E5E5] bg-[#FAFAFA] p-8 text-center transition-colors hover:border-[#171717]/40">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleLogoUpload}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative size-20 overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-xs">
                      <Image
                        src={logoPreview}
                        alt="Logo da Loja"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#737373]">
                      Clique ou arraste para substituir a imagem
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-10 items-center justify-center rounded-full bg-black/5 text-[#737373]">
                      <UploadIcon className="size-5" />
                    </div>
                    <span className="text-sm font-bold text-[#171717]">
                      Clique para enviar ou arraste a imagem
                    </span>
                    <span className="text-xs font-medium text-[#A3A3A3]">
                      JPG, PNG (Máximo 2 MB)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Nome da Loja */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Nome da Loja *
              </label>
              <Input
                value={formData.storeName}
                onChange={(e) => setFormData((prev) => ({ ...prev, storeName: e.target.value }))}
                placeholder="Digite o nome da loja"
                className="h-11 rounded-xl border-[#E5E5E5] bg-white text-sm font-medium text-[#171717]"
                required
              />
            </div>

            {/* Informações de Contato (Telefone e WhatsApp) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Telefone de Contato
                </label>
                <div className="relative">
                  <PhoneIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#737373]" />
                  <Input
                    ref={phoneMaskRef}
                    type="tel"
                    inputMode="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="!pl-10 h-11 rounded-xl border-[#E5E5E5] bg-white text-sm font-medium text-[#171717]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  WhatsApp de Vendas
                </label>
                <div className="relative">
                  <MessageSquareIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#737373]" />
                  <Input
                    ref={whatsappMaskRef}
                    type="tel"
                    inputMode="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="!pl-10 h-11 rounded-xl border-[#E5E5E5] bg-white text-sm font-medium text-[#171717]"
                  />
                </div>
              </div>
            </div>

            {/* Cidade e Estado */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Cidade
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Digite a cidade"
                  className="h-11 rounded-xl border-[#E5E5E5] bg-white text-sm font-medium text-[#171717]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Estado / Região
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="Digite o estado"
                  className="h-11 rounded-xl border-[#E5E5E5] bg-white text-sm font-medium text-[#171717]"
                />
              </div>
            </div>

            {/* Bairro e CEP */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Bairro
                </label>
                <Input
                  value={formData.neighborhood}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, neighborhood: e.target.value }))
                  }
                  placeholder="Digite o bairro"
                  className="h-11 rounded-xl border-[#E5E5E5] bg-white text-sm font-medium text-[#171717]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  CEP
                </label>
                <Input
                  ref={postCodeMaskRef}
                  type="text"
                  inputMode="numeric"
                  value={formData.postCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, postCode: e.target.value }))}
                  placeholder="00000-000"
                  className="h-11 rounded-xl border-[#E5E5E5] bg-white text-sm font-medium text-[#171717]"
                />
              </div>
            </div>

            {/* Endereço Completo */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Endereço Completo
              </label>
              <textarea
                rows={3}
                value={formData.fullAddress}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullAddress: e.target.value }))}
                placeholder="Adicione o endereço completo com número e complemento"
                className="w-full rounded-xl border border-[#E5E5E5] bg-white p-3.5 text-sm font-medium text-[#171717] focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </form>
        )}

        {/* ABA 2: CATEGORIAS */}
        {activeTab === 'categories' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <h1 className="text-xl font-bold tracking-tight text-[#171717]">Categorias</h1>
              <button
                type="button"
                onClick={() =>
                  toast({
                    title: 'Adicionar Categoria',
                    description: 'Utilize o menu de Produtos para gerenciar a árvore de categorias.',
                  })
                }
                className="pdv-primary-gradient-btn flex h-10 items-center justify-center gap-2 px-4 text-sm font-semibold text-white shadow-xs cursor-pointer"
              >
                <PlusIcon className="size-4" />
                <span>Nova Categoria</span>
              </button>
            </div>
            <p className="text-sm text-[#737373]">
              Categorias cadastradas para exibição no PDV:
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {['Hambúrguer', 'Bebidas', 'Acompanhamentos', 'Sobremesas', 'Combos'].map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-4 font-semibold text-[#171717]"
                >
                  <span className="flex items-center gap-2">
                    <TagIcon className="size-4 text-[#737373]" />
                    {cat}
                  </span>
                  <span className="rounded-full bg-[#171717]/10 px-2.5 py-0.5 text-xs font-bold text-[#171717]">
                    Ativa
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 3: MODIFICADORES */}
        {activeTab === 'modifiers' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <h1 className="text-xl font-bold tracking-tight text-[#171717]">
                Modificadores e Adicionais
              </h1>
            </div>
            <p className="text-sm text-[#737373]">
              Grupos de opcionais e adicionais disponíveis para os itens do cardápio:
            </p>
            <div className="flex flex-col gap-4">
              {[
                { name: 'Ponto da Carne', options: 'Mal passado, Ao ponto, Bem passado' },
                { name: 'Adicionais de Queijo', options: 'Cheddar extra, Queijo Prato' },
                { name: 'Molhos Extras', options: 'Maionese da Casa, Barbecue, Barbecue Picante' },
              ].map((mod) => (
                <div
                  key={mod.name}
                  className="flex flex-col gap-1 rounded-xl border border-[#E5E5E5] bg-white p-4"
                >
                  <span className="font-bold text-[#171717]">{mod.name}</span>
                  <span className="text-xs text-[#737373]">{mod.options}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 4: MÉTODOS DE PAGAMENTO */}
        {activeTab === 'payments' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <h1 className="text-xl font-bold tracking-tight text-[#171717]">
                Métodos de Pagamento
              </h1>
            </div>
            <p className="text-sm text-[#737373]">
              Ative ou desative as formas de pagamento aceitas no checkout do caixa:
            </p>
            <div className="divide-y divide-[#E5E5E5] rounded-xl border border-[#E5E5E5] bg-white">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-black/[0.01]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-black/5 text-[#171717]">
                      <CreditCardIcon className="size-5" />
                    </div>
                    <div>
                      <span className="font-bold text-[#171717] block">{pm.name}</span>
                      <span className="text-xs text-[#737373]">Disponível na tela do caixa</span>
                    </div>
                  </div>
                  <Switch
                    checked={pm.enabled}
                    onCheckedChange={() => {
                      togglePaymentMethod(pm.id);
                      toast({
                        title: 'Forma de Pagamento',
                        description: `${pm.name} foi ${!pm.enabled ? 'ativado' : 'desativado'}.`,
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 5: IMPOSTOS E TAXAS */}
        {activeTab === 'taxes' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <h1 className="text-xl font-bold tracking-tight text-[#171717]">
                Impostos e Taxas
              </h1>
              <button
                type="button"
                onClick={() =>
                  toast({
                    variant: 'success',
                    title: 'Taxas atualizadas',
                    description: 'As configurações de taxas foram salvas.',
                  })
                }
                className="pdv-primary-gradient-btn flex h-10 items-center justify-center px-6 text-sm font-semibold text-white shadow-xs cursor-pointer"
              >
                Salvar Taxas
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl border border-[#E5E5E5] p-4">
                <div>
                  <span className="font-bold text-[#171717] block">Taxa de Serviço do Garçom (10%)</span>
                  <span className="text-xs text-[#737373]">Adiciona automaticamente 10% no fechamento da mesa</span>
                </div>
                <Switch
                  checked={taxConfig.enableServiceTax}
                  onCheckedChange={(val) => updateTaxConfig({ enableServiceTax: val })}
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 6: DESCONTOS E CUPONS */}
        {activeTab === 'discounts' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <h1 className="text-xl font-bold tracking-tight text-[#171717]">
                Descontos e Cupons
              </h1>
            </div>
            <p className="text-sm text-[#737373]">
              Limites de desconto manual permitido para o operador de caixa:
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-xl border border-[#E5E5E5] p-4">
                <span className="font-bold text-[#171717]">Desconto Máximo Sem Senha</span>
                <span className="font-extrabold text-[#171717]"> Até 15%</span>
              </div>
            </div>
          </div>
        )}

        {/* ABA 7: OPÇÕES DE RECIBO */}
        {activeTab === 'receipt' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <h1 className="text-xl font-bold tracking-tight text-[#171717]">
                Opções de Recibo Impresso
              </h1>
              <button
                type="button"
                onClick={() =>
                  toast({
                    variant: 'success',
                    title: 'Recibo Atualizado',
                    description: 'As preferências de impressão do cupom foram salvas.',
                  })
                }
                className="pdv-primary-gradient-btn flex h-10 items-center justify-center px-6 text-sm font-semibold text-white shadow-xs cursor-pointer"
              >
                Salvar Opções
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Texto do Cabeçalho
                </label>
                <Input
                  value={receiptConfig.headerText}
                  onChange={(e) => updateReceiptConfig({ headerText: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  CNPJ da Empresa no Recibo
                </label>
                <Input
                  ref={cnpjMaskRef}
                  type="text"
                  inputMode="numeric"
                  value={receiptConfig.cnpj}
                  onChange={(e) => updateReceiptConfig({ cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                  Texto do Rodapé / Mensagem
                </label>
                <Input
                  value={receiptConfig.footerText}
                  onChange={(e) => updateReceiptConfig({ footerText: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 8: IMPRESSORAS */}
        {activeTab === 'printer' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
              <h1 className="text-xl font-bold tracking-tight text-[#171717]">
                Impressoras Conectadas
              </h1>
            </div>
            <div className="divide-y divide-[#E5E5E5] rounded-xl border border-[#E5E5E5]">
              {printers.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <PrinterIcon className="size-6 text-[#171717]" />
                    <div>
                      <span className="font-bold text-[#171717] block">{pr.name}</span>
                      <span className="text-xs text-[#737373]">
                        Conexão: {pr.connection.toUpperCase()} {pr.ipAddress ? `(${pr.ipAddress})` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Conectada 🟢
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
