'use client';

import React, { useState } from 'react';

interface PendingDriver {
  id: string;
  fullName: string;
  phone: string;
  licenseNumber: string;
  experienceYears: number;
  fleetPartner: string;
  policeClearanceStatus: 'cleared' | 'pending' | 'flagged';
  licenseStatus: 'valid' | 'expiring' | 'expired';
  documents: { type: string; url: string; status: string; expiryDate: string }[];
}

interface PendingVehicle {
  id: string;
  registrationNumber: string;
  vehicleType: string;
  seatingCapacity: number;
  usableCapacity: number;
  ownerName: string;
  pan: string;
  fitnessValidTill: string;
}

export default function KycVerificationPage() {
  const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles'>('drivers');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'flagged'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [drivers, setDrivers] = useState<PendingDriver[]>([
    {
      id: 'd1-uuid',
      fullName: 'Suresh Kumar',
      phone: '+91 98765 43210',
      licenseNumber: 'TS09-2018-0045123',
      experienceYears: 7,
      fleetPartner: 'Dodail Central Fleet A',
      policeClearanceStatus: 'pending',
      licenseStatus: 'valid',
      documents: [
        { type: 'Commercial Driving License', url: 'https://placehold.co/600x380/012646/ffffff?text=Commercial+DL+%23TS09-2018-0045123', status: 'verified', expiryDate: '2029-08-15' },
        { type: 'Telangana Police Clearance Certificate', url: 'https://placehold.co/600x380/012646/ffffff?text=Telangana+State+Police+Clearance', status: 'pending', expiryDate: '2027-02-10' },
        { type: 'Aadhaar Identity Card', url: 'https://placehold.co/600x380/012646/ffffff?text=Aadhaar+Card+UIDAI', status: 'verified', expiryDate: 'Permanent' },
      ],
    },
    {
      id: 'd2-uuid',
      fullName: 'Venkatesh Rao',
      phone: '+91 99887 76655',
      licenseNumber: 'TS08-2020-0098432',
      experienceYears: 5,
      fleetPartner: 'Hyderabad Van Express',
      policeClearanceStatus: 'pending',
      licenseStatus: 'valid',
      documents: [
        { type: 'Commercial Driving License', url: 'https://placehold.co/600x380/012646/ffffff?text=Commercial+DL+%23TS08-2020-0098432', status: 'pending', expiryDate: '2028-11-20' },
        { type: 'Telangana Police Clearance Certificate', url: 'https://placehold.co/600x380/012646/ffffff?text=Telangana+State+Police+Clearance', status: 'pending', expiryDate: '2026-10-05' },
      ],
    },
    {
      id: 'd3-uuid',
      fullName: 'Mohammed Arif',
      phone: '+91 98123 45678',
      licenseNumber: 'TS10-2016-0012984',
      experienceYears: 9,
      fleetPartner: 'Dodail Central Fleet B',
      policeClearanceStatus: 'cleared',
      licenseStatus: 'valid',
      documents: [
        { type: 'Commercial Driving License', url: 'https://placehold.co/600x380/012646/ffffff?text=Commercial+DL+%23TS10-2016-0012984', status: 'verified', expiryDate: '2031-04-12' },
        { type: 'Telangana Police Clearance Certificate', url: 'https://placehold.co/600x380/012646/ffffff?text=Police+Clearance+Verified', status: 'verified', expiryDate: '2027-06-30' },
      ],
    },
  ]);

  const [vehicles] = useState<PendingVehicle[]>([
    {
      id: 'v1-uuid',
      registrationNumber: 'TS09UB4521',
      vehicleType: 'Tata Winger (16 Seater)',
      seatingCapacity: 16,
      usableCapacity: 16,
      ownerName: 'Hyderabad Transit Solutions LLP',
      pan: 'AABCH1234D',
      fitnessValidTill: '2027-11-30',
    },
    {
      id: 'v2-uuid',
      registrationNumber: 'TS07UA8910',
      vehicleType: 'Force Traveller (20 Seater)',
      seatingCapacity: 20,
      usableCapacity: 20,
      ownerName: 'Suresh Kumar Transport',
      pan: 'BCDEK5678E',
      fitnessValidTill: '2028-05-15',
    },
  ]);

  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(drivers[0] || null);
  const [modalOpen, setModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | 'needs_info'>('approve');
  const [reasonCode, setReasonCode] = useState('APPROVED');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleOpenDecision = (action: 'approve' | 'reject' | 'needs_info') => {
    setDecisionAction(action);
    setReasonCode(action === 'approve' ? 'APPROVED' : action === 'reject' ? 'DOC_EXPIRED' : 'DOC_UNREADABLE');
    setReviewerNotes('');
    setModalOpen(true);
  };

  const handleConfirmDecision = () => {
    if (!selectedDriver) return;

    if (decisionAction === 'approve') {
      setStatusMessage(`Driver ${selectedDriver.fullName} approved successfully (Code: ${reasonCode}). Audit entry recorded.`);
      setDrivers(drivers.filter((d) => d.id !== selectedDriver.id));
      setSelectedDriver(null);
    } else {
      setStatusMessage(`Decision recorded for ${selectedDriver.fullName}: ${decisionAction.toUpperCase()} (Reason: ${reasonCode}).`);
      setDrivers(drivers.filter((d) => d.id !== selectedDriver.id));
      setSelectedDriver(null);
    }
    setModalOpen(false);
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'pending' && d.policeClearanceStatus === 'pending') ||
      (filterStatus === 'verified' && d.policeClearanceStatus === 'cleared');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Top Stats Bar & Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
            Compliance &amp; Onboarding
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-primary-text tracking-tight">
            Driver Verification &amp; Background Compliance
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Manage driver onboarding, police verification clearances, driving license validation, and biometric KYC approvals across all partner fleets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-border/60 transition-all">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export KYC CSV
          </button>
          <button className="bg-primary hover:bg-primary-hover text-on-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all">
            <span className="material-symbols-outlined text-[18px]">sync</span>
            Sync Police DB
          </button>
        </div>
      </div>

      {/* Stitch 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Pending Verification */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border/60 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-secondary-text text-xs uppercase font-bold tracking-wider">Pending Verification</span>
            <div className="w-10 h-10 rounded-xl bg-sun-gold/15 text-sun-gold flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl text-primary-text font-bold">24</span>
            <span className="text-sun-gold text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>+4 today
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-xs text-secondary-text flex justify-between">
            <span>Awaiting documents</span>
            <span className="text-primary-text font-bold">Action required</span>
          </div>
        </div>

        {/* Card 2: Police Verified & Active */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border/60 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-secondary-text text-xs uppercase font-bold tracking-wider">Police Verified &amp; Active</span>
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">security</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl text-primary-text font-bold">1,142</span>
            <span className="text-primary text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span>98.2%
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-xs text-secondary-text flex justify-between">
            <span>Cleared by state police</span>
            <span className="text-primary font-bold">Fully Compliant</span>
          </div>
        </div>

        {/* Card 3: Expiring Licenses */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border/60 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-secondary-text text-xs uppercase font-bold tracking-wider">Expiring Licenses</span>
            <div className="w-10 h-10 rounded-xl bg-error/15 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">timer</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl text-primary-text font-bold">18</span>
            <span className="text-error text-xs font-bold">Next 30 days</span>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-xs text-secondary-text flex justify-between">
            <span>Renewal notice sent</span>
            <span className="text-error font-bold">Follow-up needed</span>
          </div>
        </div>

        {/* Card 4: Rejected / Flagged */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border/60 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <span className="text-secondary-text text-xs uppercase font-bold tracking-wider">Rejected / Flagged</span>
            <div className="w-10 h-10 rounded-xl bg-tertiary/15 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">gpp_bad</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-3xl text-primary-text font-bold">12</span>
            <span className="text-secondary-text text-xs font-medium">Audit logged</span>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-xs text-secondary-text flex justify-between">
            <span>Failed safety check</span>
            <span className="text-tertiary font-bold">Non-compliant</span>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-xs font-semibold text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-border/60 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'drivers'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-secondary-text hover:bg-surface-container-high'
            }`}
          >
            Driver Applications ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'vehicles'
                ? 'bg-primary-container text-on-primary-container shadow-sm'
                : 'text-secondary-text hover:bg-surface-container-high'
            }`}
          >
            Registered Vans ({vehicles.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-xl border border-border/40 text-xs">
            {(['all', 'pending', 'verified'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                  filterStatus === status
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-secondary-text hover:text-primary-text'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center w-full sm:w-60 bg-surface-container-high px-3 py-1.5 rounded-xl border border-border/40">
            <span className="material-symbols-outlined text-outline mr-2 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search by name, DL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-on-surface outline-none w-full"
            />
          </div>
        </div>
      </div>

      {/* Split Inspection View Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Driver List Table */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border/60 space-y-4">
          <h3 className="font-headline text-lg font-bold text-primary-text">Pending Applications Queue</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-xs font-bold text-secondary-text uppercase tracking-wider">
                  <th className="pb-3">Applicant</th>
                  <th className="pb-3">License &amp; Fleet</th>
                  <th className="pb-3">Police Clearance</th>
                  <th className="pb-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-sm">
                {filteredDrivers.map((driver) => {
                  const isSelected = selectedDriver?.id === driver.id;
                  return (
                    <tr
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-surface-container-low font-semibold'
                          : 'hover:bg-surface-container-low/60'
                      }`}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
                            {driver.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-primary-text">{driver.fullName}</p>
                            <p className="text-xs text-secondary-text">{driver.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-mono text-xs text-primary-text">{driver.licenseNumber}</p>
                        <p className="text-[11px] text-secondary-text">{driver.fleetPartner}</p>
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            driver.policeClearanceStatus === 'cleared'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-sun-gold/15 text-sun-gold'
                          }`}
                        >
                          {driver.policeClearanceStatus === 'cleared' ? 'Cleared' : 'Pending Verification'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-high text-primary-text hover:bg-surface-container-highest'
                          }`}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Side-by-Side Document Inspection Desk */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border/60 flex flex-col justify-between space-y-6">
          {selectedDriver ? (
            <>
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div>
                    <h3 className="font-headline text-lg font-bold text-primary-text">
                      {selectedDriver.fullName}
                    </h3>
                    <p className="text-xs text-secondary-text font-mono">{selectedDriver.licenseNumber}</p>
                  </div>
                  <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {selectedDriver.experienceYears} Years Exp
                  </span>
                </div>

                {/* Document Previews */}
                <div className="mt-4 space-y-4">
                  <h4 className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                    Uploaded Verification Documents
                  </h4>
                  {selectedDriver.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-surface-container-low rounded-xl border border-border/60 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-primary-text">{doc.type}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            doc.status === 'verified'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-sun-gold/20 text-sun-gold'
                          }`}
                        >
                          {doc.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="h-32 w-full rounded-lg overflow-hidden border border-border/60 bg-surface">
                        <img
                          src={doc.url}
                          alt={doc.type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[11px] text-secondary-text">Valid Until: {doc.expiryDate}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Decision Buttons */}
              <div className="pt-4 border-t border-border/60 flex items-center gap-3">
                <button
                  onClick={() => handleOpenDecision('reject')}
                  className="flex-1 py-2.5 rounded-xl border border-error/40 text-error hover:bg-error/10 text-xs font-bold transition-all"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => handleOpenDecision('needs_info')}
                  className="flex-1 py-2.5 rounded-xl border border-sun-gold/50 text-sun-gold hover:bg-sun-gold/10 text-xs font-bold transition-all"
                >
                  Request Info
                </button>
                <button
                  onClick={() => handleOpenDecision('approve')}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold shadow-sm transition-all"
                >
                  Approve Driver
                </button>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-secondary-text text-sm">
              <span className="material-symbols-outlined text-[48px] text-outline mb-2">person_search</span>
              <p>Select a driver from the queue to inspect verification documents.</p>
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {modalOpen && selectedDriver && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-xl border border-border space-y-4">
            <h3 className="font-headline text-lg font-bold text-primary-text">
              Confirm KYC Decision: {decisionAction.toUpperCase()}
            </h3>
            <p className="text-xs text-secondary-text">
              Target Applicant: <strong className="text-primary-text">{selectedDriver.fullName}</strong> ({selectedDriver.licenseNumber})
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-secondary-text">Reason Code</label>
              <select
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                className="w-full bg-surface-container-high text-xs text-primary-text p-2.5 rounded-xl border border-border/60 outline-none font-medium"
              >
                {decisionAction === 'approve' ? (
                  <option value="APPROVED">APPROVED - All documents verified &amp; background clear</option>
                ) : decisionAction === 'reject' ? (
                  <>
                    <option value="DOC_EXPIRED">DOC_EXPIRED - Commercial DL or Police Clearance expired</option>
                    <option value="DOC_UNREADABLE">DOC_UNREADABLE - Illegible scan or fraudulent certificate</option>
                    <option value="POLICE_FLAGGED">POLICE_FLAGGED - Active traffic or criminal record alert</option>
                  </>
                ) : (
                  <>
                    <option value="DOC_UNREADABLE">DOC_UNREADABLE - Re-upload clearer copy</option>
                    <option value="NAME_MISMATCH">NAME_MISMATCH - Name mismatch with Aadhaar</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-secondary-text">Reviewer Audit Notes</label>
              <textarea
                rows={3}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Enter mandatory audit rationale for platform compliance..."
                className="w-full bg-surface-container-high text-xs text-primary-text p-2.5 rounded-xl border border-border/60 outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface-container-high text-secondary-text text-xs font-bold hover:bg-surface-container-highest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-hover transition-all"
              >
                Confirm &amp; Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
