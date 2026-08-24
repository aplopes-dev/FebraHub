import { describe, expect, it } from 'vitest';
import { toAssinaturaRelatorioRow } from './to-assinatura-relatorio-row';
import type { ElectronicSignatureReportItem } from '../services/electronic-signatures-report.api.service';

function makeItem(
  overrides: Partial<ElectronicSignatureReportItem> = {},
): ElectronicSignatureReportItem {
  return {
    id: 'sig-1',
    storeId: 'store-1',
    patientId: 'patient-1',
    patientName: 'Maria Silva',
    kind: 'anamnesis',
    targetId: 'target-1',
    targetIds: null,
    status: 'pending',
    zapsignDocumentToken: 'tok-1',
    hasSignedPdf: false,
    signers: [
      {
        role: 'patient',
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone: '73999999999',
        status: 'pending',
        signUrl: 'https://zapsign.example/s/1',
        whatsappUrl: null,
        signedAt: null,
      },
    ],
    requestedById: 'member-1',
    requestedByName: 'Dr. Silva',
    requestedAt: '2026-08-06T15:30:00.000Z',
    completedAt: null,
    cancelledAt: null,
    createdAt: '2026-08-06T15:30:00.000Z',
    updatedAt: '2026-08-06T15:30:00.000Z',
    ...overrides,
  };
}

describe('toAssinaturaRelatorioRow', () => {
  it('maps API item to report row', () => {
    const row = toAssinaturaRelatorioRow(makeItem());

    expect(row).toMatchObject({
      id: 'sig-1',
      issuedAt: '2026-08-06',
      tipo: 'anamnese',
      assinaturas: '0/1',
      pacienteNome: 'Maria Silva',
      profissionalNome: 'Dr. Silva',
      signUrl: 'https://zapsign.example/s/1',
      status: 'pending',
      patientId: 'patient-1',
    });
  });

  it('maps signed contract without share url', () => {
    const row = toAssinaturaRelatorioRow(
      makeItem({
        kind: 'contract',
        status: 'signed',
        hasSignedPdf: true,
        signers: [
          {
            role: 'patient',
            name: 'Maria',
            email: '',
            phone: '',
            status: 'signed',
            signUrl: 'https://zapsign.example/s/1',
            whatsappUrl: null,
            signedAt: '2026-08-06T16:00:00.000Z',
          },
          {
            role: 'responsible',
            name: 'Clínica',
            email: '',
            phone: '',
            status: 'signed',
            signUrl: 'https://zapsign.example/s/2',
            whatsappUrl: null,
            signedAt: '2026-08-06T16:05:00.000Z',
          },
        ],
      }),
    );

    expect(row.tipo).toBe('contrato');
    expect(row.status).toBe('signed');
    expect(row.assinaturas).toBe('2/2');
    expect(row.signUrl).toBeNull();
  });
});
