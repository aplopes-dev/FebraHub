import { IsOptional, IsUUID } from 'class-validator';

export class UploadPatientFileBodyDto {
  @IsOptional()
  @IsUUID()
  folderId?: string | null;
}
