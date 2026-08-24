import { describe, expect, it } from 'vitest';
import {
  CLINIC_LOGO_MAX_BYTES,
  CLINIC_LOGO_TOO_LARGE_MESSAGE,
  validateClinicLogoFile,
} from './validate-clinic-logo-file';

function fakeFile(overrides: { name?: string; type?: string; size?: number } = {}): File {
  const size = overrides.size ?? 1024;
  const blob = new Blob([new Uint8Array(size)], { type: overrides.type ?? 'image/jpeg' });
  return new File([blob], overrides.name ?? 'logo.jpg', {
    type: overrides.type ?? 'image/jpeg',
  });
}

describe('validateClinicLogoFile', () => {
  it('aceita JPG dentro do limite', () => {
    expect(validateClinicLogoFile(fakeFile({ size: CLINIC_LOGO_MAX_BYTES }))).toBeNull();
  });

  it('rejeita arquivo acima de 4 MB com mensagem amigável', () => {
    expect(
      validateClinicLogoFile(fakeFile({ size: CLINIC_LOGO_MAX_BYTES + 1 })),
    ).toBe(CLINIC_LOGO_TOO_LARGE_MESSAGE);
  });

  it('rejeita tipo inválido', () => {
    expect(
      validateClinicLogoFile(fakeFile({ name: 'logo.gif', type: 'image/gif', size: 100 })),
    ).toBe('Envie apenas arquivos JPG, PNG ou WebP.');
  });
});
