import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../common/supabase/supabase.service';

export interface FinanceReconciliationReport {
  totalGrossCollectionsPaise: number;
  totalPlatformRevenuePaise: number;
  totalOwnerPayablesPaise: number;
  netDiscrepancyPaise: number;
  isBalanced: boolean;
  totalLedgerTransactionsCount: number;
  ownerPayableBreakdown: {
    ownerId: string;
    ownerName: string;
    panOrGstin: string;
    pendingPayoutPaise: number;
  }[];
}

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Generates real-time double-entry ledger reconciliation audit.
   * Invariant: Total sum of all ledger entries must equal 0 paise.
   */
  async getReconciliationReport(): Promise<FinanceReconciliationReport> {
    const client = this.supabaseService.getServiceRoleClient();

    // Fetch all ledger accounts with owner profiles
    const { data: accounts } = await client
      .from('ledger_accounts')
      .select(`
        id,
        account_type,
        owner_id,
        vehicle_owners (
          id,
          legal_name,
          pan,
          gstin
        )
      `);

    const accountMap = new Map<string, any>();
    (accounts || []).forEach((acc: any) => {
      accountMap.set(acc.id, acc);
    });

    // Fetch all ledger entries
    const { data: entries, error } = await client
      .from('ledger_entries')
      .select('id, transaction_id, account_id, amount_minor');

    if (error) {
      this.logger.error(`Error querying ledger entries: ${error.message}`);
    }

    const allEntries = entries || [];

    let totalGrossCollectionsPaise = 0;
    let totalPlatformRevenuePaise = 0;
    let totalOwnerPayablesPaise = 0;
    let sumOfAllEntries = 0;

    const ownerBalanceMap = new Map<string, { owner: any; balance: number }>();

    for (const entry of allEntries) {
      const amount = Number(entry.amount_minor);
      sumOfAllEntries += amount;

      const account = accountMap.get(entry.account_id);
      if (!account) continue;

      if (account.account_type === 'gateway_clearing') {
        if (amount > 0) totalGrossCollectionsPaise += amount;
      } else if (account.account_type === 'platform_revenue') {
        totalPlatformRevenuePaise += Math.abs(amount);
      } else if (account.account_type === 'owner_payable') {
        totalOwnerPayablesPaise += Math.abs(amount);

        if (account.owner_id) {
          const current = ownerBalanceMap.get(account.owner_id) || {
            owner: account.vehicle_owners,
            balance: 0,
          };
          // Credits to owner_payable increase liability (what we owe the owner)
          current.balance += Math.abs(amount);
          ownerBalanceMap.set(account.owner_id, current);
        }
      }
    }

    const { count: txCount } = await client
      .from('ledger_transactions')
      .select('id', { count: 'exact', head: true });

    const ownerPayableBreakdown = Array.from(ownerBalanceMap.entries()).map(
      ([ownerId, data]) => ({
        ownerId,
        ownerName: data.owner?.legal_name || 'Vehicle Owner',
        panOrGstin: data.owner?.pan || data.owner?.gstin || 'N/A',
        pendingPayoutPaise: data.balance,
      }),
    );

    return {
      totalGrossCollectionsPaise,
      totalPlatformRevenuePaise,
      totalOwnerPayablesPaise,
      netDiscrepancyPaise: sumOfAllEntries,
      isBalanced: sumOfAllEntries === 0,
      totalLedgerTransactionsCount: txCount || 0,
      ownerPayableBreakdown,
    };
  }
}
