import type { TeamMemberEntity } from '../../../../domain/entities/team-member.entity';
import { mapTeamMemberToHttp } from '../shared/team-member-response.mapper';

export class CreateTeamMemberPresenter {
  static toHttp(member: TeamMemberEntity) {
    return { data: mapTeamMemberToHttp(member) };
  }

  static toHttpWithPassword(result: {
    member: TeamMemberEntity;
    provisionalPassword: string;
  }) {
    return {
      data: {
        ...mapTeamMemberToHttp(result.member),
        provisionalPassword: result.provisionalPassword,
      },
    };
  }
}
