import { Injectable } from '@nestjs/common';
import { TeamMemberRepository } from '../../../settings/domain/repositories/team-member.repository.interface';
import { StoreSettingsRepository } from '../../../settings/domain/repositories/store-settings.repository.interface';
import { effectiveImoveisPermissions } from '../../../settings/domain/resolve-imoveis-permissions';

export type MyAccessStore = {
  storeId: string;
  storeName: string;
  role: string;
  permissions: string[];
  /** Slug do corretor nesta loja (catálogo público e perfil). */
  agentId: string;
  memberId: string;
};

export type MyAccessResult = {
  member: {
    id: string;
    agentId: string;
    username: string | null;
    name: string;
    email: string;
    status: 'active' | 'disabled';
    isOrganizationOwner: boolean;
  } | null;
  stores: MyAccessStore[];
};

@Injectable()
export class GetMyAccessUseCase {
  constructor(
    private readonly teamMembers: TeamMemberRepository,
    private readonly storeSettings: StoreSettingsRepository,
  ) {}

  async execute(
    keycloakSub: string,
    email?: string | null,
  ): Promise<MyAccessResult> {
    let memberships = await this.teamMembers.findByKeycloakSub(keycloakSub);

    if (memberships.length === 0 && email) {
      const pending = await this.teamMembers.findByEmailInsensitive(email);
      for (const member of pending) {
        if (!member.keycloakSub) {
          const username =
            email.split('@')[0]?.trim().toLowerCase() ?? keycloakSub;
          const linked = await this.teamMembers.linkKeycloakSub(member.id, {
            keycloakSub,
            username,
          });
          if (linked) memberships = [...memberships, linked];
        }
      }
    }

    if (memberships.length === 0) {
      return { member: null, stores: [] };
    }

    const primary = memberships[0];
    if (primary.active && !primary.hasPassword) {
      await this.teamMembers.markPasswordSet(primary.id);
    }

    const stores: MyAccessStore[] = [];
    for (const member of memberships) {
      if (!member.active) continue;
      const settings = await this.storeSettings.findByStoreId(member.storeId);
      stores.push({
        storeId: member.storeId,
        storeName: settings?.system.companyName?.trim() || member.storeId,
        role: member.role,
        permissions: effectiveImoveisPermissions(member.permissions),
        agentId: member.agentId,
        memberId: member.id,
      });
    }

    return {
      member: {
        id: primary.id,
        agentId: primary.agentId,
        username: primary.username,
        name: primary.name,
        email: primary.email,
        status: primary.active ? 'active' : 'disabled',
        isOrganizationOwner: primary.role === 'admin',
      },
      stores,
    };
  }
}
