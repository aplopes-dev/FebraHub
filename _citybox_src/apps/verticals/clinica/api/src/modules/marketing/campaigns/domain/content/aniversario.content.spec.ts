import {
  birthdayCampaignCorrelationPrefix,
  birthdayMessageCorrelationId,
  DEFAULT_ANIVERSARIO_MESSAGE_BODY,
  parseAniversarioContent,
} from './aniversario.content';

describe('parseAniversarioContent', () => {
  it('parses canonical content', () => {
    const content = parseAniversarioContent(
      {
        planIds: ['plan-1'],
        specialtyIds: ['spec-1'],
        genders: ['female'],
        messageBody: 'Feliz aniversário, {nome_paciente}!',
      },
      'test',
    );

    expect(content.planIds).toEqual(['plan-1']);
    expect(content.specialtyIds).toEqual(['spec-1']);
    expect(content.genders).toEqual(['female']);
    expect(content.messageBody).toBe('Feliz aniversário, {nome_paciente}!');
  });

  it('accepts wizard stepTwo shape and defaults empty filters', () => {
    const content = parseAniversarioContent(
      {
        stepTwo: {
          messageBody: 'Parabéns!',
        },
      },
      'test',
    );

    expect(content.planIds).toEqual([]);
    expect(content.specialtyIds).toEqual([]);
    expect(content.genders).toEqual([]);
    expect(content.messageBody).toBe('Parabéns!');
  });

  it('falls back to default birthday template when message empty', () => {
    const content = parseAniversarioContent({}, 'test');
    expect(content.messageBody).toBe(DEFAULT_ANIVERSARIO_MESSAGE_BODY);
  });

  it('drops invalid gender values during normalize then accepts empty list', () => {
    const content = parseAniversarioContent(
      {
        genders: ['unknown'],
        messageBody: 'Oi',
      },
      'test',
    );
    expect(content.genders).toEqual([]);
  });
});

describe('birthdayMessageCorrelationId', () => {
  it('builds stable id', () => {
    expect(birthdayMessageCorrelationId('c1', 'p1', '2026-07-30')).toBe(
      'birthday:c1:p1:2026-07-30',
    );
  });
});

describe('birthdayCampaignCorrelationPrefix', () => {
  it('builds count prefix', () => {
    expect(birthdayCampaignCorrelationPrefix('c1')).toBe('birthday:c1:');
  });
});
