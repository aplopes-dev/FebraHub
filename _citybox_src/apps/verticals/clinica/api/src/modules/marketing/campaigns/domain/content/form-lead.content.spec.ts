import {
  normalizeFormLeadContent,
  parseFormLeadContent,
} from './form-lead.content';

describe('form-lead.content', () => {
  const validQuestions = [
    {
      id: 'field-name',
      type: 'text' as const,
      label: 'Nome',
      required: true,
    },
    {
      id: 'field-phone',
      type: 'phone' as const,
      label: 'Telefone',
      required: true,
    },
  ];

  const validCanonical = {
    notifyOnLead: false,
    duplicityRule: 'block' as const,
    successAction: 'message' as const,
    successMessage: 'Obrigado!',
    questions: validQuestions,
    lgpdConsent: { text: 'Concordo com o tratamento dos dados.' },
  };

  it('parses valid canonical content', () => {
    const parsed = parseFormLeadContent(validCanonical, 'test');
    expect(parsed.questions).toHaveLength(2);
    expect(parsed.duplicityRule).toBe('block');
  });

  it('normalizes wizard stepTwo/stepThree payload', () => {
    const normalized = normalizeFormLeadContent({
      stepTwo: {
        notifyOnLead: true,
        duplicityRule: 'update',
        successAction: 'message',
        successMessage: 'Ok',
        ownerId: 'none',
      },
      stepThree: {
        questions: validQuestions,
        lgpdConsent: { text: 'LGPD' },
      },
      stepFour: { statusType: 'always_active' },
    });
    expect(normalized.ownerId).toBeUndefined();
    expect(normalized.notifyOnLead).toBe(true);
    const parsed = parseFormLeadContent(normalized, 'test');
    expect(parsed.successMessage).toBe('Ok');
  });

  it('rejects missing name/phone fields', () => {
    expect(() =>
      parseFormLeadContent(
        {
          ...validCanonical,
          questions: [
            {
              id: 'other',
              type: 'text',
              label: 'Outro',
              required: true,
            },
            validQuestions[1],
          ],
        },
        'test',
      ),
    ).toThrow();
  });

  it('rejects radio without enough options', () => {
    expect(() =>
      parseFormLeadContent(
        {
          ...validCanonical,
          questions: [
            ...validQuestions,
            {
              id: 'q-radio',
              type: 'radio',
              label: 'Escolha',
              required: false,
              options: [{ id: 'o1', label: 'Só uma' }],
            },
          ],
        },
        'test',
      ),
    ).toThrow();
  });

  it('normalizes redirect and privacy policy URLs without protocol', () => {
    const normalized = normalizeFormLeadContent({
      stepTwo: {
        notifyOnLead: false,
        duplicityRule: 'block',
        successAction: 'redirect',
        redirectUrl: 'www.example.com/obrigado',
      },
      stepThree: {
        questions: validQuestions,
        lgpdConsent: {
          text: 'Concordo.',
          privacyPolicyUrl: 'www.example.com/privacidade',
        },
      },
    });
    expect(normalized.redirectUrl).toBe('https://www.example.com/obrigado');
    expect(
      (normalized.lgpdConsent as { privacyPolicyUrl?: string }).privacyPolicyUrl,
    ).toBe('https://www.example.com/privacidade');
  });
});
