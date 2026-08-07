import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Toda exceção sai daqui com o mesmo formato e sem vazar o que é interno.
 *
 * Em produção o cliente recebe mensagem e código; stack, SQL e nome de coluna
 * ficam no log. Um 500 que devolve "column perfis.senha_hash does not exist"
 * entrega o schema para quem estiver sondando.
 */
@Catch()
export class ExcecaoGlobalFilter implements ExceptionFilter {
  private readonly logger = new Logger('Excecao');

  constructor(private readonly producao: boolean) {}

  catch(excecao: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const resposta = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensagem: string | string[] = 'Erro interno';
    let codigo = 'ERRO_INTERNO';

    if (excecao instanceof HttpException) {
      status = excecao.getStatus();
      const corpo = excecao.getResponse();
      if (typeof corpo === 'string') {
        mensagem = corpo;
      } else if (corpo && typeof corpo === 'object') {
        const c = corpo as Record<string, unknown>;
        mensagem = (c.message as string | string[]) ?? excecao.message;
        codigo = (c.codigo as string) ?? `HTTP_${status}`;
      }
      if (codigo === 'ERRO_INTERNO') codigo = `HTTP_${status}`;
    } else if (excecao instanceof Prisma.PrismaClientKnownRequestError) {
      // Traduzimos só o que o cliente pode agir; o resto vira 500 genérico.
      switch (excecao.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          mensagem = 'Registro já existe';
          codigo = 'DUPLICADO';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          mensagem = 'Registro não encontrado';
          codigo = 'NAO_ENCONTRADO';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          mensagem = 'Referência inválida';
          codigo = 'FK_INVALIDA';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          mensagem = 'Erro ao acessar dados';
          codigo = 'ERRO_BANCO';
      }
    } else if (excecao instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      mensagem = 'Consulta inválida';
      codigo = 'CONSULTA_INVALIDA';
    }

    const detalhe = excecao instanceof Error ? excecao.stack : String(excecao);
    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} -> ${status}: ${detalhe}`);
    } else {
      this.logger.warn(`${req.method} ${req.url} -> ${status}: ${String(mensagem)}`);
    }

    void resposta.status(status).send({
      erro: true,
      codigo,
      mensagem,
      caminho: req.url,
      timestamp: new Date().toISOString(),
      ...(this.producao ? {} : { detalhe }),
    });
  }
}
