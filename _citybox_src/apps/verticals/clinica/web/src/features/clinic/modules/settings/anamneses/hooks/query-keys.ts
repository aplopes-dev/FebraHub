export const anamnesisKeys = {
  all: (storeId: string) => ['clinic', 'anamnesis', storeId] as const,
  templates: (storeId: string) => [...anamnesisKeys.all(storeId), 'templates'] as const,
  template: (storeId: string, templateId: string) =>
    [...anamnesisKeys.templates(storeId), templateId] as const,
  questions: (storeId: string) => [...anamnesisKeys.all(storeId), 'questions'] as const,
};
