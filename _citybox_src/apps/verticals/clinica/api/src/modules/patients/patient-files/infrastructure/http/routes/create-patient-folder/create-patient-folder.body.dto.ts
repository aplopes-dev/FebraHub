import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePatientFolderBodyDto {
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsString()
  name!: string;
}
