import { BadRequestException } from '@nestjs/common';
import { Patient } from '../../../../patients/domain/entities/patient.entity';
import { InMemoryPatientRepository } from '../../../../patients/tests/in-memory-patient.repository';
import { ListDashboardBirthdaysUseCase } from './list-dashboard-birthdays.use-case';

describe('ListDashboardBirthdaysUseCase', () => {
  const today = new Date('2026-07-17T12:00:00.000Z');
  const storeId = 'store-1';
  const categoryId = '11111111-1111-4111-8111-111111111111';

  function createUseCase(patientRepo = new InMemoryPatientRepository()) {
    return {
      patientRepo,
      useCase: new ListDashboardBirthdaysUseCase(patientRepo),
    };
  }

  function seedPatient(
    patientRepo: InMemoryPatientRepository,
    overrides: {
      id: string;
      storeId?: string;
      status?: 'active' | 'inactive';
      birthDate?: Date | null;
      name?: string;
      phone?: string;
      photoObjectKey?: string | null;
    },
  ) {
    const patient = Patient.create(
      {
        storeId: overrides.storeId ?? storeId,
        status: overrides.status ?? 'active',
        name: overrides.name ?? 'Paciente',
        cpf: null,
        rg: '',
        birthDate: overrides.birthDate ?? null,
        gender: 'female',
        photoObjectKey: overrides.photoObjectKey ?? null,
        photoMimeType: overrides.photoObjectKey ? 'image/jpeg' : null,
        phone: overrides.phone ?? '',
        landlinePhone: '',
        email: '',
        socialNetwork: '',
        medicalRecordNumber: '',
        referralOriginId: null,
        profession: '',
        categoryId,
        guardianName: '',
        guardianBirthDate: null,
        guardianCpf: null,
        guardianPhone: '',
        guardianNotes: '',
        zipCode: '',
        street: '',
        streetNumber: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        planId: null,
        planNumber: '',
        planHolderName: '',
        planHolderCpf: null,
      },
      overrides.id,
    );
    void patientRepo.save(patient);
  }

  it('lists upcoming birthdays for next_30_days with relative labels', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      name: 'Ana',
      phone: '73999990001',
      birthDate: new Date('1990-07-17T00:00:00.000Z'),
      photoObjectKey: 'photos/ana.jpg',
    });
    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      name: 'Bruno',
      phone: '73999990002',
      birthDate: new Date('1985-08-01T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
      name: 'Carla',
      birthDate: new Date('1992-08-17T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
      name: 'Inativa',
      status: 'inactive',
      birthDate: new Date('1990-07-20T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
      name: 'Outra loja',
      storeId: 'store-2',
      birthDate: new Date('1990-07-18T00:00:00.000Z'),
    });

    const result = await useCase.execute({
      storeId,
      period: 'next_30_days',
      now: today,
    });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      name: 'Ana',
      phone: '73999990001',
      birthDate: '1990-07-17',
      photoUrl: '/api/v1/patients/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1/photo',
      daysUntil: 0,
      relativeLabel: 'Hoje (36 anos)',
    });
    expect(result.items[1]).toMatchObject({
      name: 'Bruno',
      daysUntil: 15,
      photoUrl: null,
    });
  });

  it('filters by search and paginates server-side', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      name: 'Maria Silva',
      birthDate: new Date('1991-07-20T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      name: 'Maria Souza',
      birthDate: new Date('1992-07-25T00:00:00.000Z'),
    });
    seedPatient(patientRepo, {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
      name: 'João',
      birthDate: new Date('1993-07-18T00:00:00.000Z'),
    });

    const result = await useCase.execute({
      storeId,
      period: 'next_30_days',
      search: 'Maria',
      page: 1,
      perPage: 1,
      now: today,
    });

    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(1);
    expect(result.totalPages).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe('Maria Silva');
  });

  it('supports last_30_days past-looking labels', async () => {
    const { patientRepo, useCase } = createUseCase();

    seedPatient(patientRepo, {
      id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      name: 'Past',
      birthDate: new Date('1990-07-10T00:00:00.000Z'),
    });

    const result = await useCase.execute({
      storeId,
      period: 'last_30_days',
      now: today,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      name: 'Past',
      daysUntil: -7,
      relativeLabel: 'Há 7 dias (36 anos)',
    });
  });

  it('rejects custom period without dates', async () => {
    const { useCase } = createUseCase();

    await expect(
      useCase.execute({
        storeId,
        period: 'custom',
        now: today,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
