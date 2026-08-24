import { IsString } from 'class-validator';

export class RenamePatientFolderBodyDto {
  @IsString()
  name!: string;
}
