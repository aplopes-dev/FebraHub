export type GlobalSearchHitType =
  | 'nav'
  | 'page'
  | 'patient'
  | 'opportunity'
  | 'appointment'
  | 'stock';

export type GlobalSearchHit = {
  id: string;
  type: GlobalSearchHitType;
  title: string;
  subtitle?: string;
  href: string;
  keywords?: string[];
};

export type GlobalSearchGroup = {
  heading: string;
  hits: readonly GlobalSearchHit[];
};

export type GlobalSearchResult = {
  groups: readonly GlobalSearchGroup[];
};
