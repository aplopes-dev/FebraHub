import { IsOptional, IsUUID } from 'class-validator';

export class MovePatientFolderBodyDto {
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
