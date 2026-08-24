'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { loadVerticalManifest } from './registry';
import type { VerticalManifest } from './types';

type VerticalDefinitionContextValue = {
  verticalId: string;
  manifest: VerticalManifest | null;
  loading: boolean;
  loadError: string | null;
};

const VerticalDefinitionContext = createContext<VerticalDefinitionContextValue | null>(null);

export function VerticalDefinitionProvider({
  verticalId,
  children,
}: {
  verticalId: string;
  children: ReactNode;
}) {
  const [manifest, setManifest] = useState<VerticalManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    void loadVerticalManifest(verticalId).then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        setManifest(null);
        setLoadError(`Vertical "${verticalId}" não registrada.`);
      } else {
        setManifest(loaded);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [verticalId]);

  return (
    <VerticalDefinitionContext.Provider
      value={{ verticalId, manifest, loading, loadError }}
    >
      {children}
    </VerticalDefinitionContext.Provider>
  );
}

export function useVerticalManifest() {
  const ctx = useContext(VerticalDefinitionContext);
  if (!ctx) {
    throw new Error('useVerticalManifest deve ser usado dentro de VerticalDefinitionProvider');
  }
  return ctx;
}
