export type OrganizationRecord = {
  id: string;
  name: string;
  status: 'active' | 'suspended';
};

export type StoreRecord = {
  id: string;
  organizationId: string;
  name: string;
  status: 'active' | 'inactive';
};

export abstract class OrganizationRepository {
  abstract findById(id: string): Promise<OrganizationRecord | null>;
  abstract findByStoreId(storeId: string): Promise<OrganizationRecord | null>;
  abstract ensureForPlatformStore(input: {
    storeId: string;
    name: string;
  }): Promise<{ organization: OrganizationRecord; store: StoreRecord }>;
}

export abstract class StoreRepository {
  abstract findById(id: string): Promise<StoreRecord | null>;
}
