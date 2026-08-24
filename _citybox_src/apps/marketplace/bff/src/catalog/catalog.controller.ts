import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Public } from '../auth/jwt.guard.js';
import { InjectService } from '../common/inject.js';
import { paginated } from '../common/envelope.js';
import { CatalogService } from './catalog.service.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  pageSize?: number;
}

const toBool = ({ value }: { value: unknown }) => value === 'true' || value === true;

class SearchQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minRating?: number;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  freeShipping?: boolean;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  express?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string;
}

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(@InjectService(CatalogService) private readonly catalog: CatalogService) {}

  @Public()
  @Get('home')
  @ApiOperation({ summary: 'Home do catálogo: seções + produtos referenciados' })
  home() {
    return this.catalog.home();
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Lista de categorias' })
  categories() {
    return this.catalog.categories();
  }

  @Public()
  @Get('categories/:id/products')
  @ApiOperation({ summary: 'Produtos de uma categoria (paginado)' })
  async categoryProducts(@Param('id') id: string, @Query() query: PageQueryDto) {
    const { data, meta } = await this.catalog.categoryProducts(
      id,
      query.page ?? 1,
      query.pageSize ?? DEFAULT_PAGE_SIZE,
    );
    return paginated(data, meta);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Busca de produtos (Typesense com fallback Postgres)' })
  async search(@Query() query: SearchQueryDto) {
    const { data, meta } = await this.catalog.search({
      q: query.q,
      categoryId: query.categoryId,
      brand: query.brand,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      minRating: query.minRating,
      freeShipping: query.freeShipping,
      express: query.express,
      sortBy: query.sortBy,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
    });
    return paginated(data, meta);
  }

  @Public()
  @Get('search/suggestions')
  @ApiOperation({ summary: 'Sugestões de busca (produtos + categorias) e marcas' })
  suggestions(@Query('q') q?: string) {
    return this.catalog.suggestions(q);
  }

  @Public()
  @Get('filters/metadata')
  @ApiOperation({ summary: 'Metadados de filtros de busca' })
  filtersMetadata() {
    return this.catalog.filtersMetadata();
  }

  @Public()
  @Get('products/:id')
  @ApiOperation({ summary: 'Detalhe de um produto' })
  product(@Param('id') id: string) {
    return this.catalog.product(id);
  }
}
