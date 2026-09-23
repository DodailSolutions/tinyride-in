'use client';

import React, { useState } from 'react';

interface SupportTicket {
  id: string;
  reference: string;
  requesterName: string;
  requesterPhone: string;
  requesterRole: 'Parent' | 'Driver' | 'School Marshal';
  category: string;
  subject: string;
  state: 'open' | 'in_progress' | 'waiting_on_user' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  createdAt: string;
  message: string;
}

export default function SupportDeskPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'tkt-1',
      reference: 'TKT-20260923-4A5B6C',
      requesterName: 'Ananya Sharma',
      requesterPhone: '+91 98765 43210',
      requesterRole: 'Parent',
      category: 'Route Modification',
      subject: 'Request to modify afternoon pickup stop from Stop A to Stop B',
      state: 'open',
      severity: 'medium',
      createdAt: 'Today, 07:10 AM',
      message: 'Hello, our family moved to a nearby apartment complex. Can we change my daughter Aarav\'s afternoon dropoff stop starting tomorrow?',
    },
    {
      id: 'tkt-2',
      reference: 'TKT-20260923-7D8E9F',
      requesterName: 'Suresh Kumar',
      requesterPhone: '+91 99887 76655',
      requesterRole: 'Driver',
      category: 'Onboarding & KYC',
      subject: 'Clarification regarding police clearance verification status',
      state: 'in_progress',
      severity: 'low',
      assignedTo: 'Support Officer Priya',
      createdAt: 'Yesterday, 04:30 PM',
      message: 'I submitted the Telangana State Police verification document yesterday. When will it be cleared so I can start my morning run?',
    },
    {
      id: 'tkt-3',
      reference: 'TKT-20260922-9K2L1M',
      requesterName: 'Meera Rao (Oakridge)',
      requesterPhone: '+91 91234 56789',
      requesterRole: 'School Marshal',
      category: 'Gate Intake Inquiry',
      subject: 'Bay 03 NFC terminal synchronization check',
      state: 'resolved',
      severity: 'low',
      assignedTo: 'Tech Support Team',
      createdAt: '22 Sep, 11:15 AM',
      message: 'NFC handheld scanner at Bay 03 was showing a brief 5-second latency during peak morning dismissals. Requested verification of edge gateway cache.',
    },
  ]);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(tickets[0] || null);
  const [replyText, setReplyText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleUpdateTicketState = (newState: SupportTicket['state']) => {
    if (!selectedTicket) return;

    setTickets(
      tickets.map((t) => (t.id === selectedTicket.id ? { ...t, state: newState } : t)),
    );
    setSelectedTicket({ ...selectedTicket, state: newState });
    setStatusMessage(`Ticket ${selectedTicket.reference} status updated to ${newState.toUpperCase()}.`);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    setStatusMessage(`Dispatched message to ${selectedTicket?.requesterName}: "${replyText}"`);
    setReplyText('');
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">support_agent</span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Operational Support & Help Desk</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-headline text-primary-text tracking-tight">
            Support &amp; Inquiries Command
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Ticket-scoped parent, driver, and school marshal communications with real-time audit logs and SMS/Push gateway sync.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-low border border-primary/20 px-4 py-2 rounded-full text-primary text-xs font-bold font-headline shadow-sm">
          <span className="material-symbols-outlined text-base">forum</span>
          <span>{tickets.filter(t => t.state === 'open' || t.state === 'in_progress').length} Active Inquiries</span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-[#eff6eb] border border-primary/20 text-primary-text rounded-2xl text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold text-primary hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between px-2 pb-2 border-b border-surface-container-high/40">
            <h2 className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider">
              Inquiry Queue ({tickets.length})
            </h2>
            <span className="text-[11px] font-bold text-primary">SLA: &lt; 15m</span>
          </div>

          <div className="space-y-2.5">
            {tickets.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-[#eff6eb] shadow-sm ring-1 ring-primary/30'
                      : 'border-surface-container-high/60 bg-surface-container-lowest hover:border-surface-container-high hover:bg-surface-container-low/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-secondary-text">{ticket.reference}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ticket.state === 'open'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : ticket.state === 'in_progress'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-[#eff6eb] text-primary border border-primary/20'
                      }`}
                    >
                      {ticket.state.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="font-bold font-headline text-sm text-primary-text line-clamp-1">{ticket.subject}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-secondary-text mt-1">
                    <span className="font-semibold text-primary-text">{ticket.requesterName}</span>
                    <span>•</span>
                    <span className="bg-surface-container-low px-1.5 py-0.5 rounded text-[10px] font-bold text-secondary-text">{ticket.requesterRole}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-secondary-text mt-3 pt-2.5 border-t border-surface-container-high/30">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {ticket.createdAt}
                    </span>
                    <span className="capitalize font-bold text-primary-text">{ticket.severity} Priority</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Ticket Thread & Actions */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm p-6 space-y-6 flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-surface-container-high/40 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-primary">{selectedTicket.reference}</span>
                    <span className="text-xs font-semibold bg-surface-container-low text-secondary-text px-2.5 py-0.5 rounded-full border border-surface-container-high/40">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold font-headline text-primary-text">{selectedTicket.subject}</h2>
                  <p className="text-xs text-secondary-text mt-0.5 flex items-center gap-1.5">
                    Requester: <strong className="text-primary-text">{selectedTicket.requesterName}</strong>
                    <span className="font-mono">({selectedTicket.requesterPhone})</span>
                    <span className="bg-[#eff6eb] text-primary px-2 py-0.5 rounded-full text-[10px] font-bold border border-primary/20">
                      {selectedTicket.requesterRole}
                    </span>
                  </p>
                </div>

                {/* State update dropdown buttons */}
                <div className="flex items-center gap-2">
                  {selectedTicket.state !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateTicketState('resolved')}
                      className="px-3.5 py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold font-headline shadow-sm transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">task_alt</span>
                      <span>Mark Resolved</span>
                    </button>
                  )}
                  {selectedTicket.state !== 'closed' && (
                    <button
                      onClick={() => handleUpdateTicketState('closed')}
                      className="px-3.5 py-2 bg-deep-blue hover:bg-[#012646] text-white rounded-xl text-xs font-bold font-headline shadow-sm transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">archive</span>
                      <span>Archive</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread */}
              <div className="space-y-4">
                <div className="p-5 bg-surface-container-low rounded-2xl border border-surface-container-high/40 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {selectedTicket.requesterName.charAt(0)}
                      </div>
                      <span className="font-bold font-headline text-primary-text">{selectedTicket.requesterName}</span>
                    </div>
                    <span className="text-secondary-text text-[11px]">{selectedTicket.createdAt}</span>
                  </div>
                  <p className="text-xs text-primary-text/90 leading-relaxed pl-9">
                    {selectedTicket.message}
                  </p>
                </div>
              </div>

              {/* Reply Box */}
              <div className="pt-4 border-t border-surface-container-high/40 space-y-3">
                <label className="block text-xs font-bold font-headline text-primary-text">
                  Official Operator Dispatch Reply (Sent via Push Notification &amp; SMS)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Compose verified response to parent or driver..."
                    className="flex-1 text-xs bg-surface-container-low border border-surface-container-high/60 rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-primary-text"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendReply();
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    className="px-5 py-3 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold font-headline shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-secondary-text text-sm">
              <span className="material-symbols-outlined text-4xl text-secondary-text/40 mb-2">inbox</span>
              <p>Select a support ticket from the queue to view full correspondence.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
