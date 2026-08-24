import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListPatientDriveQueryDto {
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
