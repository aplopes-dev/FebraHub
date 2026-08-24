'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Tab, Tabs } from '@citybox/mui/atoms';
import { AccessDeniedPanel } from '@/components/layout/permission-gate';
import { Panel } from '@/components/ui/panel';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import { useSessionPermissions } from '../hooks/use-session-permissions';
import { useAgentProfileQuery } from '../hooks/use-settings-queries';
import {
  PROFILE_TAB_LABEL,
  SETTINGS_SECTION_LABEL,
  type ProfileTab,
  type SettingsSection,
} from '../types';
import { SettingsDeleteAccountPanel } from './settings-delete-account-panel';
import { SettingsDocumentsTab } from './settings-documents-tab';
import { SettingsNotificationsPanel } from './settings-notifications-panel';
import { SettingsPrivacyPanel } from './settings-privacy-panel';
import { SettingsProfileClientsTab } from './settings-profile-clients-tab';
import { SettingsProfileHeader } from './settings-profile-header';
import { SettingsProfileInfoTab } from './settings-profile-info-tab';
import { SettingsProfilePropertiesTab } from './settings-profile-properties-tab';
import {
  SETTINGS_SIDEBAR_WIDTH,
  SettingsSidebar,
} from './settings-sidebar';
import { SettingsBillingPanel } from './settings-billing-panel';
import { SettingsSystemPanel } from './settings-system-panel';
import { SettingsUsersPanel } from './settings-users-panel';

const SETTINGS_SECTIONS = Object.keys(
  SETTINGS_SECTION_LABEL,
) as SettingsSection[];

function parseSectionParam(value: string | null): SettingsSection | null {
  if (!value) return null;
  return SETTINGS_SECTIONS.includes(value as SettingsSection)
    ? (value as SettingsSection)
    : null;
}

export function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canSettings, accessibleSettingsSections, accessibleProfileTabs } =
    useSessionPermissions();
  const sectionFromUrl = parseSectionParam(searchParams.get('section'));
  const [section, setSectionState] = useState<SettingsSection>(
    () => sectionFromUrl ?? 'profile',
  );
  const [profileTab, setProfileTab] = useState<ProfileTab>('info');
  const agentId = useCurrentAgentId();
  const { data: profile, dataUpdatedAt } = useAgentProfileQuery(agentId);

  const setSection = useCallback(
    (next: SettingsSection) => {
      setSectionState(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'profile') {
        params.delete('section');
      } else {
        params.set('section', next);
      }
      const qs = params.toString();
      router.replace(qs ? `/settings?${qs}` : '/settings', { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (!sectionFromUrl) return;
    if (accessibleSettingsSections.includes(sectionFromUrl)) {
      setSectionState(sectionFromUrl);
    }
  }, [sectionFromUrl, accessibleSettingsSections]);

  useEffect(() => {
    if (accessibleSettingsSections.length === 0) return;
    if (!accessibleSettingsSections.includes(section)) {
      setSection(accessibleSettingsSections[0]);
    }
  }, [accessibleSettingsSections, section, setSection]);

  useEffect(() => {
    if (accessibleProfileTabs.length === 0) return;
    if (!accessibleProfileTabs.includes(profileTab)) {
      setProfileTab(accessibleProfileTabs[0]);
    }
  }, [accessibleProfileTabs, profileTab]);

  const visibleProfileTabs = accessibleProfileTabs;

  if (accessibleSettingsSections.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          minHeight: 0,
          flex: 1,
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <header>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Configurações
          </h1>
        </header>
        <AccessDeniedPanel
          title="Configurações indisponíveis"
          description="Seu usuário não tem permissão para nenhuma seção de configurações."
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        gap: 2,
      }}
    >
      <Box component="header" sx={{ flexShrink: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {accessibleSettingsSections.length <= 2
            ? 'Atualize seus dados pessoais e senha de acesso.'
            : 'Perfil do corretor, documentos e preferências da conta.'}
        </p>
      </Box>

      {/*
        sm+: menu lateral. xs: chips horizontais (fade + seta se houver mais itens).
        Scroll vertical só no <main> da DashboardShell.
      */}
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, sm: 2 },
          alignItems: 'start',
          gridTemplateColumns: {
            xs: '1fr',
            sm: `${SETTINGS_SIDEBAR_WIDTH.sm}px minmax(0, 1fr)`,
            md: `${SETTINGS_SIDEBAR_WIDTH.md}px minmax(0, 1fr)`,
            xl: `${SETTINGS_SIDEBAR_WIDTH.xl}px minmax(0, 1fr)`,
          },
        }}
      >
        <SettingsSidebar active={section} onChange={setSection} />

        <Box
          sx={{
            minWidth: 0,
            maxWidth: '100%',
            overflowX: 'hidden',
            overflowY: 'visible',
          }}
        >
          {section === 'profile' && canSettings('profile') ? (
            <Panel
              sx={{
                display: 'flex',
                minWidth: 0,
                maxWidth: '100%',
                flexDirection: 'column',
                gap: 2.5,
                overflowX: 'hidden',
                overflowY: 'visible',
              }}
            >
              <div className="relative min-w-0">
                <Tabs
                  value={profileTab}
                  onChange={(_, value) => setProfileTab(value as ProfileTab)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  aria-label="Abas do perfil"
                  sx={{
                    minHeight: 40,
                    '& .MuiTabs-scroller': {
                      overflowX: 'auto',
                      overflowY: 'hidden',
                      scrollbarWidth: 'none',
                      '&::-webkit-scrollbar': { display: 'none' },
                    },
                    '& .MuiTabs-scrollButtons': {
                      width: 32,
                      flexShrink: 0,
                      color: 'text.secondary',
                      '&.Mui-disabled': { opacity: 0 },
                    },
                    '& .MuiTabs-indicator': { height: 2, bgcolor: 'primary.main' },
                    '& .MuiTab-root': {
                      minHeight: 40,
                      px: 0,
                      mr: 3,
                      pb: 1,
                      minWidth: 'auto',
                      textTransform: 'none',
                      fontSize: '0.875rem',
                    },
                  }}
                >
                  {visibleProfileTabs.map((tab) => (
                    <Tab key={tab} value={tab} label={PROFILE_TAB_LABEL[tab]} />
                  ))}
                </Tabs>
              </div>

              {profileTab === 'info' ? (
                <SettingsProfileInfoTab agentId={agentId} />
              ) : null}

              {profileTab === 'properties' ? (
                <div className="min-w-0 max-w-full space-y-4 overflow-hidden">
                  {profile ? (
                    <SettingsProfileHeader
                      profile={profile}
                      photoRevision={dataUpdatedAt}
                    />
                  ) : null}
                  <SettingsProfilePropertiesTab agentId={agentId} />
                </div>
              ) : null}

              {profileTab === 'clients' ? (
                <div className="min-w-0 max-w-full space-y-4 overflow-hidden">
                  {profile ? (
                    <SettingsProfileHeader
                      profile={profile}
                      photoRevision={dataUpdatedAt}
                    />
                  ) : null}
                  <SettingsProfileClientsTab agentId={agentId} />
                </div>
              ) : null}

              {profileTab === 'documents' ? (
                <SettingsDocumentsTab agentId={agentId} />
              ) : null}
            </Panel>
          ) : null}

          {section === 'privacy' && canSettings('privacy') ? (
            <SettingsPrivacyPanel agentId={agentId} />
          ) : null}
          {section === 'notifications' && canSettings('notifications') ? (
            <SettingsNotificationsPanel />
          ) : null}
          {section === 'users' && canSettings('users') ? <SettingsUsersPanel /> : null}
          {section === 'system' && canSettings('system') ? <SettingsSystemPanel /> : null}
          {section === 'delete-account' && canSettings('delete-account') ? (
            <SettingsDeleteAccountPanel agentId={agentId} />
          ) : null}
          {section === 'billing' && canSettings('billing') ? (
            <SettingsBillingPanel />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

/** Exposto para depurar labels se necessário. */
export { SETTINGS_SECTION_LABEL };
