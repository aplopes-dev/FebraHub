import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { MulterError } from 'multer';

/** Alinhado a `InvalidImageFileError` / `InvalidDocumentFileError`. */
const IMAGE_TOO_LARGE = 'Imagem deve ter no máximo 4 MB';
const DOCUMENT_TOO_LARGE = 'Documento deve ter no máximo 15 MB';

/**
 * Multer rejeita o upload **antes** dos validators de domínio — a mensagem padrão
 * é `"File too large"`. Converte para envelope e texto iguais aos DomainError.
 */
@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      const message = fileTooLargeMessage(requestPath(request));
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        error: {
          code: 'FileTooLarge',
          message,
        },
      });
      return;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      error: {
        code: 'UploadError',
        message: 'Falha no envio do arquivo',
      },
    });
  }
}

function requestPath(request: Request): string {
  const base = request.originalUrl ?? request.url ?? request.path ?? '';
  return base.split('?')[0] ?? '';
}

/** Exposto para testes — mapeia rota multipart → limite do FileInterceptor. */
export function fileTooLargeMessage(path: string): string {
  const normalized = path.toLowerCase();
  const isImageUpload =
    normalized.includes('/photo') ||
    normalized.includes('/photos') ||
    normalized.endsWith('/logo') ||
    normalized.includes('/logo/');

  return isImageUpload ? IMAGE_TOO_LARGE : DOCUMENT_TOO_LARGE;
}
