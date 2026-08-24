'use client';

import Link from 'next/link';
import { ArrowLeft, Camera, Pencil } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Avatar, AvatarFallback, AvatarImage, Button } from '@citybox/ui/atoms';
import { Can, useCan } from '@/features/clinic/permissions';
import { withPatientPhotoCacheKey } from '../../lib/patient-api-mappers';
import { formatPatientHeaderContactLine } from '../../lib/format-patient-contact';
import { getPatientInitials } from '../../lib/patient-utils';
import type { ClinicPatient } from '../../types/clinic-patient';
import { PatientAnamnesisAlertsBadge } from './patient-anamnesis-alerts-badge';
import { PatientDetailNav } from './patient-detail-nav';
import { PatientReturnAlertsPopover } from './patient-return-alerts-popover';

const PATIENTS_LIST_HREF = '/pacientes';

type PatientDetailHeaderProps = {
  patient: ClinicPatient;
  photoRevision?: number;
  onEdit: () => void;
  onPhotoClick: () => void;
};

export function PatientDetailHeader({
  patient,
  photoRevision = 0,
  onEdit,
  onPhotoClick,
}: PatientDetailHeaderProps) {
  const canUpdatePersonal = useCan('update', 'Patient');
  const photoUrl = withPatientPhotoCacheKey(
    patient.photoUrl ?? null,
    photoRevision,
  );

  const avatar = (
    <Avatar className="size-24 border border-border/40">
      {photoUrl ? <AvatarImage src={photoUrl} alt={patient.name} /> : null}
      <AvatarFallback className="text-2xl font-medium">
        {getPatientInitials(patient.name)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-stretch gap-3">
        <div className="flex shrink-0 items-start gap-2 self-start pt-1">
          <Link
            href={PATIENTS_LIST_HREF}
            aria-label="Voltar para Pacientes"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted/60"
          >
            <ArrowLeft className="size-5 text-foreground" aria-hidden />
          </Link>

          {canUpdatePersonal ? (
            <button
              type="button"
              onClick={onPhotoClick}
              className={cn(
                'group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
              aria-label={`Alterar foto de ${patient.name}`}
            >
              {avatar}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-6 text-white" aria-hidden />
              </span>
            </button>
          ) : (
            <div className="shrink-0 rounded-full">{avatar}</div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
                  {patient.name}
                </h1>
                <div className="flex shrink-0 items-center gap-2">
                  <Can action="update" subject="Patient">
                    <Button type="button" variant="outline" onClick={onEdit}>
                      <Pencil className="mr-1.5 size-4" aria-hidden />
                      Editar
                    </Button>
                  </Can>
                  <PatientReturnAlertsPopover
                    patientId={patient.id}
                    patientName={patient.name}
                    patientPhone={patient.phone}
                    patientPhotoUrl={photoUrl}
                    patientCategoryName={patient.categoryName}
                  />
                </div>
              </div>

              <PatientAnamnesisAlertsBadge patientId={patient.id} />
            </div>

            <p className="text-sm text-muted-foreground">
              {formatPatientHeaderContactLine(patient.phone, patient.cpf)}
            </p>
          </div>
        </div>
      </div>

      {/* Scroll horizontal só em tablet/mobile; no desktop as abas cabem sem overflow. */}
      <div className="mt-4 min-w-0 border-b border-border/60">
        <PatientDetailNav patientId={patient.id} />
      </div>
    </div>
  );
}
