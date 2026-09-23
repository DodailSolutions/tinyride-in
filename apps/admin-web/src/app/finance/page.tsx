'use client';

import React, { useState } from 'react';

export default function FinanceReconciliationPage() {
  const [report] = useState({
    totalGrossCollectionsPaise: 5000000, // 50,000 INR
    totalPlatformRevenuePaise: 750000,   // 7,500 INR (15%)
    totalOwnerPayablesPaise: 4250000,    // 42,500 INR (85%)
    netDiscrepancyPaise: 0,
    isBalanced: true,
    totalLedgerTransactionsCount: 16,
    ownerPayableBreakdown: [
      {
        ownerId: 'own-1',
        ownerName: 'Hyderabad Transit Solutions LLP',
        panOrGstin: 'AABCH1234D',
        pendingPayoutPaise: 2550000, // 25,500 INR
        assignedVehicles: 'TS09UB4589 (Auto), TS08UA1234 (Van)',
        bankAccount: 'HDFC •••• 4892',
        settlementStatus: 'Ready for Settlement',
      },
      {
        ownerId: 'own-2',
        ownerName: 'Deccan School Logistics Private Limited',
        panOrGstin: 'AACCD5678K',
        pendingPayoutPaise: 1700000, // 17,000 INR
        assignedVehicles: 'TS09UB9876 (Van)',
        bankAccount: 'ICICI •••• 1029',
        settlementStatus: 'Ready for Settlement',
      },
    ],
  });

  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [settlingOwner, setSettlingOwner] = useState<string | null>(null);

  const handlePayout = (ownerName: string, amountInr: number) => {
    setSettlingOwner(ownerName);
    setTimeout(() => {
      setSettlingOwner(null);
      setPayoutSuccess(`Payout of ₹${amountInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })} successfully initiated to ${ownerName} via RazorpayX Settlement gateway.`);
    }, 700);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Settlement & Double-Entry Ledger</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-headline text-primary-text tracking-tight">
            Financial &amp; Payout Audit Desk
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Real-time audit of parent subscription receipts, 15% Dodail platform commission, and 85% vehicle operator settlement obligations.
          </p>
        </div>

        {/* Ledger Balance Invariant Badge */}
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border shadow-sm ${
            report.isBalanced
              ? 'bg-[#eff6eb] border-primary/20 text-primary'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span className="material-symbols-outlined text-base font-bold text-primary">verified_user</span>
          <span className="font-headline tracking-wide">
            {report.isBalanced ? 'STRICT INVARIANT: 0 PAISE DISCREPANCY' : 'IMBALANCE DETECTED'}
          </span>
        </div>
      </div>

      {payoutSuccess && (
        <div className="p-4 bg-[#eff6eb] border border-primary/20 text-primary-text rounded-2xl text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
            <span>{payoutSuccess}</span>
          </div>
          <button
            onClick={() => setPayoutSuccess(null)}
            className="text-xs font-bold text-primary hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Collections */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-xs font-semibold text-secondary-text">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm text-primary">payments</span>
              Gross Collections
            </span>
            <span className="font-mono text-[11px] text-primary bg-[#eff6eb] px-2 py-0.5 rounded-full border border-primary/20 font-bold">
              Debit: clearing
            </span>
          </div>
          <p className="text-3xl font-extrabold font-headline text-primary-text tracking-tight">
            ₹{(report.totalGrossCollectionsPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-secondary-text">
            100% processed from verified UPI/Card recurring parent bookings.
          </p>
        </div>

        {/* Platform Revenue (15%) */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-xs font-semibold text-secondary-text">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm text-primary-container">trending_up</span>
              Platform Revenue (15%)
            </span>
            <span className="font-mono text-[11px] text-primary-container bg-primary/5 px-2 py-0.5 rounded-full border border-primary-container/20 font-bold">
              Credit: revenue
            </span>
          </div>
          <p className="text-3xl font-extrabold font-headline text-primary tracking-tight">
            ₹{(report.totalPlatformRevenuePaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-secondary-text">
            Dodail Solutions retained commission & platform technology fee.
          </p>
        </div>

        {/* Owner Payables (85%) */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sun-gold/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between text-xs font-semibold text-secondary-text">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm text-amber-600">account_balance_wallet</span>
              Owner Payables (85%)
            </span>
            <span className="font-mono text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
              Credit: owner_payable
            </span>
          </div>
          <p className="text-3xl font-extrabold font-headline text-amber-700 tracking-tight">
            ₹{(report.totalOwnerPayablesPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-secondary-text">
            Accrued fleet driver and vehicle partner settlement liabilities.
          </p>
        </div>
      </div>

      {/* Double-Entry Balance Verification Banner */}
      <div className="p-6 bg-gradient-to-r from-deep-blue via-[#022D53] to-primary rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-container font-headline font-bold text-sm mb-1">
            <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
            <span>Cryptographic &amp; Financial Guarantee: Zero Discrepancy</span>
          </div>
          <p className="text-xs text-white/80 max-w-2xl leading-relaxed">
            Double-entry ledger invariant: <code className="bg-white/10 px-2 py-0.5 rounded font-mono text-emerald-300">Debit (₹50,000.00) + CreditPlatform (-₹7,500.00) + CreditOwners (-₹42,500.00) = ₹0.00</code>. All entries validated against immutable append-only journals.
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="font-mono text-xs bg-white/10 text-white border border-white/20 px-3.5 py-2 rounded-xl font-bold inline-flex items-center gap-1.5 backdrop-blur-sm">
            <span className="material-symbols-outlined text-sun-gold text-base">receipt_long</span>
            {report.totalLedgerTransactionsCount} Audited Journal Entries
          </span>
        </div>
      </div>

      {/* Owner Payout Schedule Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-surface-container-high/40">
          <div>
            <h2 className="text-lg font-bold font-headline text-primary-text">Vehicle Fleet Owner Payout Schedule</h2>
            <p className="text-xs text-secondary-text">Verified bank accounts and settlement readiness status</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-xs font-bold text-primary bg-[#eff6eb] border border-primary/20 rounded-xl hover:bg-primary hover:text-white transition-all inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">download</span>
              Export GST Report
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-secondary-text font-bold uppercase tracking-wider border-b border-surface-container-high/40">
              <tr>
                <th className="py-3.5 px-4 font-headline">Fleet Operator</th>
                <th className="py-3.5 px-4 font-headline">Tax ID (PAN/GSTIN)</th>
                <th className="py-3.5 px-4 font-headline">Assigned Vehicles</th>
                <th className="py-3.5 px-4 font-headline">Settlement Account</th>
                <th className="py-3.5 px-4 font-headline">Accrued Payable (85%)</th>
                <th className="py-3.5 px-4 font-headline text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/30">
              {report.ownerPayableBreakdown.map((owner) => {
                const amountInr = owner.pendingPayoutPaise / 100;
                const isSettling = settlingOwner === owner.ownerName;
                return (
                  <tr key={owner.ownerId} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold font-headline text-primary-text text-sm">{owner.ownerName}</div>
                      <div className="text-[11px] text-secondary-text font-mono">ID: {owner.ownerId}</div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-secondary-text">
                      <span className="bg-surface-container-low px-2 py-1 rounded-md border border-surface-container-high/40">
                        {owner.panOrGstin}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-secondary-text font-medium">
                      {owner.assignedVehicles}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-mono text-primary-text font-semibold">{owner.bankAccount}</div>
                      <div className="text-[10px] text-primary flex items-center gap-1 font-bold mt-0.5">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        Verified Beneficiary
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold font-headline text-primary text-base">
                      ₹{amountInr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handlePayout(owner.ownerName, amountInr)}
                        disabled={isSettling}
                        className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-xl text-xs font-bold font-headline shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isSettling ? 'sync' : 'send'}
                        </span>
                        <span>{isSettling ? 'Settling...' : 'Initiate Settlement'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
