import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListPatientMoveDestinationsQueryDto {
  @IsOptional()
  @IsString()
  excludeFolderIds?: string;

  @IsOptional()
  @IsUUID()
  excludeFolderSubtreeId?: string;
}
