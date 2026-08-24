import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useClinicPlanConfigure } from './use-clinic-plan-configure';

vi.mock('@/lib/store-context', () => ({
  useStore: () => ({
    storeId: 'store-1',
    accessibleStores: [{ id: 'store-1', clinicStrand: 'odontologia' }],
  }),
}));

describe('useClinicPlanConfigure', () => {
  it('addSpecialty seleciona a especialidade e abre edição do nome com o mesmo id', () => {
    const { result } = renderHook(() => useClinicPlanConfigure());

    let createdId = '';
    act(() => {
      createdId = result.current.addSpecialty();
    });

    expect(createdId).toBeTruthy();
    expect(result.current.specialties).toHaveLength(1);
    expect(result.current.specialties[0]?.id).toBe(createdId);
    expect(result.current.specialties[0]?.name).toBe('');
    expect(result.current.selectedSpecialtyId).toBe(createdId);
    expect(result.current.editingSpecialtyNameId).toBe(createdId);
  });

  it('addSpecialty em sequência mantém editingId na última criada', () => {
    const { result } = renderHook(() => useClinicPlanConfigure());

    let firstId = '';
    let secondId = '';
    act(() => {
      firstId = result.current.addSpecialty();
    });
    act(() => {
      secondId = result.current.addSpecialty();
    });

    expect(firstId).not.toBe(secondId);
    expect(result.current.specialties).toHaveLength(2);
    expect(result.current.editingSpecialtyNameId).toBe(secondId);
    expect(result.current.selectedSpecialtyId).toBe(secondId);
  });

  it('initializeEmpty pré-preenche especialidades do sistema sem tratamentos', () => {
    const { result } = renderHook(() => useClinicPlanConfigure());

    act(() => {
      result.current.initializeEmpty();
    });

    expect(result.current.specialties.length).toBeGreaterThan(1);
    expect(result.current.specialties[0]?.name).toBe('Cirurgia');
    expect(result.current.specialties.every((s) => s.treatments.length === 0)).toBe(
      true,
    );
    expect(result.current.selectedSpecialtyId).toBe(
      result.current.specialties[0]?.id,
    );
    expect(result.current.editingSpecialtyNameId).toBeNull();
  });

  it('addTreatment acrescenta no fim e devolve o id criado', () => {
    const { result } = renderHook(() => useClinicPlanConfigure());

    let specialtyId = '';
    act(() => {
      specialtyId = result.current.addSpecialty();
      result.current.updateSpecialty(specialtyId, { name: 'Endodontia' });
    });

    let treatmentId = '';
    act(() => {
      treatmentId = result.current.addTreatment(specialtyId);
    });

    const specialty = result.current.specialties.find((s) => s.id === specialtyId);
    expect(treatmentId).toBeTruthy();
    expect(specialty?.treatments).toHaveLength(1);
    expect(specialty?.treatments[0]?.id).toBe(treatmentId);
    expect(specialty?.treatments[0]?.name).toBe('');
  });
});
