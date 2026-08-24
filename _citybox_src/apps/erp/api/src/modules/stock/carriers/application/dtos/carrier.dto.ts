import type { PersonTypeValue } from '../../../../../shared/core/utils/document';
import type {
  Carrier,
  CarrierDeliveryTypeValue,
} from '../../domain/entities/carrier.entity';
import type { CarrierListTab } from '../../domain/repositories/carrier.repository.interface';

export type CarrierAddressDto = {
  zipCode?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
};

export type CarrierContactDto = {
  email?: string | null;
  commercialPhone?: string | null;
  mobilePhone?: string | null;
};

type CarrierWritableDto = CarrierAddressDto &
  CarrierContactDto & {
    personType: PersonTypeValue;
    deliveryType: CarrierDeliveryTypeValue;
    name: string;
    legalName?: string | null;
    document: string;
    icmsExempt?: boolean;
    registerInNfe?: boolean;
    stateRegistration?: string | null;
    stateExempt?: boolean;
    municipalRegistration?: string | null;
    branchIds?: string[];
  };

export type CreateCarrierDto = CarrierWritableDto & {
  organizationId: string;
};

export type UpdateCarrierDto = CarrierWritableDto & {
  organizationId: string;
  id: string;
};

export type ListCarriersDto = {
  organizationId: string;
  search?: string;
  tab?: CarrierListTab;
  page?: number;
  perPage?: number;
};

export type CarrierTabCounts = Record<CarrierListTab, number>;

export type ListCarriersResult = {
  items: Carrier[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  tabCounts: CarrierTabCounts;
};

export type FindCarrierByIdDto = { organizationId: string; id: string };

export type DeleteCarrierDto = { organizationId: string; id: string };

export type RestoreCarrierDto = { organizationId: string; id: string };
