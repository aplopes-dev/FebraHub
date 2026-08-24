import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class StoreWorkIntervalHTTPDTO {
  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime deve estar no formato HH:mm' })
  startTime: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime deve estar no formato HH:mm' })
  endTime: string;
}

export class StoreWeekScheduleHTTPDTO {
  @ApiProperty({ type: [StoreWorkIntervalHTTPDTO] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StoreWorkIntervalHTTPDTO)
  mon: StoreWorkIntervalHTTPDTO[];

  @ApiProperty({ type: [StoreWorkIntervalHTTPDTO] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StoreWorkIntervalHTTPDTO)
  tue: StoreWorkIntervalHTTPDTO[];

  @ApiProperty({ type: [StoreWorkIntervalHTTPDTO] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StoreWorkIntervalHTTPDTO)
  wed: StoreWorkIntervalHTTPDTO[];

  @ApiProperty({ type: [StoreWorkIntervalHTTPDTO] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StoreWorkIntervalHTTPDTO)
  thu: StoreWorkIntervalHTTPDTO[];

  @ApiProperty({ type: [StoreWorkIntervalHTTPDTO] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StoreWorkIntervalHTTPDTO)
  fri: StoreWorkIntervalHTTPDTO[];

  @ApiProperty({ type: [StoreWorkIntervalHTTPDTO] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StoreWorkIntervalHTTPDTO)
  sat: StoreWorkIntervalHTTPDTO[];

  @ApiProperty({ type: [StoreWorkIntervalHTTPDTO] })
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => StoreWorkIntervalHTTPDTO)
  sun: StoreWorkIntervalHTTPDTO[];
}

export class ReplaceStoreWorkScheduleHTTPDTO {
  @ApiProperty({ type: StoreWeekScheduleHTTPDTO })
  @ValidateNested()
  @Type(() => StoreWeekScheduleHTTPDTO)
  week: StoreWeekScheduleHTTPDTO;
}
