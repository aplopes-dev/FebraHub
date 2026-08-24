import { clinicaFetch } from '@/features/clinic/shared/api';
import type { PatientToothAnnotation } from '../types/patient-tooth-annotation';
import type {
  PatientToothAnnotationApiItem,
  PatientToothAnnotationCreateBody,
} from '../types/patient-tooth-annotation-api';

type AnnotationEnvelope = { data: PatientToothAnnotationApiItem };
type AnnotationListEnvelope = { data: PatientToothAnnotationApiItem[] };

function toPatientToothAnnotation(
  item: PatientToothAnnotationApiItem,
): PatientToothAnnotation {
  return {
    id: item.id,
    toothNumber: item.toothNumber,
    content: item.content,
    professionalId: item.professionalId || undefined,
    professionalName: item.professionalName,
    createdAt: item.createdAt,
  };
}

export async function listPatientToothAnnotations(
  storeId: string,
  patientId: string,
): Promise<PatientToothAnnotation[]> {
  const res = await clinicaFetch<AnnotationListEnvelope>(
    storeId,
    `/v1/patients/${patientId}/tooth-annotations`,
  );

  return res.data.map(toPatientToothAnnotation);
}

export async function createPatientToothAnnotation(
  storeId: string,
  patientId: string,
  body: PatientToothAnnotationCreateBody,
): Promise<PatientToothAnnotation> {
  const res = await clinicaFetch<AnnotationEnvelope>(
    storeId,
    `/v1/patients/${patientId}/tooth-annotations`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );

  return toPatientToothAnnotation(res.data);
}

export async function deletePatientToothAnnotation(
  storeId: string,
  patientId: string,
  annotationId: string,
): Promise<void> {
  await clinicaFetch(
    storeId,
    `/v1/patients/${patientId}/tooth-annotations/${annotationId}`,
    { method: 'DELETE' },
  );
}
