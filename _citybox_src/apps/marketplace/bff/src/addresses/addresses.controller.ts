import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, Public } from '../auth/jwt.guard.js';
import { InjectService } from '../common/inject.js';
import type { ConsumerUserRecord } from '../users/users.service.js';
import { AddressesService } from './addresses.service.js';

class AddressInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(9)
  zipCode!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  street!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  number!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  neighborhood!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

@ApiTags('addresses')
@Controller()
export class AddressesController {
  constructor(@InjectService(AddressesService) private readonly addresses: AddressesService) {}

  @Get('me/addresses')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista endereços do usuário' })
  list(@CurrentUser() user: ConsumerUserRecord) {
    return this.addresses.list(user.id);
  }

  @Post('me/addresses')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria endereço (primeiro vira padrão)' })
  create(@CurrentUser() user: ConsumerUserRecord, @Body() body: AddressInputDto) {
    return this.addresses.create(user.id, body);
  }

  @Put('me/addresses/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza endereço' })
  update(
    @CurrentUser() user: ConsumerUserRecord,
    @Param('id') id: string,
    @Body() body: AddressInputDto,
  ) {
    return this.addresses.update(user.id, id, body);
  }

  @Delete('me/addresses/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove endereço' })
  remove(@CurrentUser() user: ConsumerUserRecord, @Param('id') id: string) {
    return this.addresses.remove(user.id, id);
  }

  @Patch('me/addresses/:id/default')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Define endereço padrão' })
  setDefault(@CurrentUser() user: ConsumerUserRecord, @Param('id') id: string) {
    return this.addresses.setDefault(user.id, id);
  }

  @Public()
  @Get('addresses/zip/:zipCode')
  @ApiOperation({ summary: 'Consulta CEP (ViaCEP)' })
  lookupZip(@Param('zipCode') zipCode: string) {
    return this.addresses.lookupZip(zipCode);
  }
}
