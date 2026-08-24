import { renderWhatsappTemplate } from './render-template';

describe('renderWhatsappTemplate', () => {
  it('substitui variáveis conhecidas', () => {
    const body = 'Olá, {nome_paciente} — {nome_clinica} às {hora}';
    expect(
      renderWhatsappTemplate(body, {
        nome_paciente: 'Ana',
        nome_clinica: 'Clínica X',
        hora: '14:00',
      }),
    ).toBe('Olá, Ana — Clínica X às 14:00');
  });

  it('substitui variável ausente por string vazia', () => {
    expect(renderWhatsappTemplate('Tel: {telefone_clinica}', {})).toBe(
      'Tel: ',
    );
  });
});
