import { jsPDF } from 'jspdf';
import { describe, expect, it, vi } from 'vitest';
import type { ClinicSettingsFormData } from '@/features/clinic/modules/settings/types/clinic-settings';
import type { PatientAddress } from '../types/clinic-patient';
import type { PatientGender } from '../types/patient-form';
import type { PatientAnamnesis } from '../types/patient-anamnesis';
import {
  buildPatientAnamnesisPdf,
  buildPatientAnamnesisPdfFileName,
  drawAnamnesisPatientDataSection,
  formatPatientAddressForPdf,
  getPatientAnamnesisPdfQuestionAnswerRows,
  mapClinicSettingsToAnamnesisPdfClinic,
} from './build-patient-anamnesis-pdf';
import {
  createPatientPdfWriter,
  PATIENT_PDF_PAGE_MARGIN_X,
} from './patient-pdf-shared';

const mockAddress: PatientAddress = {
  zipCode: '45650000',
  street: 'Rua das Palmeiras',
  streetNumber: '120',
  complement: 'Apto 302',
  neighborhood: 'Centro',
  city: 'Ilhéus',
  state: 'BA',
};

const mockAnamnesis: PatientAnamnesis = {
  id: 'anam-001',
  patientId: 'pat-001',
  templateId: 'tpl-001',
  issuedAt: '2026-06-28',
  templateName: 'Anamnese Adulta Completa',
  status: 'issued',
  signatureStatus: 'signed',
  fillingMode: 'professional',
};

const mockAnamnesisWithAnswers: PatientAnamnesis = {
  ...mockAnamnesis,
  consultationReason: 'Dor de dente',
  answers: [
    { questionId: 'q-allergy', triState: 'no' },
    { questionId: 'q-medication', text: 'Dipirona eventual' },
  ],
  questionsSnapshot: [
    {
      id: 'q-allergy',
      text: 'Possui alguma alergia?',
      type: 'yes_no_unknown',
      generatesAlert: false,
    },
    {
      id: 'q-medication',
      text: 'Usa algum medicamento?',
      type: 'text',
      generatesAlert: false,
    },
  ],
};

function mockClinicProfile(): ClinicSettingsFormData {
  return {
    clinicName: 'Clínica Sorriso',
    communicationsName: 'Sorriso Odontologia',
    cnpj: '12345678000199',
    responsible: 'Dr. Carlos',
    logoUrl: undefined,
    openingTime: '08:00',
    closingTime: '18:00',
    email: 'contato@sorriso.com',
    phone: '7336211234',
    mobile: '73999887766',
    cep: '45650000',
    street: 'Rua das Flores',
    number: '100',
    complement: '',
    neighborhood: 'Centro',
    city: 'Ilhéus',
    state: 'BA',
  };
}

describe('mapClinicSettingsToAnamnesisPdfClinic', () => {
  it('maps clinic profile fields for the PDF header', () => {
    const mapped = mapClinicSettingsToAnamnesisPdfClinic(mockClinicProfile());

    expect(mapped.clinicName).toBe('Clínica Sorriso');
    expect(mapped.cnpj).toBe('12345678000199');
    expect(mapped.phone).toBe('7336211234');
  });
});

describe('getPatientAnamnesisPdfQuestionAnswerRows', () => {
  it('strips TipTap <p> tags from the consultation reason (first row)', () => {
    const rows = getPatientAnamnesisPdfQuestionAnswerRows({
      ...mockAnamnesisWithAnswers,
      consultationReason: '<p>dsadasddadada</p>',
      answers: [
        {
          questionId: 'q-rich',
          text: '<p>outra resposta</p>',
        },
      ],
      questionsSnapshot: [
        {
          id: 'q-rich',
          text: 'Tratamentos anteriores',
          type: 'rich_text',
          generatesAlert: false,
        },
      ],
    });

    expect(rows[0]).toEqual({
      question: 'Qual o motivo da sua consulta?',
      answer: 'dsadasddadada',
    });
    expect(rows[1]?.answer).toBe('outra resposta');
    expect(rows.every((row) => !row.answer.includes('<p>'))).toBe(true);
  });
});

type DrawnText = { text: string; x: number; y: number };

function captureDocTexts(doc: jsPDF): DrawnText[] {
  const texts: DrawnText[] = [];
  const originalText = doc.text.bind(doc);

  vi.spyOn(doc, 'text').mockImplementation((text, x, y, options) => {
    const value = Array.isArray(text) ? text.join(' ') : String(text);
    texts.push({ text: value, x: Number(x), y: Number(y) });
    return originalText(text, x, y, options);
  });

  return texts;
}

function findLabel(texts: DrawnText[], label: string): DrawnText {
  const match = texts.find((item) => item.text.startsWith(`${label}:`));
  expect(match, `missing PDF label ${label}`).toBeDefined();
  return match as DrawnText;
}

describe('formatPatientAddressForPdf', () => {
  it('uses the clinic letterhead comma line without CEP label', () => {
    expect(formatPatientAddressForPdf(mockAddress)).toBe(
      'Rua das Palmeiras, 120, Apto 302, Centro, Ilhéus /BA, 45650-000',
    );
  });

  it('returns a dash when the address is empty', () => {
    expect(
      formatPatientAddressForPdf({
        zipCode: '',
        street: '',
        streetNumber: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
      }),
    ).toBe('—');
  });
});

describe('drawAnamnesisPatientDataSection', () => {
  it('lays out name/phone/birth on the left and gender/address on the right', () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const writer = createPatientPdfWriter(doc);
    const texts = captureDocTexts(doc);

    drawAnamnesisPatientDataSection(writer, {
      patientName: 'Maria Silva',
      patientPhone: '73999887766',
      patientBirthDate: '1985-05-04',
      patientGender: 'female',
      patientAddress: mockAddress,
    });

    const nome = findLabel(texts, 'Nome');
    const telefone = findLabel(texts, 'Telefone');
    const nascimento = findLabel(texts, 'Nascimento');
    const sexo = findLabel(texts, 'Sexo');
    const endereco = findLabel(texts, 'Endereço');
    const columnMidX = PATIENT_PDF_PAGE_MARGIN_X + 80;

    expect(nome.x).toBe(PATIENT_PDF_PAGE_MARGIN_X);
    expect(telefone.x).toBe(PATIENT_PDF_PAGE_MARGIN_X);
    expect(nascimento.x).toBe(PATIENT_PDF_PAGE_MARGIN_X);
    expect(sexo.x).toBeGreaterThan(columnMidX);
    expect(endereco.x).toBeGreaterThan(columnMidX);
    expect(sexo.x).toBe(endereco.x);
    expect(sexo.y).toBe(nome.y);
    expect(endereco.y).toBe(telefone.y);
    expect(nascimento.y).toBeGreaterThan(telefone.y);
  });

  it('formats the patient address like the clinic letterhead', () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const writer = createPatientPdfWriter(doc);
    const texts = captureDocTexts(doc);

    drawAnamnesisPatientDataSection(writer, {
      patientName: 'Maria Silva',
      patientAddress: mockAddress,
    });

    const drawn = texts.map((item) => item.text).join(' ');

    expect(drawn).toContain('Rua das Palmeiras');
    expect(drawn).toContain('Ilhéus /BA');
    expect(drawn).toContain('45650-000');
    expect(drawn).not.toMatch(/CEP/i);
    expect(drawn).not.toContain(' · ');
  });

  it('wraps the address flush with the Endereço label', () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const writer = createPatientPdfWriter(doc);
    const texts = captureDocTexts(doc);

    drawAnamnesisPatientDataSection(writer, {
      patientName: 'Maria Silva',
      patientAddress: mockAddress,
    });

    const endereco = findLabel(texts, 'Endereço');
    const columnMidX = PATIENT_PDF_PAGE_MARGIN_X + 80;
    const continuation = texts.filter(
      (item) => item.y > endereco.y && item.x > columnMidX,
    );

    expect(continuation.length).toBeGreaterThan(0);
    for (const line of continuation) {
      expect(line.x).toBe(endereco.x);
    }
  });
});

describe('buildPatientAnamnesisPdf', () => {
  it('generates a non-empty PDF blob for a filled anamnesis', async () => {
    const blob = await buildPatientAnamnesisPdf({
      patientName: 'Maria Silva',
      patientPhone: '73999887766',
      patientBirthDate: '1985-05-04',
      patientGender: 'female' satisfies PatientGender,
      patientAddress: mockAddress,
      anamnesis: mockAnamnesisWithAnswers,
      clinic: mapClinicSettingsToAnamnesisPdfClinic(mockClinicProfile()),
    });

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('generates a PDF blob for awaiting_response anamnesis without snapshot answers', async () => {
    const blob = await buildPatientAnamnesisPdf({
      patientName: 'Maria Silva',
      patientGender: 'female' satisfies PatientGender,
      patientAddress: mockAddress,
      anamnesis: {
        ...mockAnamnesis,
        status: 'awaiting_response',
        signatureStatus: 'unsigned',
      },
      clinic: mapClinicSettingsToAnamnesisPdfClinic(mockClinicProfile()),
    });

    expect(blob.type).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe('buildPatientAnamnesisPdfFileName', () => {
  it('builds a slugged file name with patient, template and date', () => {
    expect(
      buildPatientAnamnesisPdfFileName(
        'Maria Silva',
        'Anamnese Adulta Completa',
        new Date('2026-06-30T12:00:00.000Z'),
      ),
    ).toBe('anamnese-maria-silva-anamnese-adulta-completa-2026-06-30.pdf');
  });
});
