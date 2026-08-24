'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Cake,
  Calendar,
  FileText,
  Hash,
  IdCard,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Ruler,
  Scale,
  Share2,
  Signpost,
  Stethoscope,
  UserCircle,
  UserRound,
  Users,
} from 'lucide-react';
import { cn } from '@citybox/ui';
import { formatPatientBmi } from '@/lib/patient-imc';
import { calculateAge } from '../../../lib/calculate-age';
import { formatPatientCpf, formatPatientPhone } from '../../../lib/format-patient-contact';
import {
  formatPatientAddressText,
  formatPatientBirthDate,
  formatPatientDisplayValue,
  formatPatientPlanLabel,
} from '../../../lib/format-patient-profile';
import { usePatientBodyMetricsQuery } from '../../../hooks/use-patient-body-metrics-queries';
import {
  formatPatientReferralOriginLabel,
  PATIENT_GENDER_LABEL,
} from '../../../lib/patient-ui';
import type { ClinicPatient } from '../../../types/clinic-patient';
import { PatientAppointmentsCard } from './patient-appointments-card';
import { PatientLastEvolutionCard } from './patient-last-evolution-card';
import { PatientPendingSignaturesCard } from './patient-pending-signatures-card';
import { PatientWhatsappMessagesCard } from './patient-whatsapp-messages-card';

const ABOUT_PANEL_CLASS = 'rounded-2xl border border-border/60 bg-card p-5';

type PatientAboutTabProps = {
  patient: ClinicPatient;
};

type AboutFieldItem = {
  label: string;
  value: string;
  icon: LucideIcon;
};

type AboutFieldProps = AboutFieldItem & {
  className?: string;
};

function isFilled(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function AboutField({ label, value, icon: Icon, className }: AboutFieldProps) {
  return (
    <div className={cn('flex min-w-0 gap-3', className)}>
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground"
        aria-hidden
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="whitespace-pre-line text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function AboutSectionDivider() {
  return <div className="w-full border-t border-border/60" role="separator" />;
}

function AboutFieldsSection({
  fields,
  fullWidthLabels = [],
}: {
  fields: AboutFieldItem[];
  fullWidthLabels?: string[];
}) {
  if (fields.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <AboutField
          key={field.label}
          {...field}
          className={fullWidthLabels.includes(field.label) ? 'sm:col-span-2' : undefined}
        />
      ))}
    </div>
  );
}

function buildPatientAboutSections(
  patient: ClinicPatient,
  latestMetric: {
    bmi: number;
    weightKg: number;
    heightCm: number;
  } | null,
): AboutFieldItem[][] {
  const identity: AboutFieldItem[] = [];
  if (isFilled(patient.birthDate)) {
    identity.push({
      label: 'Data de nascimento',
      value: formatPatientBirthDate(patient.birthDate),
      icon: Calendar,
    });
    identity.push({
      label: 'Idade',
      value: `${calculateAge(patient.birthDate)} anos`,
      icon: Cake,
    });
  }
  identity.push({
    label: 'Gênero',
    value: PATIENT_GENDER_LABEL[patient.gender],
    icon: UserRound,
  });
  if (latestMetric != null) {
    identity.push({
      label: 'Peso',
      value: `${latestMetric.weightKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`,
      icon: Scale,
    });
    identity.push({
      label: 'Altura',
      value: `${latestMetric.heightCm.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} cm`,
      icon: Ruler,
    });
    identity.push({
      label: 'IMC',
      value: `${formatPatientBmi(latestMetric.bmi)} Kg/m²`,
      icon: Scale,
    });
  }
  if (isFilled(patient.cpf)) {
    identity.push({
      label: 'CPF',
      value: formatPatientCpf(patient.cpf),
      icon: IdCard,
    });
  }
  if (isFilled(patient.rg)) {
    identity.push({
      label: 'RG',
      value: patient.rg.trim(),
      icon: FileText,
    });
  }

  const contact: AboutFieldItem[] = [];
  if (isFilled(patient.phone)) {
    contact.push({
      label: 'Celular',
      value: formatPatientPhone(patient.phone),
      icon: Phone,
    });
  }
  if (isFilled(patient.landlinePhone)) {
    contact.push({
      label: 'Telefone',
      value: formatPatientPhone(patient.landlinePhone),
      icon: PhoneCall,
    });
  }
  if (isFilled(patient.email)) {
    contact.push({
      label: 'E-mail',
      value: patient.email.trim(),
      icon: Mail,
    });
  }
  if (isFilled(patient.socialNetwork)) {
    contact.push({
      label: 'Rede social',
      value: patient.socialNetwork.trim(),
      icon: Share2,
    });
  }

  const profile: AboutFieldItem[] = [];
  if (isFilled(patient.profession)) {
    profile.push({
      label: 'Profissão',
      value: patient.profession.trim(),
      icon: Briefcase,
    });
  }
  if (isFilled(patient.medicalRecordNumber)) {
    profile.push({
      label: 'Prontuário',
      value: patient.medicalRecordNumber.trim(),
      icon: FileText,
    });
  }
  const originLabel = formatPatientReferralOriginLabel(patient);
  if (originLabel !== '—') {
    profile.push({
      label: 'Origem',
      value: originLabel,
      icon: Signpost,
    });
  }
  if (isFilled(patient.categoryName)) {
    profile.push({
      label: 'Categoria',
      value: formatPatientDisplayValue(patient.categoryName),
      icon: UserCircle,
    });
  }

  const plan: AboutFieldItem[] = [];
  const planLabel = formatPatientPlanLabel(patient.planName, patient.planStatus);
  if (planLabel !== '—') {
    plan.push({
      label: 'Convênio / plano',
      value: planLabel,
      icon: Stethoscope,
    });
  }
  if (isFilled(patient.planNumber)) {
    plan.push({
      label: 'Número do plano',
      value: patient.planNumber.trim(),
      icon: Hash,
    });
  }
  if (isFilled(patient.planHolderName)) {
    plan.push({
      label: 'Titular do plano',
      value: patient.planHolderName.trim(),
      icon: UserRound,
    });
  }
  if (isFilled(patient.planHolderCpf)) {
    plan.push({
      label: 'CPF do titular',
      value: formatPatientCpf(patient.planHolderCpf),
      icon: IdCard,
    });
  }

  const guardian: AboutFieldItem[] = [];
  if (isFilled(patient.guardianName)) {
    guardian.push({
      label: 'Responsável',
      value: patient.guardianName.trim(),
      icon: Users,
    });
  }
  if (isFilled(patient.guardianBirthDate)) {
    guardian.push({
      label: 'Nascimento do responsável',
      value: formatPatientBirthDate(patient.guardianBirthDate),
      icon: Calendar,
    });
  }
  if (isFilled(patient.guardianCpf)) {
    guardian.push({
      label: 'CPF do responsável',
      value: formatPatientCpf(patient.guardianCpf),
      icon: IdCard,
    });
  }
  if (isFilled(patient.guardianPhone)) {
    guardian.push({
      label: 'Celular do responsável',
      value: formatPatientPhone(patient.guardianPhone),
      icon: Phone,
    });
  }
  if (isFilled(patient.guardianNotes)) {
    guardian.push({
      label: 'Observação do responsável',
      value: patient.guardianNotes.trim(),
      icon: FileText,
    });
  }

  const addressText = formatPatientAddressText(patient.address);
  const address: AboutFieldItem[] =
    addressText !== '—'
      ? [
          {
            label: 'Endereço',
            value: addressText,
            icon: MapPin,
          },
        ]
      : [];

  return [identity, contact, profile, plan, guardian, address].filter(
    (section) => section.length > 0,
  );
}

export function PatientAboutTab({ patient }: PatientAboutTabProps) {
  const latestMetricQuery = usePatientBodyMetricsQuery(patient.id, {
    page: 1,
    perPage: 1,
  });
  const latestMetric = latestMetricQuery.data?.items[0] ?? null;
  const sections = buildPatientAboutSections(
    patient,
    latestMetric
      ? {
          bmi: latestMetric.bmi,
          weightKg: latestMetric.weightKg,
          heightCm: latestMetric.heightCm,
        }
      : null,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <section className={ABOUT_PANEL_CLASS}>
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground"
            aria-hidden
          >
            <UserCircle className="size-4" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Dados Pessoais</h3>
        </div>

        <div className="mt-8">
          {sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum dado pessoal preenchido.</p>
          ) : (
            sections.map((fields, index) => (
              <div key={fields.map((field) => field.label).join('|')}>
                {index > 0 ? (
                  <div className="py-6">
                    <AboutSectionDivider />
                  </div>
                ) : null}
                <AboutFieldsSection
                  fields={fields}
                  fullWidthLabels={['Endereço', 'Observação do responsável']}
                />
              </div>
            ))
          )}
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <PatientPendingSignaturesCard patient={patient} />
        <PatientLastEvolutionCard patientId={patient.id} />
        <PatientAppointmentsCard patientId={patient.id} />
        <PatientWhatsappMessagesCard patientId={patient.id} />
      </div>
    </div>
  );
}
