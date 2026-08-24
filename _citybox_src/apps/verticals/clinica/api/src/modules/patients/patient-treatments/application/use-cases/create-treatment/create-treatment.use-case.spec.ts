import { CreatePatientTreatmentUseCase } from './create-treatment.use-case';
import { InMemoryPatientTreatmentRepository } from '../../../tests/in-memory-patient-treatment.repository';
import { InMemoryClinicPlanRepository } from '../../../../../clinic-plans/tests/in-memory-clinic-plan.repository';
import { InMemoryPatientRepository } from '../../../../tests/in-memory-patient.repository';
import { seedMinimalPatient } from '../../../../tests/patients-test.fixtures';
import { ClinicPlan } from '../../../../../clinic-plans/domain/entities/clinic-plan.entity';
import { ClinicPlanTreatment } from '../../../../../clinic-plans/domain/entities/clinic-plan-treatment.entity';
import { ClinicPlanSpecialty } from '../../../../../clinic-plans/domain/entities/clinic-plan-specialty.entity';
import { PatientPlanNotFoundError } from '../../../../domain/errors/patient-plan-not-found.error';
import { ClinicPlanTreatmentNotFoundError } from '../../../domain/errors/clinic-plan-treatment-not-found.error';

describe('CreatePatientTreatmentUseCase', () => {
  const storeId = 'store-1';
  const patientId = '11111111-1111-4111-8111-111111111111';
  const planId = '22222222-2222-4222-8222-222222222222';
  const specialtyId = '33333333-3333-4333-8333-333333333333';
  const treatmentId = '44444444-4444-4444-8444-444444444444';

  let patientRepo: InMemoryPatientRepository;
  let planRepo: InMemoryClinicPlanRepository;
  let treatmentRepo: InMemoryPatientTreatmentRepository;
  let useCase: CreatePatientTreatmentUseCase;

  beforeEach(async () => {
    patientRepo = new InMemoryPatientRepository();
    planRepo = new InMemoryClinicPlanRepository();
    treatmentRepo = new InMemoryPatientTreatmentRepository();
    useCase = new CreatePatientTreatmentUseCase(
      patientRepo,
      planRepo,
      treatmentRepo,
    );

    seedMinimalPatient(patientRepo, storeId, patientId);

    const plan = ClinicPlan.create(
      { storeId, name: 'Plano A', sortOrder: 1 },
      planId,
    );
    const specialty = ClinicPlanSpecialty.create(
      { storeId, planId, name: 'Odonto', sortOrder: 0 },
      specialtyId,
    );
    const planTreatment = ClinicPlanTreatment.create(
      {
        storeId,
        planId,
        specialtyId,
        name: 'Limpeza',
        valueCents: 15000,
        costCents: 5000,
        enabled: true,
        sortOrder: 0,
      },
      treatmentId,
    );
    await planRepo.saveAggregate({
      plan,
      specialties: [specialty],
      treatments: [planTreatment],
    });
  });

  it('creates a standalone treatment from plan references', async () => {
    const treatment = await useCase.execute({
      storeId,
      patientId,
      planId,
      treatmentId,
      professionalId: 'prof-1',
      professionalName: 'Dr. João',
      valueCents: 15000,
      locationType: 'tooth',
      locationLabel: '18',
    });

    expect(treatment.source).toBe('standalone');
    expect(treatment.status).toBe('active');
    expect(treatment.planName).toBe('Plano A');
    expect(treatment.treatmentName).toBe('Limpeza');
    expect(treatment.sortOrder).toBe(0);
  });

  it('rejects unknown plan', async () => {
    await expect(
      useCase.execute({
        storeId,
        patientId,
        planId: '99999999-9999-4999-8999-999999999999',
        treatmentId,
        professionalId: 'prof-1',
        valueCents: 15000,
        locationType: 'tooth',
        locationLabel: '18',
      }),
    ).rejects.toBeInstanceOf(PatientPlanNotFoundError);
  });

  it('rejects unknown treatment in plan', async () => {
    await expect(
      useCase.execute({
        storeId,
        patientId,
        planId,
        treatmentId: '99999999-9999-4999-8999-999999999999',
        professionalId: 'prof-1',
        valueCents: 15000,
        locationType: 'tooth',
        locationLabel: '18',
      }),
    ).rejects.toBeInstanceOf(ClinicPlanTreatmentNotFoundError);
  });
});
