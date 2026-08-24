'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@citybox/ui';
import { Button } from '@citybox/ui/atoms';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import { PatientDetailHeader } from '../components/detail/patient-detail-header';
import { PatientDetailSkeleton } from '../components/detail/patient-detail-skeleton';
import { PatientEditSheet } from '../components/patient-edit-sheet';
import { PatientPhotoDialog } from '../components/patient-photo-dialog';
import { PatientDetailProvider } from '../lib/patient-detail-context';
import { withPatientPhotoCacheKey } from '../lib/patient-api-mappers';
import { PATIENT_DETAIL_BASE_PATH } from '../lib/patient-detail-tabs';
import {
  PATIENT_DETAIL_CONTENT_SHELL_CLASS,
  PATIENT_DETAIL_HEADER_SHELL_CLASS,
  PATIENT_DETAIL_LAYOUT_ROOT_CLASS,
} from '../lib/patient-detail-tabs-ui';
import { usePatientDetailQuery } from '../hooks/use-patient-detail-query';
import { usePatientPhotoMutations } from '../hooks/use-patient-photo-mutations';
import {
  getPatientMutationErrorMessage,
  usePatientMutations,
} from '../hooks/use-patient-mutations';
import type { PatientFormValues } from '../types/patient-form';

const PATIENTS_LIST_HREF = PATIENT_DETAIL_BASE_PATH;

type PatientDetailLayoutProps = {
  children: React.ReactNode;
};

export function PatientDetailLayout({ children }: PatientDetailLayoutProps) {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const { storeId } = useStore();
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [photoRevision, setPhotoRevision] = useState(0);

  const detailQuery = usePatientDetailQuery(storeId, patientId);
  const { updateMutation } = usePatientMutations(storeId);
  const { uploadMutation, deleteMutation } = usePatientPhotoMutations(storeId);

  const patient = detailQuery.data?.patient ?? null;

  const handleSubmitPatientEdit = useCallback(
    async (_patientId: string, values: PatientFormValues) => {
      if (!storeId) {
        toast.error('Selecione uma loja para salvar o paciente.');
        throw new Error('MISSING_STORE');
      }

      try {
        await updateMutation.mutateAsync({ patientId: _patientId, values });
        toast.success('Paciente atualizado com sucesso.');
      } catch (error) {
        const { message } = getPatientMutationErrorMessage(error);
        toast.error(message);
        throw error;
      }
    },
    [storeId, updateMutation],
  );

  const handleEditSheetOpenChange = useCallback((open: boolean) => {
    setEditSheetOpen(open);
  }, []);

  const handleUploadPhoto = useCallback(
    async (file: File) => {
      if (!storeId || !patient) {
        toast.error('Selecione uma loja para enviar a foto.');
        throw new Error('MISSING_STORE');
      }

      try {
        await uploadMutation.mutateAsync({ patientId: patient.id, file });
        setPhotoRevision((current) => current + 1);
        toast.success('Foto atualizada com sucesso.');
      } catch (error) {
        const message =
          error instanceof ClinicaApiError
            ? error.message
            : 'Não foi possível enviar a foto. Tente novamente.';
        toast.error(message);
        throw error;
      }
    },
    [patient, storeId, uploadMutation],
  );

  const handleRemovePhoto = useCallback(async () => {
    if (!storeId || !patient) {
      toast.error('Selecione uma loja para remover a foto.');
      throw new Error('MISSING_STORE');
    }

    try {
      await deleteMutation.mutateAsync(patient.id);
      setPhotoRevision((current) => current + 1);
      toast.success('Foto removida.');
    } catch (error) {
      const message =
        error instanceof ClinicaApiError
          ? error.message
          : 'Não foi possível remover a foto. Tente novamente.';
      toast.error(message);
      throw error;
    }
  }, [deleteMutation, patient, storeId]);

  if (detailQuery.isLoading) {
    return <PatientDetailSkeleton />;
  }

  if (!patient) {
    return (
      <section className={cn(PATIENT_DETAIL_LAYOUT_ROOT_CLASS, PATIENT_DETAIL_CONTENT_SHELL_CLASS, 'space-y-4')}>
        <p className="text-sm text-muted-foreground">Paciente não encontrado.</p>
        <Button asChild variant="outline" size="sm">
          <Link href={PATIENTS_LIST_HREF}>Voltar para Pacientes</Link>
        </Button>
      </section>
    );
  }

  return (
    <PatientDetailProvider patient={patient}>
      <section className={PATIENT_DETAIL_LAYOUT_ROOT_CLASS}>
        <div className={PATIENT_DETAIL_HEADER_SHELL_CLASS}>
          <PatientDetailHeader
            patient={patient}
            photoRevision={photoRevision}
            onEdit={() => setEditSheetOpen(true)}
            onPhotoClick={() => setPhotoDialogOpen(true)}
          />
        </div>

        <div className={PATIENT_DETAIL_CONTENT_SHELL_CLASS}>{children}</div>

        <PatientEditSheet
          open={editSheetOpen}
          onOpenChange={handleEditSheetOpenChange}
          patient={patient}
          isSubmitting={updateMutation.isPending}
          onSubmit={handleSubmitPatientEdit}
        />

        <PatientPhotoDialog
          open={photoDialogOpen}
          onOpenChange={setPhotoDialogOpen}
          patient={patient}
          photoUrl={withPatientPhotoCacheKey(patient.photoUrl ?? null, photoRevision)}
          isUploading={uploadMutation.isPending}
          isRemoving={deleteMutation.isPending}
          onUpload={handleUploadPhoto}
          onRemove={handleRemovePhoto}
        />
      </section>
    </PatientDetailProvider>
  );
}
