import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { LastAdminForbiddenError } from '../../../domain/errors/last-admin-forbidden.error';
import { TeamMemberNotFoundError } from '../../../domain/errors/team-member-not-found.error';
import { TeamMemberRepository } from '../../../domain/repositories/team-member.repository.interface';

export type DeleteTeamMemberInput = {
  storeId: string;
  agentId: string;
};

/**
 * Remove o vínculo de equipe da loja Imóveis.
 *
 * **Não toca na identidade.** Antes, quando o `sub` deixava de ter equipe em
 * qualquer loja, o caso de uso removia a role `vertical.imoveis.view`. Com um
 * realm por sistema (ADR C-16) essa role não existe mais, e desabilitar a conta
 * bloquearia o login inteiro (mensagem *Conta desativada…*) de alguém que ainda
 * pode ser membro de **outra loja** Imóveis. Autorização Imóveis = presença de
 * `TeamMember` + `ImoveisScopeGuard`.
 */
@Injectable()
export class DeleteTeamMemberUseCase implements IUseCase<
  DeleteTeamMemberInput,
  void
> {
  constructor(private readonly members: TeamMemberRepository) {}

  async execute(input: DeleteTeamMemberInput): Promise<void> {
    const existing = await this.members.findByAgentId(
      input.storeId,
      input.agentId,
    );
    if (!existing) {
      throw new TeamMemberNotFoundError(
        DeleteTeamMemberUseCase.name,
        input.agentId,
      );
    }

    if (existing.role === 'admin' && existing.active) {
      const all = await this.members.findAll(input.storeId);
      const admins = all.filter(
        (member) => member.role === 'admin' && member.active,
      );
      if (admins.length <= 1) {
        throw new LastAdminForbiddenError(
          DeleteTeamMemberUseCase.name,
          input.agentId,
        );
      }
    }

    await this.members.delete(input.storeId, input.agentId);
  }
}
