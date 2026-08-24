export const settingsKeys = {
  all: ['settings'] as const,
  /** Lista de equipe — SEMPRE com storeId (evita cache cruzado entre lojas / fallback). */
  users: (storeId: string) =>
    [...settingsKeys.all, 'users', storeId] as const,
  usersRoot: () => [...settingsKeys.all, 'users'] as const,
  store: (storeId: string) =>
    [...settingsKeys.all, 'store', storeId] as const,
  storeRoot: () => [...settingsKeys.all, 'store'] as const,
  billing: (storeId: string) =>
    [...settingsKeys.all, 'billing', storeId] as const,
  profiles: () => [...settingsKeys.all, 'profile'] as const,
  profile: (storeId: string, agentId: string) =>
    [...settingsKeys.profiles(), storeId, agentId] as const,
  privacy: (storeId: string, agentId: string) =>
    [...settingsKeys.all, 'privacy', storeId, agentId] as const,
  documentsRoot: (storeId: string, agentId: string) =>
    [...settingsKeys.all, 'documents', storeId, agentId] as const,
  documents: (storeId: string, agentId: string, folderId?: string) =>
    [...settingsKeys.documentsRoot(storeId, agentId), folderId ?? 'all'] as const,
  googleCalendar: () => [...settingsKeys.all, 'google-calendar'] as const,
};
