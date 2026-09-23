import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';

describe('FinanceService', () => {
  let service: FinanceService;

  const mockSupabaseClient = {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'ledger_accounts') {
        return {
          select: jest.fn().mockResolvedValue({
            data: [
              { id: 'acc-gateway', account_type: 'gateway_clearing' },
              { id: 'acc-platform', account_type: 'platform_revenue' },
              {
                id: 'acc-owner',
                account_type: 'owner_payable',
                owner_id: 'owner-uuid-1',
                vehicle_owners: { id: 'owner-uuid-1', legal_name: 'Hyderabad Fleet Corp', pan: 'ABCDE1234F' },
              },
            ],
            error: null,
          }),
        };
      }
      if (table === 'ledger_entries') {
        return {
          select: jest.fn().mockResolvedValue({
            data: [
              // Balanced transaction: Debit gateway +500,000 paise (5000 INR)
              { id: 'e1', transaction_id: 'tx1', account_id: 'acc-gateway', amount_minor: 500000 },
              // Credit platform revenue -75,000 paise (15% = 750 INR)
              { id: 'e2', transaction_id: 'tx1', account_id: 'acc-platform', amount_minor: -75000 },
              // Credit owner payable -425,000 paise (85% = 4250 INR)
              { id: 'e3', transaction_id: 'tx1', account_id: 'acc-owner', amount_minor: -425000 },
            ],
            error: null,
          }),
        };
      }
      if (table === 'ledger_transactions') {
        return {
          select: jest.fn().mockResolvedValue({ count: 1 }),
        };
      }
      return { select: jest.fn().mockResolvedValue({ data: [] }) };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: SupabaseService,
          useValue: {
            getServiceRoleClient: jest.fn().mockReturnValue(mockSupabaseClient),
          },
        },
      ],
    }).compile();

    service = module.get<FinanceService>(FinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should verify balanced double-entry ledger with 0 discrepancy', async () => {
    const report = await service.getReconciliationReport();
    expect(report).toBeDefined();
    expect(report.totalGrossCollectionsPaise).toBe(500000);
    expect(report.totalPlatformRevenuePaise).toBe(75000);
    expect(report.totalOwnerPayablesPaise).toBe(425000);
    expect(report.netDiscrepancyPaise).toBe(0);
    expect(report.isBalanced).toBe(true);
    expect(report.ownerPayableBreakdown).toHaveLength(1);
    expect(report.ownerPayableBreakdown[0].pendingPayoutPaise).toBe(425000);
    expect(report.ownerPayableBreakdown[0].ownerName).toBe('Hyderabad Fleet Corp');
  });
});
