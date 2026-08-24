export type MemberStatusFilter = 'all' | 'active' | 'disabled';

export type MemberStatusFilterOption = {
  value: MemberStatusFilter;
  label: string;
};

export const MEMBER_STATUS_FILTER_OPTIONS: MemberStatusFilterOption[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'disabled', label: 'Inativos' },
];

export const DEFAULT_MEMBER_STATUS_FILTER: MemberStatusFilter = 'all';
