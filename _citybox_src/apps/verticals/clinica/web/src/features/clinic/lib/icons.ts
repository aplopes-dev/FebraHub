import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  FileSignature,
  Home,
  Layers,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  Stethoscope,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/** Ícone por leaf da navegação da clínica (sidebar de uma coluna). */
const CLINIC_LEAF_ICONS: Record<string, LucideIcon> = {
  'visao-geral': LayoutDashboard,
  pacientes: Users,
  agenda: CalendarDays,
  vendas: CircleDollarSign,
  marketing: Megaphone,
  loja: ShoppingCart,
  estoque: Package,
  financeiro: Wallet,
  configuracoes: Settings,
};

/** Ícones das seções do formulário Dados da Clínica (configurações). */
const CLINIC_SETTINGS_SECTION_ICONS: Record<string, LucideIcon> = {
  'dados-clinica': Stethoscope,
  horario: CalendarDays,
  informacao: Settings,
  localizacao: Home,
};

/** Ícones das abas de Configurações (mesmos do PageNav). */
const CLINIC_SETTINGS_TAB_ICONS: Record<string, LucideIcon> = {
  clinica: Stethoscope,
  equipe: Users,
  planos: Layers,
  anamneses: ClipboardList,
  contrato: FileSignature,
};

export function resolveClinicLeafIcon(leafId: string): LucideIcon {
  return CLINIC_LEAF_ICONS[leafId] ?? Home;
}

export function resolveClinicSettingsSectionIcon(sectionId: string): LucideIcon {
  return CLINIC_SETTINGS_SECTION_ICONS[sectionId] ?? Settings;
}

export function resolveClinicSettingsTabIcon(tabId: string): LucideIcon {
  return CLINIC_SETTINGS_TAB_ICONS[tabId] ?? Settings;
}
