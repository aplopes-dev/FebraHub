import type { PlanSpecialtyInput } from '../dtos/clinic-plan.dto';
import { ClinicPlanSpecialty } from '../../domain/entities/clinic-plan-specialty.entity';
import { ClinicPlanTreatment } from '../../domain/entities/clinic-plan-treatment.entity';
import { resolveEntityId } from './resolve-entity-id';

export type BuildPlanTreeOptions = {
  /** Em criação, ignora IDs persistidos vindos de outro plano (ex.: cópia no ERP). */
  idMode?: 'create' | 'update';
};

function resolveTreeEntityId(
  clientId: string | undefined,
  idMode: 'create' | 'update',
): string {
  if (idMode === 'create') {
    return crypto.randomUUID();
  }
  return resolveEntityId(clientId);
}

export function buildPlanTree(
  storeId: string,
  planId: string,
  specialtyInputs: PlanSpecialtyInput[],
  options: BuildPlanTreeOptions = {},
): {
  specialties: ClinicPlanSpecialty[];
  treatments: ClinicPlanTreatment[];
} {
  const idMode = options.idMode ?? 'update';
  const specialties: ClinicPlanSpecialty[] = [];
  const treatments: ClinicPlanTreatment[] = [];

  specialtyInputs.forEach((specialtyInput, specialtyIndex) => {
    const specialtyId = resolveTreeEntityId(specialtyInput.id, idMode);
    const specialty = ClinicPlanSpecialty.create(
      {
        storeId,
        planId,
        name: specialtyInput.name.trim(),
        locationUiType: specialtyInput.locationUiType ?? 'tooth',
        sortOrder: specialtyIndex,
      },
      specialtyId,
    );
    specialties.push(specialty);

    specialtyInput.treatments.forEach((treatmentInput, treatmentIndex) => {
      const treatmentId = resolveTreeEntityId(treatmentInput.id, idMode);
      treatments.push(
        ClinicPlanTreatment.create(
          {
            storeId,
            planId,
            specialtyId,
            name: treatmentInput.name.trim(),
            valueCents: treatmentInput.valueCents,
            costCents: treatmentInput.costCents,
            enabled: treatmentInput.enabled,
            acceptsFaces: treatmentInput.acceptsFaces,
            locationUiType: treatmentInput.locationUiType ?? null,
            sortOrder: treatmentIndex,
          },
          treatmentId,
        ),
      );
    });
  });

  return { specialties, treatments };
}

export function clonePlanTreeFromAggregate(
  storeId: string,
  targetPlanId: string,
  sourceSpecialties: ClinicPlanSpecialty[],
  sourceTreatmentsAll: ClinicPlanTreatment[],
): {
  specialties: ClinicPlanSpecialty[];
  treatments: ClinicPlanTreatment[];
} {
  const specialtyIdMap = new Map<string, string>();
  const specialties = sourceSpecialties.map((source, index) => {
    const specialtyId = crypto.randomUUID();
    specialtyIdMap.set(source.id, specialtyId);
    return ClinicPlanSpecialty.create(
      {
        storeId,
        planId: targetPlanId,
        name: source.name,
        locationUiType: source.locationUiType,
        sortOrder: index,
      },
      specialtyId,
    );
  });

  const treatments = sourceSpecialties.flatMap((sourceSpecialty) => {
    const newSpecialtyId = specialtyIdMap.get(sourceSpecialty.id)!;
    const sourceTreatments = sourceTreatmentsAll
      .filter((treatment) => treatment.specialtyId === sourceSpecialty.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return sourceTreatments.map((source, treatmentIndex) =>
      ClinicPlanTreatment.create({
        storeId,
        planId: targetPlanId,
        specialtyId: newSpecialtyId,
        name: source.name,
        valueCents: source.valueCents,
        costCents: source.costCents,
        enabled: source.enabled,
        acceptsFaces: source.acceptsFaces,
        locationUiType: source.locationUiType,
        sortOrder: treatmentIndex,
      }),
    );
  });

  return { specialties, treatments };
}
