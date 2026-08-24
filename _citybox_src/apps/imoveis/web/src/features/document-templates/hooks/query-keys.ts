export const documentTemplateKeys = {
  all: ['document-templates'] as const,
  lists: () => [...documentTemplateKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) =>
    [...documentTemplateKeys.lists(), params] as const,
  variables: () => [...documentTemplateKeys.all, 'variables'] as const,
};
