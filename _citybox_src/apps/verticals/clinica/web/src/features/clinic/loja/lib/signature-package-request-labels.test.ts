import { describe, expect, it } from 'vitest';
import {
  formatSignaturePackageRequestDate,
  formatSignaturePackageRequestPackageLabel,
  SIGNATURE_PACKAGE_REQUEST_STATUS_LABEL,
} from './signature-package-request-labels';

describe('signature-package-request-labels', () => {
  it('mapeia status de domínio para rótulos PT', () => {
    expect(SIGNATURE_PACKAGE_REQUEST_STATUS_LABEL.pending).toBe('Pendente');
    expect(SIGNATURE_PACKAGE_REQUEST_STATUS_LABEL.liberado).toBe('Aprovado');
    expect(SIGNATURE_PACKAGE_REQUEST_STATUS_LABEL.cancelado).toBe('Recusado');
  });

  it('formata pacote pela quantidade', () => {
    expect(formatSignaturePackageRequestPackageLabel(250)).toBe(
      '250 assinaturas',
    );
  });

  it('formata data ISO em pt-BR', () => {
    expect(formatSignaturePackageRequestDate('2026-08-07T12:00:00.000Z')).toMatch(
      /^\d{2}\/\d{2}\/2026$/,
    );
  });
});
