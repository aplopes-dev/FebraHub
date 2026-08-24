import { PatientReferralOrigin } from '../../patient-referral-origins/domain/entities/patient-referral-origin.entity';
import { ExternalReferralProfessional } from '../../patient-external-professionals/domain/entities/external-referral-professional.entity';
import { PatientReferralInvalidError } from '../../domain/errors/patient-referral-invalid.error';
import { ExternalReferralProfessionalNotFoundError } from '../../patient-external-professionals/domain/errors/external-referral-professional-not-found.error';
import {
  CATEGORY_A,
  STORE_A,
  createPatientsTestHarness,
} from '../../tests/patients-test.fixtures';

const ORIGIN_EXTERNAL = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const ORIGIN_GOOGLE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
const PROFESSIONAL_A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';

describe('patient referral: indicacao_profissional_externo', () => {
  function seedExternalCatalog(
    harness: ReturnType<typeof createPatientsTestHarness>,
  ) {
    harness.referralOriginRepo.seed([
      PatientReferralOrigin.create(
        {
          storeId: STORE_A,
          name: 'Indicado por outro profissional externo',
          systemKey: 'indicacao_profissional_externo',
          isSystem: true,
        },
        ORIGIN_EXTERNAL,
      ),
      PatientReferralOrigin.create(
        {
          storeId: STORE_A,
          name: 'Google',
          systemKey: 'google',
          isSystem: true,
        },
        ORIGIN_GOOGLE,
      ),
    ]);
    harness.externalProfessionalRepo.seed([
      ExternalReferralProfessional.create(
        {
          storeId: STORE_A,
          name: 'Dr. Externo',
          phone: '73999990000',
          cro: 'BA-1',
        },
        PROFESSIONAL_A,
      ),
    ]);
    harness.patientRepo.seedExternalProfessional(PROFESSIONAL_A, {
      name: 'Dr. Externo',
    });
    harness.patientRepo.seedReferralOrigin(ORIGIN_EXTERNAL, {
      name: 'Indicado por outro profissional externo',
      systemKey: 'indicacao_profissional_externo',
    });
    harness.patientRepo.seedReferralOrigin(ORIGIN_GOOGLE, {
      name: 'Google',
      systemKey: 'google',
    });
  }

  it('rejects create without external professional id', async () => {
    const harness = createPatientsTestHarness();
    seedExternalCatalog(harness);

    await expect(
      harness.createPatient.execute({
        storeId: STORE_A,
        input: {
          name: 'Paciente',
          gender: 'female',
          categoryId: CATEGORY_A,
          referralOriginId: ORIGIN_EXTERNAL,
        },
      }),
    ).rejects.toBeInstanceOf(PatientReferralInvalidError);
  });

  it('creates patient with external professional and clears patient/member referrers', async () => {
    const harness = createPatientsTestHarness();
    seedExternalCatalog(harness);

    const detail = await harness.createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'Paciente',
        gender: 'female',
        categoryId: CATEGORY_A,
        referralOriginId: ORIGIN_EXTERNAL,
        referredByPatientId: 'should-be-cleared',
        referredByMemberId: 'should-be-cleared',
        referredByMemberName: 'should-be-cleared',
        referredByExternalProfessionalId: PROFESSIONAL_A,
      },
    });

    expect(detail.patient.referralOriginId).toBe(ORIGIN_EXTERNAL);
    expect(detail.patient.referredByPatientId).toBeNull();
    expect(detail.patient.referredByMemberId).toBeNull();
    expect(detail.patient.referredByMemberName).toBeNull();
    expect(detail.patient.referredByExternalProfessionalId).toBe(
      PROFESSIONAL_A,
    );
    expect(detail.referredByExternalProfessionalName).toBe('Dr. Externo');
  });

  it('rejects unknown external professional id', async () => {
    const harness = createPatientsTestHarness();
    seedExternalCatalog(harness);

    await expect(
      harness.createPatient.execute({
        storeId: STORE_A,
        input: {
          name: 'Paciente',
          gender: 'female',
          categoryId: CATEGORY_A,
          referralOriginId: ORIGIN_EXTERNAL,
          referredByExternalProfessionalId:
            '99999999-9999-4999-8999-999999999999',
        },
      }),
    ).rejects.toBeInstanceOf(ExternalReferralProfessionalNotFoundError);
  });

  it('clears external professional when origin is not external', async () => {
    const harness = createPatientsTestHarness();
    seedExternalCatalog(harness);

    const detail = await harness.createPatient.execute({
      storeId: STORE_A,
      input: {
        name: 'Paciente',
        gender: 'female',
        categoryId: CATEGORY_A,
        referralOriginId: ORIGIN_GOOGLE,
        referredByExternalProfessionalId: PROFESSIONAL_A,
      },
    });

    expect(detail.patient.referralOriginId).toBe(ORIGIN_GOOGLE);
    expect(detail.patient.referredByExternalProfessionalId).toBeNull();
  });
});
