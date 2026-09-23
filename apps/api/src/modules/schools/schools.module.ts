import { Module } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { SchoolStaffGuard } from './guards/school-staff.guard';

@Module({
  controllers: [SchoolsController],
  providers: [SchoolsService, SchoolStaffGuard],
  exports: [SchoolsService],
})
export class SchoolsModule {}
