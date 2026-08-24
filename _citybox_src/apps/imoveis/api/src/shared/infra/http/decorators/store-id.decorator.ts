import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export const StoreId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const raw = req.headers['x-store-id'] ?? req.headers['X-Store-Id'];
    const storeId = Array.isArray(raw) ? raw[0] : raw;
    if (!storeId?.trim())
      throw new BadRequestException('Header X-Store-Id obrigatório');
    return storeId.trim();
  },
);
