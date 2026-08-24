import { buildPublicLeadEmailContent } from './build-public-lead-email';

describe('buildPublicLeadEmailContent', () => {
  it('monta subject e corpo com sanitização HTML e todos os campos do formulário', () => {
    const content = buildPublicLeadEmailContent({
      to: 'ana@imob.com',
      agentName: 'Ana',
      leadId: 'lead-1',
      leadName: 'João <script>',
      leadPhone: '73999999999',
      message: 'Olá & tchau',
      propertyName: 'Apto <Centro>',
      agentSlug: 'ana-helena',
      storeId: 'store-1',
    });

    expect(content.subject).toContain('João <script>');
    expect(content.subject).toContain('Apto <Centro>');
    expect(content.text).toContain('Telefone: 73999999999');
    expect(content.text).toContain('Dados enviados pelo cliente');
    expect(content.html).toContain('João &lt;script&gt;');
    expect(content.html).toContain('Olá &amp; tchau');
    expect(content.html).toContain('Dados enviados pelo cliente');
    expect(content.html).not.toContain('<script>');
  });

  it('mostra traço quando telefone/e-mail/mensagem ausentes', () => {
    const content = buildPublicLeadEmailContent({
      to: 'ana@imob.com',
      agentName: 'Ana',
      leadId: 'lead-2',
      leadName: 'Maria',
      agentSlug: 'ana-helena',
      storeId: 'store-1',
    });

    expect(content.text).toContain('Telefone: —');
    expect(content.text).toContain('E-mail: —');
    expect(content.html).toContain('—');
  });
});
