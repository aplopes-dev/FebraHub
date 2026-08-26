import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SymplaService } from './sympla.service';
import { SymplaController } from './sympla.controller';

@Module({
  imports: [DatabaseModule],
  providers: [SymplaService],
  controllers: [SymplaController],
  exports: [SymplaService],
})
export class SymplaModule {}
