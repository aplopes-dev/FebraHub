import type { AppointmentApi } from '@/features/clinic/agenda/api/types';
import type { StockProduct } from '@/features/clinic/estoque/types';
import type { ClinicPatient } from '@/features/clinic/modules/patients/types/clinic-patient';
import type { Opportunity } from '@/features/clinic/vendas/services/sales.types';
import type { VerticalNavLeaf, VerticalNavModule } from '@/lib/vertical/types';
import type { GlobalSearchHit } from '../types';

export function hitFromNavLeaf(
  leaf: VerticalNavLeaf,
  moduleLabel?: string,
): GlobalSearchHit {
  return {
    id: `nav-${leaf.id}`,
    type: 'nav',
    title: leaf.label,
    subtitle: moduleLabel ?? leaf.description,
    href: leaf.path,
    keywords: [
      leaf.label,
      leaf.path,
      ...(leaf.description ? [leaf.description] : []),
      ...(leaf.aliases ?? []),
    ],
  };
}

export function flattenNavModules(
  modules: readonly VerticalNavModule[],
): GlobalSearchHit[] {
  return modules.flatMap((module) =>
    module.children
      .filter((leaf) => !leaf.disabled)
      .map((leaf) => hitFromNavLeaf(leaf, module.label)),
  );
}

export function hitFromPatient(patient: ClinicPatient): GlobalSearchHit {
  const subtitle = [patient.phone, patient.cpf].filter(Boolean).join(' · ') || undefined;
  return {
    id: `patient-${patient.id}`,
    type: 'patient',
    title: patient.name,
    subtitle,
    href: `/pacientes/${patient.id}/sobre`,
    keywords: [patient.phone, patient.cpf, patient.email, patient.medicalRecordNumber],
  };
}

export function hitFromOpportunity(opportunity: Opportunity): GlobalSearchHit {
  const subtitle = [opportunity.phone, opportunity.origin].filter(Boolean).join(' · ') || undefined;
  const params = new URLSearchParams({ opportunityId: opportunity.id });
  return {
    id: `opportunity-${opportunity.id}`,
    type: 'opportunity',
    title: opportunity.title,
    subtitle,
    href: `/vendas?${params.toString()}`,
    keywords: [opportunity.phone ?? '', opportunity.origin ?? '', opportunity.description ?? ''],
  };
}

function appointmentDateParam(isoDate: string): string {
  return isoDate.includes('T') ? isoDate.split('T')[0]! : isoDate.slice(0, 10);
}

export function hitFromAppointment(appointment: AppointmentApi): GlobalSearchHit {
  const dateParam = appointmentDateParam(appointment.date);
  const params = new URLSearchParams({
    date: dateParam,
    appointmentId: appointment.id,
  });
  const when = appointment.date
    ? `${dateParam}${appointment.durationMin ? ` · ${appointment.durationMin} min` : ''}`
    : undefined;
  return {
    id: `appointment-${appointment.id}`,
    type: 'appointment',
    title: appointment.patient.name,
    subtitle: [appointment.professional.name, when].filter(Boolean).join(' · ') || undefined,
    href: `/agenda?${params.toString()}`,
    keywords: [
      appointment.patient.name,
      appointment.professional.name,
      appointment.observations ?? '',
      appointment.category?.name ?? '',
    ],
  };
}

export function hitFromStockProduct(product: StockProduct): GlobalSearchHit {
  const subtitle = [product.category, product.sku].filter(Boolean).join(' · ') || undefined;
  return {
    id: `stock-${product.id}`,
    type: 'stock',
    title: product.name,
    subtitle,
    href: '/estoque',
    keywords: [product.category, product.sku ?? '', product.supplier?.name ?? ''],
  };
}
