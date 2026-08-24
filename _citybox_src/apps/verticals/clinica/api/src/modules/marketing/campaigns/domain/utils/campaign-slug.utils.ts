export function slugifyCampaignName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

export function buildCampaignPublicUrl(storeId: string, slug: string): string {
  return `/campanha/${storeId}/${slug}`;
}
