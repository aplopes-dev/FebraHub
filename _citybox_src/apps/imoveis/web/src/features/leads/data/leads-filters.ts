import {
  createEmptyValues,
  type FilterGroupDef,
} from '@/components/filters';
import { PROPERTY_TYPE_LABEL, type PropertyType } from '@/features/shared/types';
import {
  LEAD_PURPOSE_LABEL,
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_LABEL,
  LEAD_STATUSES,
  type LeadPurpose,
  type LeadSource,
} from '../types';

const LEAD_SOURCES = Object.keys(LEAD_SOURCE_LABEL) as LeadSource[];
const LEAD_PURPOSES = Object.keys(LEAD_PURPOSE_LABEL) as LeadPurpose[];
const PROPERTY_TYPES = Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[];

export const LEADS_FILTER_GROUPS: FilterGroupDef[] = [
  {
    type: 'checkbox',
    key: 'status',
    title: 'Status',
    column: 'left',
    options: LEAD_STATUSES.map((value) => ({
      value,
      label: LEAD_STATUS_LABEL[value],
    })),
  },
  {
    type: 'checkbox',
    key: 'leadSource',
    title: 'Origem',
    column: 'left',
    options: LEAD_SOURCES.map((value) => ({
      value,
      label: LEAD_SOURCE_LABEL[value],
    })),
  },
  {
    type: 'checkbox',
    key: 'purpose',
    title: 'Finalidade',
    column: 'right',
    options: LEAD_PURPOSES.map((value) => ({
      value,
      label: LEAD_PURPOSE_LABEL[value],
    })),
  },
  {
    type: 'checkbox',
    key: 'interestedPropertyType',
    title: 'Tipo de imóvel',
    column: 'right',
    options: PROPERTY_TYPES.map((value) => ({
      value,
      label: PROPERTY_TYPE_LABEL[value],
    })),
  },
];

export const EMPTY_LEADS_FILTERS = createEmptyValues(LEADS_FILTER_GROUPS);
