import { Module } from '@nestjs/common';
import { SplitsService } from './splits.service.js';

@Module({
  providers: [SplitsService],
  exports: [SplitsService],
})
export class SplitsModule {}
