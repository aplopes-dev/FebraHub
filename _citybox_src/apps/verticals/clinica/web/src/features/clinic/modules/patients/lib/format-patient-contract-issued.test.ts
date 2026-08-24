import { describe, expect, it } from 'vitest';
import {
  formatPatientContractIssuedAt,
  formatPatientContractIssuedLabel,
  formatPatientContractPreviewIssuedLabel,
} from './format-patient-contract-issued';

describe('formatPatientContractIssued', () => {
  it('formats issued datetime as dd/mm/yyyy às hh:mm', () => {
    expect(formatPatientContractIssuedAt('2026-07-01T11:47:00.000Z')).toMatch(
      /01\/07\/2026 às \d{2}:\d{2}/,
    );
  });

  it('builds manual issued label', () => {
    expect(formatPatientContractIssuedLabel('2026-07-01T11:47:00.000Z', 'manual')).toMatch(
      /^Emitido via manual — 01\/07\/2026 às \d{2}:\d{2}$/,
    );
  });

  it('builds preview label from budget with day only', () => {
    expect(
      formatPatientContractPreviewIssuedLabel('2026-07-31T15:00:00.000Z', true),
    ).toMatch(/^Emitido via orçamento dia 31\/07\/2026$/);
  });

  it('builds preview label without budget with day only', () => {
    expect(
      formatPatientContractPreviewIssuedLabel('2026-07-31T15:00:00.000Z', false),
    ).toMatch(/^Emitido dia 31\/07\/2026$/);
  });
});
