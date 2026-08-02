import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { BaileysManager } from './baileys.manager';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [StorageModule],
  controllers: [WhatsappController],
  providers: [BaileysManager, WhatsappService],
})
export class WhatsappModule {}
