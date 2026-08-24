import { PARTICULAR_SPECIALTIES } from './particular-specialties';
import { ANAMNESIS_TEMPLATES } from './anamnesis-templates';
import { CLINIC_SEED_TEMPLATE } from './clinic-seed-template';

describe('CLINIC_SEED_TEMPLATE', () => {
  it('includes 17 specialties and Harmonização Facial', () => {
    expect(PARTICULAR_SPECIALTIES).toHaveLength(17);
    expect(
      PARTICULAR_SPECIALTIES.some((item) => item.name === 'Harmonização Facial'),
    ).toBe(true);
    expect(
      PARTICULAR_SPECIALTIES.reduce(
        (sum, item) => sum + item.treatments.length,
        0,
      ),
    ).toBeGreaterThan(200);
  });

  it('includes 7 anamnesis templates', () => {
    expect(ANAMNESIS_TEMPLATES).toHaveLength(7);
    expect(CLINIC_SEED_TEMPLATE.version).toBe(4);
  });

  it('seeds financial categories with distinct hex colors', () => {
    const expenseColors = CLINIC_SEED_TEMPLATE.expenseCategories.map(
      (c) => c.color,
    );
    const incomeColors = CLINIC_SEED_TEMPLATE.incomeCategories.map(
      (c) => c.color,
    );

    expect(CLINIC_SEED_TEMPLATE.expenseCategories).toHaveLength(8);
    expect(CLINIC_SEED_TEMPLATE.incomeCategories).toHaveLength(7);
    expect(expenseColors.every((c) => /^#[0-9A-Fa-f]{6}$/.test(c))).toBe(true);
    expect(incomeColors.every((c) => /^#[0-9A-Fa-f]{6}$/.test(c))).toBe(true);
    expect(new Set(expenseColors).size).toBe(expenseColors.length);
    expect(new Set(incomeColors).size).toBe(incomeColors.length);
  });
});
