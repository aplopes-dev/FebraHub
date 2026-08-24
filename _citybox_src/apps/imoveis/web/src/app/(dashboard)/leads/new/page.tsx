import type { Metadata } from 'next';
import { LeadFormPage } from '@/features/leads/components/lead-form-page';
import type { LeadSource, MatchedProperty } from '@/features/leads/types';
import type { PropertyType } from '@/features/shared/types';
import {
  ImoveisServerApiError,
  imoveisServerFetch,
} from '@/lib/imoveis-api-server';

export const metadata: Metadata = {
  title: 'Adicionar lead',
};

type PageProps = {
  searchParams: Promise<{
    propertyId?: string;
    name?: string;
    phone?: string;
    /** Ex.: `whatsapp` — banner `/p/:id?action=new-lead`. */
    source?: string;
  }>;
};

type PropertySeedHttp = {
  id: string;
  name: string;
  type: PropertyType;
  photoUrls?: readonly string[];
};

function resolveLeadSourcePrefill(raw?: string): LeadSource | undefined {
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'whatsapp') return 'whatsapp';
  return undefined;
}

async function loadMatchedProperty(
  propertyId: string,
): Promise<{
  matched: MatchedProperty;
  interestedPropertyType: PropertyType;
} | null> {
  try {
    const res = await imoveisServerFetch<{ data: PropertySeedHttp }>(
      `/v1/properties/${encodeURIComponent(propertyId)}`,
    );
    return {
      matched: {
        id: res.data.id,
        name: res.data.name,
        coverPhotoUrl: res.data.photoUrls?.[0],
      },
      interestedPropertyType: res.data.type,
    };
  } catch (error) {
    if (error instanceof ImoveisServerApiError && error.status === 404) {
      return null;
    }
    return null;
  }
}

export default async function Page({ searchParams }: PageProps) {
  const {
    propertyId: rawId,
    name: rawName,
    phone: rawPhone,
    source: rawSource,
  } = await searchParams;

  const propertyId = rawId?.trim();
  const name = rawName?.trim() ?? '';
  const phone = rawPhone?.trim() ?? '';
  const leadSource = resolveLeadSourcePrefill(rawSource);

  const seed = propertyId ? await loadMatchedProperty(propertyId) : null;
  const hasUrlPrefill = Boolean(propertyId || name || phone || leadSource);

  return (
    <LeadFormPage
      mode="create"
      createPrefill={
        hasUrlPrefill
          ? {
              name: name || undefined,
              phone: phone || undefined,
              matchedProperties: seed?.matched ? [seed.matched] : undefined,
              interestedPropertyType: seed?.interestedPropertyType,
              leadSource,
              assignCurrentAgent: true,
              focusClientName: true,
            }
          : undefined
      }
    />
  );
}
