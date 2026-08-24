import { resolveLeadNotifyRecipients } from './notify-public-lead.use-case';

describe('resolveLeadNotifyRecipients', () => {
  it('usa e-mail do corretor', () => {
    expect(resolveLeadNotifyRecipients('Ana@Imob.com', {})).toEqual([
      'ana@imob.com',
    ]);
  });

  it('inclui LEADS_NOTIFY_EMAIL sem duplicar', () => {
    expect(
      resolveLeadNotifyRecipients('ana@imob.com', {
        LEADS_NOTIFY_EMAIL: 'ana@imob.com, ops@citybox.com',
      }),
    ).toEqual(['ana@imob.com', 'ops@citybox.com']);
  });

  it('ignora e-mails inválidos', () => {
    expect(resolveLeadNotifyRecipients('sem-arroba', {})).toEqual([]);
    expect(
      resolveLeadNotifyRecipients('', {
        LEADS_NOTIFY_EMAIL: 'valido@x.com, invalido',
      }),
    ).toEqual(['valido@x.com']);
  });

  it('em dev usa AUTH_DEV_EMAIL quando não há destinatário', () => {
    expect(
      resolveLeadNotifyRecipients('', {
        AUTH_DEV_EMAIL: 'admin@citybox.com',
        NODE_ENV: 'development',
      }),
    ).toEqual(['admin@citybox.com']);
  });

  it('não usa AUTH_DEV_EMAIL em produção', () => {
    expect(
      resolveLeadNotifyRecipients('', {
        AUTH_DEV_EMAIL: 'admin@citybox.com',
        NODE_ENV: 'production',
      }),
    ).toEqual([]);
  });
});
