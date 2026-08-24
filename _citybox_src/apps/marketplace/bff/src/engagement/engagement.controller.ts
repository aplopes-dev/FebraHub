import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InjectService } from '../common/inject.js';
import { CurrentUser, Public } from '../auth/jwt.guard.js';
import type { ConsumerUserRecord } from '../users/users.service.js';
import { EngagementService } from './engagement.service.js';

export class SendChatMessageDto {
  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}

const clampInt = (raw: string | undefined, fallback: number, max: number) => {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
};

@ApiTags('engagement')
@ApiBearerAuth()
@Controller()
export class EngagementController {
  constructor(
    @InjectService(EngagementService) private readonly engagement: EngagementService,
  ) {}

  @Public()
  @Get('support/faq')
  getFaq() {
    return this.engagement.listFaq();
  }

  @Get('me/notifications')
  listNotifications(
    @CurrentUser() user: ConsumerUserRecord,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.engagement.listNotifications(user.id, {
      page: clampInt(page, 1, 10_000),
      pageSize: clampInt(pageSize, 20, 100),
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Patch('me/notifications/:id/read')
  markNotificationRead(@CurrentUser() user: ConsumerUserRecord, @Param('id') id: string) {
    return this.engagement.markNotificationRead(user.id, id);
  }

  @Post('me/notifications/read-all')
  markAllNotificationsRead(@CurrentUser() user: ConsumerUserRecord) {
    return this.engagement.markAllNotificationsRead(user.id);
  }

  @Get('me/support/chat/messages')
  listChatMessages(
    @CurrentUser() user: ConsumerUserRecord,
    @Query('limit') limit?: string,
  ) {
    return this.engagement.listChatMessages(user.id, clampInt(limit, 50, 200));
  }

  @Post('me/support/chat/messages')
  sendChatMessage(@CurrentUser() user: ConsumerUserRecord, @Body() body: SendChatMessageDto) {
    return this.engagement.sendChatMessage(user.id, body.text);
  }

  @Get('me/support/tickets')
  listTickets(
    @CurrentUser() user: ConsumerUserRecord,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.engagement.listTickets(user.id, {
      page: clampInt(page, 1, 10_000),
      pageSize: clampInt(pageSize, 20, 100),
    });
  }

  @Post('me/support/tickets')
  createTicket(@CurrentUser() user: ConsumerUserRecord, @Body() body: CreateTicketDto) {
    return this.engagement.createTicket(user.id, body);
  }
}
