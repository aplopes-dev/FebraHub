import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CurrentUser, Public } from '../auth/jwt.guard.js';
import { badRequest, paginated } from '../common/envelope.js';
import { InjectService } from '../common/inject.js';
import type { ConsumerUserRecord } from '../users/users.service.js';
import { ReviewsService } from './reviews.service.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PHOTO_BYTES = 1024 * 1024; // 1MB por foto

/** Arquivo multipart do multer (tipado localmente — sem depender de @types/multer). */
interface UploadedFileLike {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}

class ReviewsPageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

class CreateReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MaxLength(4000)
  text!: string;

  @IsOptional()
  @IsString()
  orderId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  photoUrls?: string[];
}

class AddReviewPhotosDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  photoUrls?: string[];
}

@ApiTags('reviews')
@Controller('catalog/products/:productId/reviews')
export class ReviewsController {
  constructor(@InjectService(ReviewsService) private readonly reviews: ReviewsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Avaliações de um produto (resumo + lista paginada)' })
  async list(@Param('productId') productId: string, @Query() query: ReviewsPageQueryDto) {
    const { data, meta } = await this.reviews.list(
      productId,
      query.page ?? 1,
      query.pageSize ?? DEFAULT_PAGE_SIZE,
    );
    return paginated(data, meta);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria avaliação e recalcula rating do produto' })
  create(
    @Param('productId') productId: string,
    @CurrentUser() user: ConsumerUserRecord,
    @Body() body: CreateReviewDto,
  ) {
    return this.reviews.create(productId, user, {
      rating: body.rating,
      text: body.text,
      photoUrls: body.photoUrls,
    });
  }

  @Post(':reviewId/photos')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Anexa foto à avaliação (multipart file ou JSON photoUrls)' })
  @UseInterceptors(FileInterceptor('file'))
  addPhotos(
    @Param('productId') productId: string,
    @Param('reviewId') reviewId: string,
    @Body() body: AddReviewPhotosDto,
    @UploadedFile() file?: UploadedFileLike,
  ) {
    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        throw badRequest('Arquivo deve ser uma imagem', 'file');
      }
      if (file.size > MAX_PHOTO_BYTES) {
        throw badRequest('Foto excede o limite de 1MB', 'file');
      }
      const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return this.reviews.addPhotos(productId, reviewId, [dataUrl]);
    }
    if (body.photoUrls?.length) {
      return this.reviews.addPhotos(productId, reviewId, body.photoUrls);
    }
    throw badRequest('Envie um arquivo (file) ou photoUrls', 'file');
  }
}
