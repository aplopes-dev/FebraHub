import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { decifrar } from '../agentes/agentes.service';

const AUDIO_MIME = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'audio/flac',
  'video/webm', // gravações do microfone no Chrome vêm assim
]);

const AUDIO_EXT = new Set(['.mp3', '.m4a', '.wav', '.webm', '.ogg', '.flac', '.mp4', '.mpeg', '.mpga']);

/**
 * Extrai texto de áudio para a memória institucional.
 *
 * Usa a Whisper da OpenAI com a mesma chave cifrada do motor de resposta.
 * Sem chave, devolve erro legível — não há modelo de áudio local na VPS hoje.
 */
@Injectable()
export class BrainMidiaService {
  private readonly logger = new Logger(BrainMidiaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  ehAudio(nome: string, mime: string): boolean {
    const ext = `.${(nome.split('.').pop() ?? '').toLowerCase()}`;
    const m = (mime || '').toLowerCase().split(';')[0].trim();
    return AUDIO_EXT.has(ext) || AUDIO_MIME.has(m);
  }

  async transcrever(arquivo: { nome: string; mime: string; conteudo: Buffer }): Promise<{
    texto: string;
    titulo: string;
    origem: string;
  }> {
    if (!arquivo.conteudo?.length) {
      throw new BadRequestException({ codigo: 'ARQUIVO_VAZIO', message: 'O áudio veio vazio.' });
    }
    if (!this.ehAudio(arquivo.nome, arquivo.mime)) {
      throw new BadRequestException({
        codigo: 'TIPO_INVALIDO',
        message: 'Envie áudio em MP3, M4A, WAV, WEBM, OGG ou FLAC.',
      });
    }
    if (arquivo.conteudo.length > 25 * 1024 * 1024) {
      throw new BadRequestException({
        codigo: 'ARQUIVO_GRANDE',
        message: 'Áudio acima de 25 MB. Corte em partes menores.',
      });
    }

    const linha = await this.prisma.brainConfig.findUnique({ where: { id: 'brain' } });
    if (!linha?.chaveOpenai) {
      throw new ServiceUnavailableException({
        codigo: 'SEM_PROVEDOR_AUDIO',
        message:
          'Para transcrever áudio, grave uma chave da OpenAI em Configurações → Memória institucional ' +
          '(a Whisper usa a mesma chave do motor de resposta).',
      });
    }

    const chave = decifrar(this.config, linha.chaveOpenai);
    const form = new FormData();
    // Node 22: Blob + FormData nativos. Uint8Array evita tipagem estranha do Buffer.
    const blob = new Blob([new Uint8Array(arquivo.conteudo)], {
      type: arquivo.mime || 'audio/mpeg',
    });
    form.append('file', blob, arquivo.nome || 'audio.mp3');
    form.append('model', 'whisper-1');
    form.append('language', 'pt');
    form.append('response_format', 'json');

    let res: Response;
    try {
      res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${chave}` },
        body: form,
      });
    } catch (e) {
      this.logger.warn(`whisper rede: ${(e as Error).message}`);
      throw new ServiceUnavailableException({
        codigo: 'WHISPER_REDE',
        message: 'Não consegui falar com a OpenAI para transcrever o áudio.',
      });
    }

    if (!res.ok) {
      const corpo = await res.text().catch(() => '');
      this.logger.warn(`whisper ${res.status}: ${corpo.slice(0, 200)}`);
      throw new ServiceUnavailableException({
        codigo: 'WHISPER_FALHOU',
        message: 'A transcrição falhou. Confira se a chave da OpenAI tem acesso ao Whisper.',
      });
    }

    const json = (await res.json()) as { text?: string };
    const texto = String(json.text ?? '').trim();
    if (texto.length < 3) {
      throw new BadRequestException({
        codigo: 'AUDIO_SEM_FALA',
        message: 'Não encontrei fala reconhecível neste áudio.',
      });
    }

    const titulo =
      arquivo.nome.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Áudio transcrito';
    return {
      texto:
        `# ${titulo}\n\n` +
        `Transcrição automática (Whisper) do arquivo **${arquivo.nome}**.\n\n` +
        texto,
      titulo,
      origem: arquivo.nome,
    };
  }
}
