import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetSequenceActiveDto {
  @ApiProperty({
    description:
      'true reativa; false desativa (bloqueia novas emissões nesta série).',
  })
  @IsBoolean()
  active!: boolean;
}
