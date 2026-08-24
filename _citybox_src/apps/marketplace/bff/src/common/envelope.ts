import {
  CallHandler,
  Catch,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';

export interface PageMeta {
  page?: number;
  pageSize?: number;
  total?: number;
}

/** Marca um payload já paginado/envelopado: `return paginated(rows, meta)`. */
export function paginated<T>(data: T, meta: PageMeta) {
  return { __envelope: true as const, data, meta };
}

/**
 * Envelopa toda resposta no padrão do contrato: `{ data, meta?, errors? }`
 * (docs/openapi.yaml §Convenções). Controllers retornam o payload cru ou
 * `paginated(data, meta)`.
 */
@Injectable()
export class EnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((body) => {
        if (body === undefined) return { data: null };
        if (body && typeof body === 'object' && '__envelope' in body) {
          const { data, meta } = body as { data: unknown; meta?: PageMeta };
          return meta ? { data, meta } : { data };
        }
        return { data: body };
      }),
    );
  }
}

export class ApiError extends HttpException {
  constructor(
    status: number,
    public readonly code: string,
    message: string,
    public readonly field?: string,
  ) {
    super(message, status);
  }
}

const CODE_BY_STATUS: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  429: 'RATE_LIMITED',
};

/** Converte exceções no envelope de erro `{ data: null, errors: [...] }`. */
@Catch()
export class EnvelopeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof ApiError) {
      return res.status(exception.getStatus()).json({
        data: null,
        errors: [
          { code: exception.code, message: exception.message, field: exception.field ?? null },
        ],
      });
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const messages =
        typeof body === 'object' && body !== null && Array.isArray((body as { message?: unknown }).message)
          ? ((body as { message: string[] }).message)
          : [exception.message];
      return res.status(status).json({
        data: null,
        errors: messages.map((message) => ({
          code: CODE_BY_STATUS[status] ?? 'ERROR',
          message,
          field: null,
        })),
      });
    }
    console.error('[bff] unhandled error', exception);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      data: null,
      errors: [{ code: 'INTERNAL', message: 'Erro interno inesperado', field: null }],
    });
  }
}

export const notFound = (message: string) => new ApiError(404, 'NOT_FOUND', message);
export const badRequest = (message: string, field?: string) =>
  new ApiError(400, 'BAD_REQUEST', message, field);
export const unauthorized = (message = 'Não autenticado') =>
  new ApiError(401, 'UNAUTHORIZED', message);
export const conflict = (message: string) => new ApiError(409, 'CONFLICT', message);
