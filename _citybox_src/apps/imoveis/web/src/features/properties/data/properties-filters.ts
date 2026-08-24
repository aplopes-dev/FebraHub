import type { FilterGroupDef } from '@/components/filters';
import { createEmptyValues } from '@/components/filters';
import {
  PROPERTY_STATUS_LABEL,
  PROPERTY_TYPE_LABEL,
  type PropertyStatus,
  type PropertyType,
} from '@/features/shared/types';
import { LISTING_TYPE_LABEL, type ListingType } from '../types';

const PROPERTY_STATUSES = Object.keys(PROPERTY_STATUS_LABEL) as PropertyStatus[];
const PROPERTY_TYPES = Object.keys(PROPERTY_TYPE_LABEL) as PropertyType[];
const LISTING_TYPES = Object.keys(LISTING_TYPE_LABEL) as ListingType[];

export const PROPERTIES_FILTER_GROUPS: FilterGroupDef[] = [
  {
    type: 'checkbox',
    key: 'status',
    title: 'Status',
    column: 'left',
    options: PROPERTY_STATUSES.map((value) => ({
      value,
      label: PROPERTY_STATUS_LABEL[value],
    })),
  },
  {
    type: 'checkbox',
    key: 'type',
    title: 'Tipo',
    column: 'left',
    options: PROPERTY_TYPES.map((value) => ({
      value,
      label: PROPERTY_TYPE_LABEL[value],
    })),
  },
  {
    type: 'checkbox',
    key: 'listingType',
    title: 'Finalidade',
    column: 'right',
    options: LISTING_TYPES.map((value) => ({
      value,
      label: LISTING_TYPE_LABEL[value],
    })),
  },
  {
    type: 'checkbox',
    key: 'negotiable',
    title: 'Negociação',
    column: 'right',
    options: [
      { value: 'yes', label: 'Negociável' },
      { value: 'no', label: 'Preço fixo' },
    ],
  },
];

export const EMPTY_PROPERTIES_FILTERS = createEmptyValues(PROPERTIES_FILTER_GROUPS);
