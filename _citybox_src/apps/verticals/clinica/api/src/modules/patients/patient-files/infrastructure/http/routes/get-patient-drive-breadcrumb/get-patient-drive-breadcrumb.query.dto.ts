import { IsOptional, IsUUID } from 'class-validator';

export class GetPatientDriveBreadcrumbQueryDto {
  @IsOptional()
  @IsUUID()
  folderId?: string;
}
