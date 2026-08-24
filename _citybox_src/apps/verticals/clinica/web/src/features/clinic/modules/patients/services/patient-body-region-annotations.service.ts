import { clinicaFetch } from '@/features/clinic/shared/api';
import type { PatientBodyRegionAnnotation } from '../types/patient-body-region-annotation';
import type {
  PatientBodyRegionAnnotationApiItem,
  PatientBodyRegionAnnotationCreateBody,
} from '../types/patient-body-region-annotation-api';

type AnnotationEnvelope = { data: PatientBodyRegionAnnotationApiItem };
type AnnotationListEnvelope = { data: PatientBodyRegionAnnotationApiItem[] };

function toPatientBodyRegionAnnotation(
  item: PatientBodyRegionAnnotationApiItem,
): PatientBodyRegionAnnotation {
  return {
    id: item.id,
    bodyRegionId: item.bodyRegionId,
    content: item.content,
    professionalId: item.professionalId || undefined,
    professionalName: item.professionalName,
    createdAt: item.createdAt,
  };
}

export async function listPatientBodyRegionAnnotations(
  storeId: string,
  patientId: string,
): Promise<PatientBodyRegionAnnotation[]> {
  const res = await clinicaFetch<AnnotationListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/body-region-annotations`,
  );

  return res.data.map(toPatientBodyRegionAnnotation);
}

export async function createPatientBodyRegionAnnotation(
  storeId: string,
  patientId: string,
  body: PatientBodyRegionAnnotationCreateBody,
): Promise<PatientBodyRegionAnnotation> {
  const res = await clinicaFetch<AnnotationEnvelope>(
    storeId,
    `/v1/patients/${patientId}/body-region-annotations`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  return toPatientBodyRegionAnnotation(res.data);
}

export async function deletePatientBodyRegionAnnotation(
  storeId: string,
  patientId: string,
  annotationId: string,
): Promise<void> {
  await clinicaFetch(
    storeId,
    `/v1/patients/${patientId}/body-region-annotations/${annotationId}`,
    { method: 'DELETE' },
  );
}
