import { IsOptional, IsUUID } from 'class-validator';

export class MovePatientFileBodyDto {
  @IsOptional()
  @IsUUID()
  folderId?: string | null;
}
