import { Module } from '@nestjs/common';
import { OmieController } from './omie.controller';
import { OmieService } from './omie.service';

@Module({
  controllers: [OmieController],
  providers: [OmieService],
  exports: [OmieService],
})
export class OmieModule {}
