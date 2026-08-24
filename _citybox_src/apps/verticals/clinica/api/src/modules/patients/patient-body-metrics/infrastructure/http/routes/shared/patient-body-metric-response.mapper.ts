import type { PatientBodyMetric } from '../../../../domain/entities/patient-body-metric.entity';

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toPatientBodyMetricResponse(metric: PatientBodyMetric) {
  return {
    id: metric.id,
    patientId: metric.patientId,
    measuredAt: formatDateOnly(metric.measuredAt),
    weightKg: metric.weightKg,
    heightCm: metric.heightCm,
    bmi: metric.bmi,
    professionalId: metric.professionalId,
    professionalName: metric.professionalName,
    notes: metric.notes,
    createdAt: metric.createdAt.toISOString(),
    updatedAt: metric.updatedAt.toISOString(),
  };
}
