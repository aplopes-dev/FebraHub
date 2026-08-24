"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  FileSignature,
  Layers,
  MessageCircle,
  Stethoscope,
  Tag,
  Users,
} from "lucide-react";
import { PageNav } from "@citybox/ui/molecules";
import type { PageNavItem, PageNavLinkProps } from "@citybox/ui/molecules";
import { useVerticalPermissions } from "@/lib/vertical-permissions-context";
import { canAccessSettingsTab } from "@/features/clinic/lib/clinic-settings-access";

const SETTINGS_BASE = "/configuracoes";

const SETTINGS_NAV_ITEMS: PageNavItem[] = [
  { label: "Clínica", href: SETTINGS_BASE, icon: Stethoscope, end: true },
  { label: "Equipe", href: `${SETTINGS_BASE}/equipe`, icon: Users },
  { label: "Planos", href: `${SETTINGS_BASE}/planos`, icon: Layers },
  {
    label: "Anamneses",
    href: `${SETTINGS_BASE}/anamneses`,
    icon: ClipboardList,
  },
  { label: "Contrato", href: `${SETTINGS_BASE}/contrato`, icon: FileSignature },
  {
    label: "WhatsApp",
    href: `${SETTINGS_BASE}/whatsapp`,
    icon: MessageCircle,
  },
  {
    label: "Categoria de Paciente",
    href: `${SETTINGS_BASE}/categoria-paciente`,
    icon: Tag,
  },
  {
    label: "Categoria de Agendamento",
    href: `${SETTINGS_BASE}/categoria-agendamento`,
    icon: CalendarDays,
  },
];

function NextPageNavLink({ href, children, ...props }: PageNavLinkProps) {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

/** Navegação horizontal das Configurações da clínica. */
export function ClinicSettingsNav() {
  const pathname = usePathname();
  const { permissions } = useVerticalPermissions();

  const items = SETTINGS_NAV_ITEMS.filter((item) =>
    canAccessSettingsTab(permissions, item.href),
  );

  if (items.length === 0) return null;

  return (
    <PageNav
      items={items}
      currentPath={pathname}
      linkComponent={NextPageNavLink}
      scrollMode="buttons"
      className="-mx-4 -mt-4 bg-background px-4"
      aria-label="Navegação de Configurações da Clínica"
    />
  );
}
