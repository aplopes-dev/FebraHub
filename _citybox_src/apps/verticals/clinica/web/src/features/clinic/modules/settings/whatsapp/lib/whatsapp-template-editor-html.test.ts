import { describe, expect, it } from 'vitest';
import {
  editorHtmlToWhatsappBody,
  whatsappBodyToEditorHtml,
} from './whatsapp-template-editor-html';

describe('whatsappBodyToEditorHtml', () => {
  it('converte tokens em chips com label', () => {
    const html = whatsappBodyToEditorHtml(
      'Olá, {nome_paciente}. Clínica: {nome_clinica}.',
    );

    expect(html).toContain('data-variable="{nome_paciente}"');
    expect(html).toContain('data-label="Nome Paciente"');
    expect(html).toContain('>Nome Paciente</span>');
    expect(html).toContain('data-variable="{nome_clinica}"');
    // Chip exibe o label; o token só permanece no atributo data-variable.
    expect(html).not.toMatch(/>\{nome_paciente\}</);
  });

  it('preserva quebras de linha como parágrafos', () => {
    const html = whatsappBodyToEditorHtml('Linha 1\n\nLinha 2');
    expect(html).toBe('<p>Linha 1</p><p></p><p>Linha 2</p>');
  });

  it('mantém token desconhecido como texto escapado', () => {
    const html = whatsappBodyToEditorHtml('Oi {token_fantasma}');
    expect(html).toContain('{token_fantasma}');
    expect(html).not.toContain('data-variable="{token_fantasma}"');
  });
});

describe('editorHtmlToWhatsappBody', () => {
  it('converte chips de volta para tokens', () => {
    const html =
      '<p>Olá, <span data-variable="{nome_paciente}" data-label="Nome Paciente">Nome Paciente</span>.</p>';
    expect(editorHtmlToWhatsappBody(html)).toBe('Olá, {nome_paciente}.');
  });

  it('converte parágrafos em quebras de linha', () => {
    const html = '<p>Linha 1</p><p></p><p>Linha 2</p>';
    expect(editorHtmlToWhatsappBody(html)).toBe('Linha 1\n\nLinha 2');
  });
});

describe('round-trip WhatsApp template body', () => {
  it('preserva body típico de confirmação', () => {
    const body = `Olá, {nome_paciente}. 👋

Sua consulta na {nome_clinica} está marcada para {dia_semana}, {data} às {hora}.

Responda:
1 - Confirmar
2 - Cancelar

{telefone_clinica}`;

    const html = whatsappBodyToEditorHtml(body);
    const restored = editorHtmlToWhatsappBody(html);
    expect(restored).toBe(body);
  });
});
