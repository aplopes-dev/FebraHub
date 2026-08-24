import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InjectService } from '../common/inject.js';
import { Public } from '../auth/jwt.guard.js';
import { ContentService } from './content.service.js';

@ApiTags('content')
@Public()
@Controller()
export class ContentController {
  constructor(@InjectService(ContentService) private readonly content: ContentService) {}

  /** Rota raiz do BFF (com o global prefix vira `/api`). */
  @Get()
  root() {
    return { status: 'ok', message: 'CityBox BFF', docs: '/api/v1/docs' };
  }

  @Get('content/banners')
  listBanners() {
    return this.content.listBanners();
  }

  @Get('content/pages/:slug')
  getStaticPage(@Param('slug') slug: string) {
    return this.content.getStaticPage(slug);
  }
}
