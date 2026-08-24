import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { StoreDetailRepository } from '../../../../modules/stores/domain/repositories/store-detail.repository.interface';
import type { AuthenticatedUser } from '../auth/authenticated-user';

/**
 * Libera operações store-scoped (ex.: gestão de equipe pelo ERP) para qualquer
 * membro autenticado da PRÓPRIA loja. `platform_admin` sempre passa (cobre
 * também o AUTH_DEV_BYPASS, que injeta esse role). Exige o param de rota
 * `:storeId` e o `req.user` já populado pelo AuthGuard global.
 *
 * TODO(F2): via M2M. Depois do ADR C-16 o lojista vive no realm da sua vertical,
 * então o `AuthGuard` do admin-api rejeita o token dele antes deste guard rodar
 * (issuer e `azp` de outro realm). O caminho correto passa a ser
 * `vertical-api → admin-api` autenticado como `admin-m2m`, na fase F2 do plano.
 */
@Injectable()
export class StoreMembershipGuard implements CanActivate {
  constructor(private readonly storeDetailRepository: StoreDetailRepository) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<{
      params: Record<string, string>;
      user?: AuthenticatedUser;
    }>();

    const user = req.user;
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.roles.includes('platform_admin')) {
      return true;
    }

    const storeId = req.params.storeId;
    if (!storeId) {
      throw new ForbiddenException('Loja não informada');
    }

    const member = await this.storeDetailRepository.findMemberByStoreAndSub(
      storeId,
      user.sub,
    );
    if (!member) {
      throw new ForbiddenException('Você não tem acesso a esta loja');
    }

    return true;
  }
}
