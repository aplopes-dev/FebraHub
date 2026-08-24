import { describe, expect, it } from 'vitest';
import {
  formatDashboardLandlinePhone,
  formatDashboardMobilePhone,
  formatDashboardPatientCpfLabel,
} from './format-dashboard-patient-contact';

describe('format-dashboard-patient-contact', () => {
  it('formats landline/local phone with parentheses', () => {
    expect(formatDashboardLandlinePhone('43947441420')).toBe('(43) 94744-1420');
    expect(formatDashboardLandlinePhone('4332334455')).toBe('(43) 3233-4455');
    expect(formatDashboardLandlinePhone('')).toBe('');
  });

  it('formats mobile with +55 and spaced groups', () => {
    expect(formatDashboardMobilePhone('43947441420')).toBe('+55 43 94744 1420');
    expect(formatDashboardMobilePhone('5543947441420')).toBe(
      '+55 43 94744 1420',
    );
    expect(formatDashboardMobilePhone('')).toBe('');
  });

  it('formats CPF with mask and label prefix', () => {
    expect(formatDashboardPatientCpfLabel('25112482044')).toBe(
      'CPF 251.124.820-44',
    );
    expect(formatDashboardPatientCpfLabel('')).toBe('');
  });
});
