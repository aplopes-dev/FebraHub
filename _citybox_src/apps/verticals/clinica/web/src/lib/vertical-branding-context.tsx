'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { applyVerticalTheme, clearVerticalTheme } from '@/lib/vertical/apply-vertical-theme';
import { getVerticalDefinition } from '@/lib/vertical/registry';
import { useVerticalManifest } from '@/lib/vertical/vertical-definition-context';
import type { VerticalStoreBrandingSettings } from '@/lib/vertical/types';
import { useSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';

export function applyStoreBranding(theme: string, accent: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.brandAccent = accent;
}

type VerticalBrandingContextValue = {
  verticalId: string;
  settings: VerticalStoreBrandingSettings | null;
  logoUrl: string | null;
  displayName: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  applyFromSettings: (settings: VerticalStoreBrandingSettings) => void;
  notifyLogoUpdated: () => Promise<void>;
};

const VerticalBrandingContext = createContext<VerticalBrandingContextValue | null>(null);

export function VerticalBrandingProvider({
  verticalId,
  children,
}: {
  verticalId: string;
  children: ReactNode;
}) {
  const { manifest, loading: manifestLoading } = useVerticalManifest();
  const definition = manifest ?? getVerticalDefinition(verticalId);
  const { status } = useSession();
  const { storeId, storeName, patchStore } = useStore();
  const [settings, setSettings] = useState<VerticalStoreBrandingSettings | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLogo = useCallback(
    async (hasLogo: boolean) => {
      const services = definition?.services;
      if (!storeId || !hasLogo || !definition?.usesStoreBrandingApi || !services) {
        setLogoUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return null;
        });
        return;
      }
      try {
        const url = await services.fetchStoreLogoBlob(storeId);
        setLogoUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return url;
        });
      } catch {
        setLogoUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return null;
        });
      }
    },
    [definition?.services, definition?.usesStoreBrandingApi, storeId],
  );

  const applyFromSettings = useCallback((data: VerticalStoreBrandingSettings) => {
    setSettings(data);
    applyStoreBranding(data.theme, data.brandAccent);
  }, []);

  const refresh = useCallback(async () => {
    if (!storeId) {
      setSettings(null);
      setLogoUrl(null);
      setLoading(false);
      return;
    }

    const services = definition?.services;
    if (!definition?.usesStoreBrandingApi || !services) {
      setSettings(null);
      setLogoUrl(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await services.fetchStoreSettings(storeId);
      applyFromSettings(data);
      const label = data.displayName?.trim();
      if (label && label !== storeName) patchStore(storeId, { name: label });
      await loadLogo(data.hasLogo);
    } catch {
      setSettings(null);
      setLogoUrl(null);
    } finally {
      setLoading(false);
    }
  }, [applyFromSettings, definition, loadLogo, patchStore, storeId, storeName]);

  const notifyLogoUpdated = useCallback(async () => {
    const services = definition?.services;
    if (!storeId || !definition?.usesStoreBrandingApi || !services) return;
    try {
      const data = await services.fetchStoreSettings(storeId);
      setSettings(data);
      await loadLogo(data.hasLogo);
    } catch {
      /* ignore */
    }
  }, [definition?.usesStoreBrandingApi, definition?.services, loadLogo, storeId]);

  useEffect(() => {
    if (status === 'loading' || manifestLoading) return;
    void refresh();
  }, [manifestLoading, refresh, status]);

  useEffect(() => {
    const theme = definition?.theme;
    if (!theme) return;

    applyVerticalTheme(verticalId, theme);
    return () => clearVerticalTheme();
  }, [definition?.theme, verticalId]);

  const displayName = definition?.usesStoreBrandingApi
    ? (settings?.displayName ?? null)
    : (storeName ?? definition?.brand.shortName ?? null);

  return (
    <VerticalBrandingContext.Provider
      value={{
        verticalId,
        settings,
        logoUrl,
        displayName,
        loading,
        refresh,
        applyFromSettings,
        notifyLogoUpdated,
      }}
    >
      {children}
    </VerticalBrandingContext.Provider>
  );
}

export function useVerticalBranding() {
  const ctx = useContext(VerticalBrandingContext);
  if (!ctx) {
    throw new Error('useVerticalBranding deve ser usado dentro de VerticalBrandingProvider');
  }
  return ctx;
}
