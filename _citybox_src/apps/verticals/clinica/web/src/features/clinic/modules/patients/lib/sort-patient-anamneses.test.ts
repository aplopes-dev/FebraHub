import { describe, expect, it } from 'vitest';
import {
  getNextPatientAnamnesisSort,
  toApiAnamnesisSort,
} from './sort-patient-anamneses';

describe('getNextPatientAnamnesisSort', () => {
  it('starts ascending when changing column', () => {
    expect(getNextPatientAnamnesisSort(null, 'issuedAt')).toEqual({
      column: 'issuedAt',
      desc: false,
    });
  });

  it('toggles direction on same column', () => {
    expect(
      getNextPatientAnamnesisSort({ column: 'templateName', desc: false }, 'templateName'),
    ).toEqual({
      column: 'templateName',
      desc: true,
    });
  });
});

describe('toApiAnamnesisSort', () => {
  it('defaults to issuedAt desc when sort is null', () => {
    expect(toApiAnamnesisSort(null)).toEqual({
      sortBy: 'issuedAt',
      sortOrder: 'desc',
    });
  });

  it('maps UI sort to API params', () => {
    expect(
      toApiAnamnesisSort({ column: 'templateName', desc: true }),
    ).toEqual({
      sortBy: 'templateName',
      sortOrder: 'desc',
    });
  });
});
