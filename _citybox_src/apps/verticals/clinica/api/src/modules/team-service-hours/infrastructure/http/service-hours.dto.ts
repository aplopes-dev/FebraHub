import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class WeekdayScheduleDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;
}

class FixedLunchBreakDto {
  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @ApiProperty({ example: '13:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;
}

class WeekScheduleDto {
  @ApiProperty({ type: WeekdayScheduleDto })
  @ValidateNested()
  @Type(() => WeekdayScheduleDto)
  mon!: WeekdayScheduleDto;

  @ApiProperty({ type: WeekdayScheduleDto })
  @ValidateNested()
  @Type(() => WeekdayScheduleDto)
  tue!: WeekdayScheduleDto;

  @ApiProperty({ type: WeekdayScheduleDto })
  @ValidateNested()
  @Type(() => WeekdayScheduleDto)
  wed!: WeekdayScheduleDto;

  @ApiProperty({ type: WeekdayScheduleDto })
  @ValidateNested()
  @Type(() => WeekdayScheduleDto)
  thu!: WeekdayScheduleDto;

  @ApiProperty({ type: WeekdayScheduleDto })
  @ValidateNested()
  @Type(() => WeekdayScheduleDto)
  fri!: WeekdayScheduleDto;

  @ApiProperty({ type: WeekdayScheduleDto })
  @ValidateNested()
  @Type(() => WeekdayScheduleDto)
  sat!: WeekdayScheduleDto;

  @ApiProperty({ type: WeekdayScheduleDto })
  @ValidateNested()
  @Type(() => WeekdayScheduleDto)
  sun!: WeekdayScheduleDto;
}

export class ServiceHoursBodyDto {
  @ApiProperty({ type: WeekScheduleDto })
  @IsObject()
  @ValidateNested()
  @Type(() => WeekScheduleDto)
  weekSchedule!: WeekScheduleDto;

  @ApiProperty({ example: 30 })
  @IsInt()
  @Min(5)
  @Max(240)
  defaultConsultationMinutes!: number;

  @ApiProperty({ type: FixedLunchBreakDto })
  @ValidateNested()
  @Type(() => FixedLunchBreakDto)
  fixedLunchBreak!: FixedLunchBreakDto;
}
