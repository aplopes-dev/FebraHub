import { describe, expect, it } from 'vitest';
import {
  toPatientFormValues,
  toPatientPhotoUrl,
  withPatientPhotoCacheKey,
} from './patient-api-mappers';
import type { PatientApiFormItem } from '../types/patient-api';

describe('patient photo proxy urls', () => {
  it('includes storeId in query string for browser image requests', () => {
    expect(toPatientPhotoUrl('store-1', '/api/v1/patients/patient-1/photo')).toBe(
      '/api/proxy/clinica/v1/patients/patient-1/photo?storeId=store-1',
    );
  });

  it('appends cache bust param without dropping storeId', () => {
    const url = toPatientPhotoUrl('store-1', '/api/v1/patients/patient-1/photo', 3);
    expect(url).toBe('/api/proxy/clinica/v1/patients/patient-1/photo?storeId=store-1&v=3');
    expect(withPatientPhotoCacheKey(url, 4)).toBe(
      '/api/proxy/clinica/v1/patients/patient-1/photo?storeId=store-1&v=4',
    );
  });
});

describe('toPatientFormValues', () => {
  const apiRow: PatientApiFormItem = {
    id: 'patient-1',
    name: 'Maria',
    photoUrl: null,
    cpf: '52998224725',
    phone: '73999998888',
    birthDate: '1990-05-10',
    gender: 'female',
    email: 'maria@example.com',
    profession: '',
    medicalRecordNumber: '',
    referralOriginId: 'origin-google',
    referralOriginName: 'Google',
    referralOriginSystemKey: 'google',
    referredByPatientId: null,
    referredByPatientName: null,
    referredByMemberId: null,
    referredByMemberName: null,
    referredByExternalProfessionalId: null,
    referredByExternalProfessionalName: null,
    planName: '',
    categoryId: 'cat-1',
    categoryName: 'Particular',
    categoryColorId: '#3b82f6',
    status: 'active',
    address: {
      zipCode: '45653000',
      street: 'Rua A',
      streetNumber: '10',
      complement: '',
      neighborhood: 'Centro',
      city: 'Ilhéus',
      state: 'BA',
    },
    aboutSummary: { lastEvolution: null, appointments: null, messages: null },
    rg: '',
    landlinePhone: '7335551234',
    socialNetwork: '',
    guardianName: '',
    guardianBirthDate: '',
    guardianCpf: '11144477735',
    guardianPhone: '73988887777',
    guardianNotes: '',
    planId: '',
    planNumber: '',
    planHolderName: '',
    planHolderCpf: '52998224725',
  };

  it('hydrates masked values for phone, cpf and cep fields (edit form)', () => {
    const values = toPatientFormValues(apiRow);

    expect(values.phone).toBe('(73) 99999-8888');
    expect(values.cpf).toBe('529.982.247-25');
    expect(values.landlinePhone).toBe('(73) 3555-1234');
    expect(values.guardianPhone).toBe('(73) 98888-7777');
    expect(values.guardianCpf).toBe('111.444.777-35');
    expect(values.planHolderCpf).toBe('529.982.247-25');
    expect(values.zipCode).toBe('45653-000');
  });

  it('keeps empty contact fields empty', () => {
    const values = toPatientFormValues({
      ...apiRow,
      cpf: '',
      phone: '',
      landlinePhone: '',
      guardianCpf: '',
      guardianPhone: '',
      planHolderCpf: '',
      address: { ...apiRow.address, zipCode: '' },
    });

    expect(values.phone).toBe('');
    expect(values.cpf).toBe('');
    expect(values.landlinePhone).toBe('');
    expect(values.guardianCpf).toBe('');
    expect(values.guardianPhone).toBe('');
    expect(values.planHolderCpf).toBe('');
    expect(values.zipCode).toBe('');
  });
});
