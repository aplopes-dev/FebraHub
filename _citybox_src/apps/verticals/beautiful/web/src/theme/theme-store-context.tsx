'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { readSavedActiveStore } from '@/lib/active-store-storage';
import { setActiveStoreId } from '@/lib/beautiful-api';
import { useStore } from '@/lib/store-context';
import { updateStoreTheme } from '@/features/settings/services/settings-service';
import {
  STORE_SETTINGS_QUERY_KEY,
  useStoreSettingsQuery,
} from '@/features/settings/hooks/use-settings-queries';
import {
  DEFAULT_THEME_PRESET_ID,
  resolveThemePreset,
  type ThemePreset,
  type ThemePresetId,
  isThemePresetId,
} from './theme-presets';

const THEME_STORAGE_PREFIX = 'citybox:beautiful:themeId:';

export function themeStorageKey(storeId: string): string {
  return `${THEME_STORAGE_PREFIX}${storeId}`;
}

function readStoredThemeId(storeId: string): ThemePresetId {
  if (!storeId || typeof window === 'undefined') {
    return DEFAULT_THEME_PRESET_ID;
  }
  try {
    const raw = localStorage.getItem(themeStorageKey(storeId));
    return isThemePresetId(raw) ? raw : DEFAULT_THEME_PRESET_ID;
  } catch {
    return DEFAULT_THEME_PRESET_ID;
  }
}

function persistThemeId(storeId: string, themeId: ThemePresetId) {
  if (!storeId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(themeStorageKey(storeId), themeId);
  } catch {
    // ignore quota / private mode
  }
}

function getInitialThemeId(): ThemePresetId {
  const savedStoreId = readSavedActiveStore()?.id ?? '';
  return readStoredThemeId(savedStoreId);
}

type StoreThemeContextValue = {
  themeId: ThemePresetId;
  currentPreset: ThemePreset;
  selectTheme: (themeId: ThemePresetId) => void;
  isSaving: boolean;
};

const StoreThemeContext = createContext<StoreThemeContextValue | null>(null);

export function StoreThemeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { storeId } = useStore();
  const [themeId, setThemeId] = useState<ThemePresetId>(getInitialThemeId);

  useEffect(() => {
    if (storeId) setActiveStoreId(storeId);
    setThemeId(readStoredThemeId(storeId));
  }, [storeId]);

  const settingsQuery = useStoreSettingsQuery();

  const mutation = useMutation({
    mutationFn: updateStoreTheme,
    onMutate: async (nextThemeId) => {
      await queryClient.cancelQueries({ queryKey: STORE_SETTINGS_QUERY_KEY });
      const key = [...STORE_SETTINGS_QUERY_KEY, storeId];
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (current: { themeId?: string } | undefined) =>
        current ? { ...current, themeId: nextThemeId } : current,
      );
      return { previous, key };
    },
    onError: (_error, _themeId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(
        [...STORE_SETTINGS_QUERY_KEY, storeId],
        settings,
      );
    },
  });

  useEffect(() => {
    if (mutation.isPending) return;
    const remoteThemeId = settingsQuery.data?.themeId;
    if (!isThemePresetId(remoteThemeId)) return;
    setThemeId(remoteThemeId);
    persistThemeId(storeId, remoteThemeId);
  }, [mutation.isPending, settingsQuery.data?.themeId, storeId]);

  const persistTheme = mutation.mutate;

  const selectTheme = useCallback(
    (nextThemeId: ThemePresetId) => {
      setThemeId(nextThemeId);
      persistThemeId(storeId, nextThemeId);
      if (storeId) {
        persistTheme(nextThemeId);
      }
    },
    [persistTheme, storeId],
  );

  const currentPreset = useMemo(
    () => resolveThemePreset(themeId),
    [themeId],
  );

  const value = useMemo(
    () => ({
      themeId,
      currentPreset,
      selectTheme,
      isSaving: mutation.isPending,
    }),
    [currentPreset, mutation.isPending, selectTheme, themeId],
  );

  return (
    <StoreThemeContext.Provider value={value}>
      {children}
    </StoreThemeContext.Provider>
  );
}

export function useStoreTheme() {
  const ctx = useContext(StoreThemeContext);
  if (!ctx) {
    throw new Error('useStoreTheme must be used within StoreThemeProvider');
  }
  return ctx;
}
