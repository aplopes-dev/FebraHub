'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@citybox/ui';
import { Badge } from '@citybox/ui/atoms';
import { useCan } from '@/features/clinic/permissions';
import { useStore } from '@/lib/store-context';
import { storeShowsImc } from '@/lib/clinic-strand';
import {
  PATIENT_DETAIL_TABS,
  isPatientDetailTabImplemented,
  patientDetailTabHref,
  type PatientDetailTabValue,
} from '../../lib/patient-detail-tabs';

type PatientDetailNavProps = {
  patientId: string;
};

function isComingSoonTab(tab: PatientDetailTabValue): boolean {
  return !isPatientDetailTabImplemented(tab);
}

function isTabActive(href: string, currentPath: string): boolean {
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function PatientDetailNav({ patientId }: PatientDetailNavProps) {
  const pathname = usePathname();
  const { clinicStrand } = useStore();
  const showImc = storeShowsImc(clinicStrand);
  const canReadBudgets = useCan('read', 'PatientBudget');
  const canViewTreatments = useCan('manage', 'PatientTreatment');
  const canManageAnamnesis = useCan('manage', 'PatientAnamnesis');
  const canManageDebits = useCan('manage', 'Patient');
  const canCreateFiles = useCan('create', 'PatientFile');
  const canUpdateFiles = useCan('update', 'PatientFile');
  const canDeleteFiles = useCan('delete', 'PatientFile');
  const canAccessFiles = canCreateFiles || canUpdateFiles || canDeleteFiles;

  const tabs = PATIENT_DETAIL_TABS.filter((tab) => {
    if (tab.value === 'calculo-imc') return showImc;
    if (tab.value === 'orcamentos') return canReadBudgets;
    if (tab.value === 'tratamentos') return canViewTreatments;
    if (tab.value === 'anamnese') return canManageAnamnesis;
    if (tab.value === 'financeiro') return canManageDebits;
    if (tab.value === 'arquivos') return canAccessFiles;
    return true;
  });

  return (
    <div className="min-w-0 max-lg:overflow-x-auto max-lg:overflow-y-hidden max-lg:overscroll-x-contain max-lg:[-webkit-overflow-scrolling:touch] lg:overflow-visible">
      <nav
        className="flex min-w-full flex-nowrap gap-1 max-lg:w-max"
        aria-label="Navegação da ficha do paciente"
      >
        {tabs.map((tab) => {
          const href = patientDetailTabHref(patientId, tab.value);
          const isActive = isTabActive(href, pathname);

          return (
            <Link
              key={tab.value}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 pb-3 pt-2 text-sm transition-colors',
                'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:transition-opacity',
                isActive ? 'after:bg-primary after:opacity-100' : 'after:opacity-0',
              )}
            >
              <span
                className={cn(
                  'inline-flex items-center gap-2 text-sm tracking-wide transition-colors',
                  isActive
                    ? 'font-medium text-primary'
                    : 'font-normal text-foreground/60 group-hover:text-foreground',
                )}
              >
                <span>{tab.label.toUpperCase()}</span>
                {isComingSoonTab(tab.value) ? (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px] font-medium uppercase"
                  >
                    Em breve
                  </Badge>
                ) : null}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
