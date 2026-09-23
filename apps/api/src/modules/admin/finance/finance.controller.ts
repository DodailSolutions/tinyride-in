import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FinanceService, FinanceReconciliationReport } from './finance.service';
import { SupabaseAuthGuard } from '../../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Admin Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('admin/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('reconciliation')
  @Roles('admin', 'finance_admin')
  @ApiOperation({
    summary: 'Double-Entry Ledger Reconciliation Report',
    description: 'Audits ledger entries across clearing, platform revenue, and owner liabilities to verify zero discrepancy balance.',
  })
  @ApiResponse({ status: 200, description: 'Ledger totals and balance integrity report' })
  async getReconciliation(): Promise<FinanceReconciliationReport> {
    return this.financeService.getReconciliationReport();
  }
}
