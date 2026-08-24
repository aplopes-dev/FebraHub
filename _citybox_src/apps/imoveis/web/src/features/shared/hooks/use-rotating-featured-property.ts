'use client';

import { useEffect, useMemo, useState } from 'react';
import { PROPERTY_TYPE_LABEL } from '@/features/shared/types';
import { usePropertiesQuery } from '@/features/properties/hooks/use-properties-queries';
import type { PropertyListing } from '@/features/properties/types';
import { useSessionAgentScope } from '@/features/shared/session/hooks/use-session-agent-scope';

/** Máximo de diferenciais exibidos nos cards de recomendação. */
export const FEATURED_HIGHLIGHTS_LIMIT = 4;

export type RotatingFeaturedProperty = {
  id: string;
  name: string;
  typeLabel: string;
  /** Até 4 diferenciais do imóvel (`highlights`). */
  highlights: readonly string[];
  recommendedToLeads: number;
  photoUrl?: string;
};

const ROTATE_MS = 20_000;

function normalizeHighlights(
  highlights: readonly string[] | undefined,
): readonly string[] {
  return (highlights ?? [])
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, FEATURED_HIGHLIGHTS_LIMIT);
}

function toFeatured(property: PropertyListing): RotatingFeaturedProperty {
  return {
    id: property.id,
    name: property.name,
    typeLabel: PROPERTY_TYPE_LABEL[property.type],
    highlights: normalizeHighlights(property.highlights),
    recommendedToLeads: property.totalActiveLeads ?? 0,
    photoUrl: property.photoUrls[0],
  };
}

export type RotatingFeaturedResult = {
  property: RotatingFeaturedProperty | null;
  index: number;
  total: number;
  goNext: () => void;
  goPrev: () => void;
};

/**
 * Cicla entre imóveis `available` do corretor da sessão (carteira própria).
 */
export function useRotatingFeaturedProperty(
  intervalMs: number = ROTATE_MS,
): RotatingFeaturedResult {
  const { agentId, ready } = useSessionAgentScope();
  const listFilter = agentId ? { agentId } : ({} as { agentId?: string });

  const { data: availableResult } = usePropertiesQuery(
    {
      page: 1,
      perPage: 50,
      status: ['available'],
      ...listFilter,
    },
    ready,
  );
  const { data: fallbackResult } = usePropertiesQuery(
    { page: 1, perPage: 12, ...listFilter },
    ready && (availableResult?.data.length ?? 0) === 0,
  );

  const pool = useMemo(() => {
    const available = availableResult?.data ?? [];
    const source =
      available.length > 0 ? available : (fallbackResult?.data ?? []);
    return source.map(toFeatured);
  }, [availableResult?.data, fallbackResult?.data]);

  const [index, setIndex] = useState(0);
  const total = pool.length;
  const safeIndex = total === 0 ? 0 : ((index % total) + total) % total;

  useEffect(() => {
    if (total <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => current + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [total, intervalMs]);

  return {
    property: total === 0 ? null : (pool[safeIndex] ?? null),
    index: safeIndex,
    total,
    goNext: () => setIndex((current) => current + 1),
    goPrev: () => setIndex((current) => current - 1),
  };
}
