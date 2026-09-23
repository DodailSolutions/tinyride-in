import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParentOwnershipGuard } from '../../common/guards/parent-ownership.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseAuthGuard, RolesGuard, ParentOwnershipGuard],
  exports: [AuthService, SupabaseAuthGuard, RolesGuard, ParentOwnershipGuard],
})
export class AuthModule {}
