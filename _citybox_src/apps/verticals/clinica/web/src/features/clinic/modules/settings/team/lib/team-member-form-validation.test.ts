import { describe, expect, it } from 'vitest';
import { createEmptyTeamMemberFormData } from './team-form-initial-values';
import { validateTeamMemberSheetForm } from './team-member-form-validation';

const base = {
  ...createEmptyTeamMemberFormData(),
  firstName: 'Ana',
  lastName: 'Silva',
  username: 'ana.silva',
  email: '',
  role: 'professional',
};

describe('validateTeamMemberSheetForm', () => {
  it('rejects username with spaces', () => {
    const errors = validateTeamMemberSheetForm({
      ...base,
      username: 'ana silva',
    });
    expect(errors.username).toBe(
      'Username não pode conter espaços nem caracteres especiais.',
    );
  });

  it('rejects username with special characters', () => {
    const errors = validateTeamMemberSheetForm({
      ...base,
      username: 'ana@silva',
    });
    expect(errors.username).toBe(
      'Username não pode conter espaços nem caracteres especiais.',
    );
  });

  it('accepts valid username', () => {
    const errors = validateTeamMemberSheetForm(base);
    expect(errors.username).toBeUndefined();
  });
});
