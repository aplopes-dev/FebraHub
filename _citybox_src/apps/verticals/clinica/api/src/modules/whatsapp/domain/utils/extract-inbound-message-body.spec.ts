import {
  extractInboundMessageBody,
  NON_TEXT_INBOUND_PLACEHOLDER,
  type InboundWaMessageLike,
} from './extract-inbound-message-body';

function msg(
  message: NonNullable<InboundWaMessageLike['message']>,
): InboundWaMessageLike {
  return { message };
}

describe('extractInboundMessageBody', () => {
  it('extrai conversation e extendedText', () => {
    expect(extractInboundMessageBody(msg({ conversation: ' 1 ' }))).toBe('1');
    expect(
      extractInboundMessageBody(msg({ extendedTextMessage: { text: '2' } })),
    ).toBe('2');
  });

  it('usa legenda de imagem/vídeo quando houver', () => {
    expect(
      extractInboundMessageBody(msg({ imageMessage: { caption: '1' } })),
    ).toBe('1');
  });

  it('trata figurinha/áudio/imagem sem legenda como não textual', () => {
    expect(extractInboundMessageBody(msg({ stickerMessage: {} }))).toBe(
      NON_TEXT_INBOUND_PLACEHOLDER,
    );
    expect(extractInboundMessageBody(msg({ audioMessage: {} }))).toBe(
      NON_TEXT_INBOUND_PLACEHOLDER,
    );
    expect(extractInboundMessageBody(msg({ imageMessage: {} }))).toBe(
      NON_TEXT_INBOUND_PLACEHOLDER,
    );
  });

  it('ignora mensagens sem conteúdo de usuário', () => {
    expect(extractInboundMessageBody(msg({}))).toBeNull();
    expect(extractInboundMessageBody({})).toBeNull();
  });
});
