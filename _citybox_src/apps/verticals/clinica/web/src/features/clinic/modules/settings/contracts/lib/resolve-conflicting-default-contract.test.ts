import { describe, expect, it } from 'vitest';
import { resolveConflictingDefaultContract } from './resolve-conflicting-default-contract';
import type { ClinicContractTemplate } from '../types/clinic-contract';

const templates: ClinicContractTemplate[] = [
  { id: 'a', name: 'Modelo A', isDefault: true, content: '' },
  { id: 'b', name: 'Modelo B', isDefault: false, content: '' },
];

describe('resolveConflictingDefaultContract', () => {
  it('returns the current default when editing another template', () => {
    expect(resolveConflictingDefaultContract(templates, 'b')).toEqual(templates[0]);
  });

  it('returns null when editing the current default template', () => {
    expect(resolveConflictingDefaultContract(templates, 'a')).toBeNull();
  });

  it('returns null when no default exists', () => {
    const withoutDefault = templates.map((template) => ({ ...template, isDefault: false }));
    expect(resolveConflictingDefaultContract(withoutDefault, 'b')).toBeNull();
  });
});
