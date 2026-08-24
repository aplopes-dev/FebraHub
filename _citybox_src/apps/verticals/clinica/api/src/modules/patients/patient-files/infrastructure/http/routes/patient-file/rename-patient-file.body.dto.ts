import { IsString } from 'class-validator';

export class RenamePatientFileBodyDto {
  @IsString()
  name!: string;
}
