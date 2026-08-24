import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CurrentUser } from '../auth/jwt.guard.js';
import { InjectService } from '../common/inject.js';
import type { ConsumerUserRecord } from '../users/users.service.js';
import { FavoritesService } from './favorites.service.js';

class ToggleFavoriteDto {
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('me/favorites')
export class FavoritesController {
  constructor(@InjectService(FavoritesService) private readonly favorites: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Favoritos do usuário (ids + produtos)' })
  list(@CurrentUser() user: ConsumerUserRecord) {
    return this.favorites.list(user.id);
  }

  @Put(':productId')
  @ApiOperation({ summary: 'Marca/desmarca produto como favorito' })
  setFavorite(
    @CurrentUser() user: ConsumerUserRecord,
    @Param('productId') productId: string,
    @Body() body: ToggleFavoriteDto,
  ) {
    return this.favorites.setFavorite(user.id, productId, body.isFavorite ?? false);
  }
}
