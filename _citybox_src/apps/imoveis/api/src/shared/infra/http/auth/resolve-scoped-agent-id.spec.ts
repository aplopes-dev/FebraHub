import type { PermissionUser } from '../decorators/permissions';
import { isPlatformAdmin } from '../decorators/permissions';
import type { ImoveisScope } from '../guards/imoveis-scope.guard';
import {
  canAccessAgentResource,
  isStoreWideViewer,
  MISSING_AGENT_SCOPE,
  resolveLeadAgentsForWrite,
  resolveScopedAgentId,
  resolveWritableAgentId,
  STORE_WIDE_AGENT_FILTER,
} from './resolve-scoped-agent-id';

describe('resolveScopedAgentId', () => {
  const scope: ImoveisScope = {
    storeId: 'store-1',
    memberId: 'm1',
    agentId: 'ana-helena',
    role: 'broker',
    permissions: ['leads', 'properties'],
  };

  const broker: PermissionUser = {
    roles: [],
    permissions: ['leads'],
    isOrganizationOwner: false,
  };

  const admin: PermissionUser = {
    roles: [],
    permissions: [],
    isOrganizationOwner: true,
  };

  it('forces broker to own agentId even if another is requested', () => {
    expect(
      resolveScopedAgentId({
        user: broker,
        scope,
        requestedAgentId: 'bruno-costa',
      }),
    ).toBe('ana-helena');
  });

  it('store-wide without requested filter returns own agentId', () => {
    expect(
      resolveScopedAgentId({
        user: admin,
        scope: { ...scope, role: 'admin', agentId: 'admin-citybox' },
      }),
    ).toBe('admin-citybox');
  });

  it('store-wide without agentId does not open full store (sentinel)', () => {
    expect(
      resolveScopedAgentId({
        user: admin,
        scope: { ...scope, role: 'admin', agentId: '' },
      }),
    ).toBe(MISSING_AGENT_SCOPE);
  });

  it('broker without agentId does not open full store (sentinel)', () => {
    expect(
      resolveScopedAgentId({
        user: broker,
        scope: { ...scope, agentId: '' },
      }),
    ).toBe(MISSING_AGENT_SCOPE);
  });

  it('store-wide can filter a colleague', () => {
    expect(
      resolveScopedAgentId({
        user: admin,
        scope: { ...scope, role: 'admin', agentId: 'admin-citybox' },
        requestedAgentId: 'bruno-costa',
      }),
    ).toBe('bruno-costa');
  });

  it('store-wide agentId=all unlocks full store view', () => {
    expect(
      resolveScopedAgentId({
        user: admin,
        scope: { ...scope, role: 'admin', agentId: 'admin-citybox' },
        requestedAgentId: STORE_WIDE_AGENT_FILTER,
      }),
    ).toBeUndefined();
  });

  it('platform admin is store-wide', () => {
    const platform: PermissionUser = {
      roles: ['platform.admin'],
      permissions: [],
    };
    expect(isPlatformAdmin(platform)).toBe(true);
    expect(isStoreWideViewer(platform, undefined)).toBe(true);
  });
});

describe('resolveWritableAgentId', () => {
  const scope: ImoveisScope = {
    storeId: 'store-1',
    memberId: 'm1',
    agentId: 'admin-citybox',
    role: 'admin',
    permissions: [],
  };

  const admin: PermissionUser = {
    roles: [],
    permissions: [],
    isOrganizationOwner: true,
  };

  const broker: PermissionUser = {
    roles: [],
    permissions: ['properties'],
    isOrganizationOwner: false,
  };

  it('forces broker to scope agentId', () => {
    expect(
      resolveWritableAgentId({
        user: broker,
        scope: { ...scope, role: 'broker', agentId: 'lojista-citybox' },
        requestedAgentId: 'ana-helena',
      }),
    ).toBe('lojista-citybox');
  });

  it('admin honra agentId do body (mantém dono no edit)', () => {
    expect(
      resolveWritableAgentId({
        user: admin,
        scope,
        requestedAgentId: 'ana-helena',
      }),
    ).toBe('ana-helena');
  });

  it('admin usa sessão quando body omite agentId', () => {
    expect(
      resolveWritableAgentId({
        user: admin,
        scope,
        requestedAgentId: null,
      }),
    ).toBe('admin-citybox');
  });

  it('admin uses requested when scope has no agentId', () => {
    expect(
      resolveWritableAgentId({
        user: admin,
        scope: { ...scope, agentId: '' },
        requestedAgentId: 'lojista-citybox',
      }),
    ).toBe('lojista-citybox');
  });
});

describe('resolveLeadAgentsForWrite', () => {
  const brokerScope: ImoveisScope = {
    storeId: 's',
    memberId: 'm',
    agentId: 'broker-1',
    role: 'broker',
    permissions: ['leads'],
  };
  const broker: PermissionUser = {
    roles: [],
    permissions: ['leads'],
    isOrganizationOwner: false,
  };
  const admin: PermissionUser = {
    roles: [],
    permissions: [],
    isOrganizationOwner: true,
  };

  it('corretor só pode designar a si', () => {
    expect(
      resolveLeadAgentsForWrite({
        user: broker,
        scope: brokerScope,
        requestedAgentId: 'outro',
        requestedAgentIds: ['outro', 'terceiro'],
      }),
    ).toEqual({ agentId: 'broker-1', agentIds: ['broker-1'] });
  });

  it('admin pode designar vários e usa body', () => {
    expect(
      resolveLeadAgentsForWrite({
        user: admin,
        scope: { ...brokerScope, role: 'admin', agentId: 'admin-1' },
        requestedAgentIds: ['b1', 'b2'],
      }),
    ).toEqual({ agentId: 'b1', agentIds: ['b1', 'b2'] });
  });
});

describe('canAccessAgentResource', () => {
  const broker: PermissionUser = {
    roles: [],
    permissions: ['leads'],
    isOrganizationOwner: false,
  };
  const scope: ImoveisScope = {
    storeId: 's',
    memberId: 'm',
    agentId: 'broker-1',
    role: 'broker',
    permissions: ['leads'],
  };

  it('corretor só acessa o que é dele', () => {
    expect(
      canAccessAgentResource({
        user: broker,
        scope,
        resourceAgentId: 'broker-1',
      }),
    ).toBe(true);
    expect(
      canAccessAgentResource({
        user: broker,
        scope,
        resourceAgentId: 'outro',
      }),
    ).toBe(false);
    expect(
      canAccessAgentResource({
        user: broker,
        scope,
        resourceAgentIds: ['outro', 'broker-1'],
      }),
    ).toBe(true);
  });
});
