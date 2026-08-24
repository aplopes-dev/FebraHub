import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthUser } from '../auth/auth.types.js';

type Bucket = { count: number; resetAt: number };

/** Limite in-memory por usuário em rotas sensíveis de perfil (senha). */
@Injectable()
export class ProfileRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private readonly maxAttempts = Number(process.env.PROFILE_RATE_LIMIT_MAX ?? 5);
  private readonly windowMs = Number(process.env.PROFILE_RATE_LIMIT_WINDOW_MS ?? 15 * 60_000);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const user = req.user;
    if (!user?.sub) return true;

    const body = req.body as { password?: string; currentPassword?: string } | undefined;
    if (!body?.password && !body?.currentPassword) return true;

    const key = `profile:${user.sub}`;
    const now = Date.now();
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (bucket.count >= this.maxAttempts) {
      throw new HttpException(
        'Muitas tentativas de alteração de senha. Aguarde alguns minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    bucket.count += 1;
    return true;
  }
}
