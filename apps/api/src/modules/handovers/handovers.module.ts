import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { HandoversController } from './handovers.controller';
import { HandoversService } from './handovers.service';

@Module({
  imports: [AuditModule],
  controllers: [HandoversController],
  providers: [HandoversService],
  exports: [HandoversService],
})
export class HandoversModule {}
