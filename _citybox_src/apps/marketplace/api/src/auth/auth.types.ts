export type AuthUser = {
  sub: string;
  roles: string[];
  storeId?: string;
  kind: 'user' | 'device';
  name?: string;
  email?: string;
};

export type AuthMeResponse = {
  sub: string;
  name: string;
  email: string | null;
  roles: string[];
  permissions: string[];
  storeId?: string;
  kind: 'user' | 'device';
  hasPhoto: boolean;
  updatedAt: string | null;
};
