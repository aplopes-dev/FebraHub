import { Entity } from '../../../../shared/core/entity';
import type {
  ApiListingType,
  ApiPropertyStatus,
  ApiPropertyType,
} from '../mappers/property-enum.mapper';

export type PropertyPhotoProps = {
  id: string;
  /** Object key no MinIO. */
  objectKey: string;
  mimeType: string;
  sortOrder: number;
};

export type PropertyDocumentProps = {
  id: string;
  name: string;
  sizeLabel: string;
  /** Object key no MinIO; `null` = documento legado só com metadados. */
  objectKey: string | null;
  mimeType: string;
};

export type PropertyActiveLeadProps = {
  id: string;
  leadId: string;
  name: string;
  initials: string;
  sortOrder: number;
};

export type PropertyProps = {
  storeId: string;
  name: string;
  city: string;
  state: string;
  type: ApiPropertyType;
  units: number;
  cost: number;
  views: number;
  status: ApiPropertyStatus;
  occupiedUnits: number | null;
  listingType: ApiListingType;
  negotiable: boolean;
  bedrooms: number;
  floors: number;
  sizeSqm: number;
  yearBuilt: number;
  address: string;
  country: string;
  zipCode: string;
  mapCoordinate: string;
  typeCode: string | null;
  description: string;
  highlights: string[];
  totalActiveLeads: number;
  agentId: string | null;
  photos: PropertyPhotoProps[];
  documents: PropertyDocumentProps[];
  activeLeads: PropertyActiveLeadProps[];
  createdAt: Date;
  updatedAt: Date;
};

export class PropertyEntity extends Entity<PropertyProps> {
  get storeId(): string {
    return this.props.storeId;
  }
  get name(): string {
    return this.props.name;
  }
  get city(): string {
    return this.props.city;
  }
  get state(): string {
    return this.props.state;
  }
  get type(): ApiPropertyType {
    return this.props.type;
  }
  get units(): number {
    return this.props.units;
  }
  get cost(): number {
    return this.props.cost;
  }
  get views(): number {
    return this.props.views;
  }
  get status(): ApiPropertyStatus {
    return this.props.status;
  }
  get occupiedUnits(): number | null {
    return this.props.occupiedUnits;
  }
  get listingType(): ApiListingType {
    return this.props.listingType;
  }
  get negotiable(): boolean {
    return this.props.negotiable;
  }
  get bedrooms(): number {
    return this.props.bedrooms;
  }
  get floors(): number {
    return this.props.floors;
  }
  get sizeSqm(): number {
    return this.props.sizeSqm;
  }
  get yearBuilt(): number {
    return this.props.yearBuilt;
  }
  get address(): string {
    return this.props.address;
  }
  get country(): string {
    return this.props.country;
  }
  get zipCode(): string {
    return this.props.zipCode;
  }
  get mapCoordinate(): string {
    return this.props.mapCoordinate;
  }
  get typeCode(): string | null {
    return this.props.typeCode;
  }
  get description(): string {
    return this.props.description;
  }
  get highlights(): string[] {
    return this.props.highlights;
  }
  get totalActiveLeads(): number {
    return this.props.totalActiveLeads;
  }
  get agentId(): string | null {
    return this.props.agentId;
  }
  get photos(): PropertyPhotoProps[] {
    return this.props.photos;
  }
  get documents(): PropertyDocumentProps[] {
    return this.props.documents;
  }
  get activeLeads(): PropertyActiveLeadProps[] {
    return this.props.activeLeads;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  protected validate(): void {
    if (!this.props.storeId) throw new Error('storeId is required');
    if (!this.props.name?.trim()) throw new Error('name is required');
  }

  with(patch: Partial<PropertyProps>): PropertyEntity {
    return PropertyEntity.create({ ...this.props, ...patch }, this.id);
  }

  static create(props: PropertyProps, id?: string): PropertyEntity {
    const entity = new PropertyEntity(props, id);
    entity.validate();
    return entity;
  }
}
