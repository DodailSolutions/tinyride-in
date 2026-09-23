'use client';

import React, { useState } from 'react';

interface SmsEvent {
  id: string;
  timestamp: string;
  studentName: string;
  phoneNumber: string;
  messageSnippet: string;
  status: 'delivered' | 'sending';
}

export default function AfternoonReleasesPage() {
  const [stats, setStats] = useState({
    totalDismissal: 1420,
    busesDeparted: 18,
    busesTotal: 24,
    gateQueueStatus: 'Bay 3 Busy',
    smsDispatched: 1392,
  });

  const [bays, setBays] = useState([
    {
      id: 'bay-1',
      bayNumber: 'Bay #01',
      status: 'DEPARTED',
      route: 'Route HPS-12 (North City)',
      driver: 'Ramesh K.',
      kidsCount: 38,
      leftAt: '2:45 PM',
      smsSent: true,
      borderColor: 'border-primary',
    },
    {
      id: 'bay-2',
      bayNumber: 'Bay #02',
      status: 'DEPARTED',
      route: 'Route HPS-04 (Banjara Hills)',
      driver: 'Suresh M.',
      kidsCount: 42,
      leftAt: '2:50 PM',
      smsSent: true,
      borderColor: 'border-primary',
    },
    {
      id: 'bay-3',
      bayNumber: 'Bay #03',
      status: 'LOADING',
      route: 'Route HPS-09 (Jubilee Hills)',
      driver: 'Venkat R.',
      kidsCount: '35 / 40',
      leftAt: 'Active Loading',
      smsSent: false,
      borderColor: 'border-sun-gold',
    },
  ]);

  const [students, setStudents] = useState([
    {
      id: 's-1',
      studentId: '#HPS-8821',
      name: 'Aarav Reddy',
      initials: 'AR',
      grade: 'Class 5-B',
      mode: 'Bus #03',
      verifier: 'Staff PIN #4021',
      status: 'Verified & Boarded',
    },
    {
      id: 's-2',
      studentId: '#HPS-9120',
      name: 'Diya Sharma',
      initials: 'DS',
      grade: 'Class 3-A',
      mode: 'Parent Pick',
      verifier: 'OTP #9923 (Verified)',
      status: 'Released',
    },
    {
      id: 's-3',
      studentId: '#HPS-7734',
      name: 'Rohan Kapoor',
      initials: 'RK',
      grade: 'Class 7-C',
      mode: 'Bus #09',
      verifier: 'Pending Scan',
      status: 'In Queue',
    },
    {
      id: 's-4',
      studentId: '#HPS-6612',
      name: 'Ananya Varma',
      initials: 'AV',
      grade: 'Class 4-B',
      mode: 'Bus #03',
      verifier: 'Staff PIN #4021',
      status: 'Verified & Boarded',
    },
  ]);

  const [inputStudentId, setInputStudentId] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [terminalMessage, setTerminalMessage] = useState<string | null>(null);

  const [smsStream, setSmsStream] = useState<SmsEvent[]>([
    {
      id: 'sms-1',
      timestamp: 'Just now',
      studentName: 'Aarav Reddy',
      phoneNumber: '+91 98765 •••••',
      messageSnippet: 'SafeKey Alert: Aarav has boarded Bus #03 with driver Venkat R.',
      status: 'delivered',
    },
    {
      id: 'sms-2',
      timestamp: '2 mins ago',
      studentName: 'Diya Sharma',
      phoneNumber: '+91 99887 •••••',
      messageSnippet: 'SafeKey Alert: Diya released to verified guardian at Gate Bay 2.',
      status: 'delivered',
    },
    {
      id: 'sms-3',
      timestamp: '5 mins ago',
      studentName: 'Ananya Varma',
      phoneNumber: '+91 91234 •••••',
      messageSnippet: 'SafeKey Alert: Ananya has boarded Bus #03 at Bay 3.',
      status: 'delivered',
    },
  ]);

  const handleAuthorizeTerminal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputStudentId) {
      alert('Please enter a Student ID or scan RFID badge.');
      return;
    }

    const matched = students.find(
      (s) => s.studentId.toLowerCase() === inputStudentId.toLowerCase() || s.name.toLowerCase().includes(inputStudentId.toLowerCase()),
    );

    const studentName = matched ? matched.name : inputStudentId;

    if (matched) {
      setStudents(
        students.map((s) =>
          s.id === matched.id
            ? { ...s, status: 'Verified & Boarded', verifier: `Staff PIN #${inputPin || '4021'}` }
            : s,
        ),
      );
    }

    const newSms: SmsEvent = {
      id: `sms-${Date.now()}`,
      timestamp: 'Just now',
      studentName,
      phoneNumber: '+91 98480 •••••',
      messageSnippet: `SafeKey Alert: ${studentName} verified and released via Gate Terminal PIN.`,
      status: 'delivered',
    };

    setSmsStream([newSms, ...smsStream]);
    setTerminalMessage(`Authorization verified for ${studentName}. Dual-PIN validated and parent SMS dispatched.`);
    setInputStudentId('');
    setInputPin('');
  };

  const handleLogDeparture = (bayNum: string) => {
    setBays(
      bays.map((b) =>
        b.bayNumber === bayNum
          ? { ...b, status: 'DEPARTED', leftAt: 'Just Now', borderColor: 'border-primary' }
          : b,
      ),
    );
    setStats((prev) => ({
      ...prev,
      busesDeparted: Math.min(prev.busesTotal, prev.busesDeparted + 1),
      gateQueueStatus: 'All Bays Normal',
    }));
    setTerminalMessage(`${bayNum} departure logged! Automatic perimeter geo-fence tracking activated.`);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Top Banner / Headline */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">clear_day</span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Dismissal Operations Desk</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-headline text-primary-text tracking-tight">
            Afternoon Release &amp; Bay Dismissal
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Real-time bus bay loading, Staff PIN &amp; OTP dual verification terminal, and automated parent SMS release notifications.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#eff6eb] border border-primary/20 px-4 py-2 rounded-full text-primary text-xs font-bold font-headline shadow-sm">
          <span className="material-symbols-outlined text-base">verified_user</span>
          <span>Dual Verification Active • Gate 2</span>
        </div>
      </div>

      {terminalMessage && (
        <div className="p-4 bg-[#eff6eb] border border-primary/20 text-primary-text rounded-2xl text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
            <span>{terminalMessage}</span>
          </div>
          <button onClick={() => setTerminalMessage(null)} className="text-xs font-bold text-primary hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Stats Row (Exact Stitch Pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Dismissal */}
        <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-surface-container-high/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider mb-1">Total Dismissal</p>
            <h3 className="text-3xl font-black font-headline text-primary-text">{stats.totalDismissal.toLocaleString()}</h3>
            <p className="text-xs text-primary font-bold flex items-center mt-1.5 gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span> 98% on track
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
        </div>

        {/* Buses Departed */}
        <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-surface-container-high/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider mb-1">Buses Departed</p>
            <h3 className="text-3xl font-black font-headline text-primary-text">
              {stats.busesDeparted} / {stats.busesTotal}
            </h3>
            <p className="text-xs text-secondary-text font-medium mt-1.5">
              {stats.busesTotal - stats.busesDeparted} buses currently loading
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-secondary-container/50 flex items-center justify-center text-primary-text">
            <span className="material-symbols-outlined text-2xl">directions_bus</span>
          </div>
        </div>

        {/* Gate Queue Status */}
        <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-surface-container-high/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider mb-1">Gate Queue Status</p>
            <h3 className="text-2xl font-black font-headline text-amber-700">{stats.gateQueueStatus}</h3>
            <p className="text-xs text-secondary-text font-medium mt-1.5">Est. clear in 4 mins</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sun-gold/20 flex items-center justify-center text-amber-800">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
        </div>

        {/* SMS Dispatches */}
        <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-surface-container-high/60 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider mb-1">SMS Dispatches</p>
            <h3 className="text-3xl font-black font-headline text-primary-text">{stats.smsDispatched.toLocaleString()}</h3>
            <p className="text-xs text-primary font-bold flex items-center mt-1.5 gap-1">
              <span className="material-symbols-outlined text-sm">mark_email_read</span> 100% Delivery Rate
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">sms</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (7 cols) & Right Column (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Bus Bay Allocation & Live Verification Table */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Bus Bay Allocation Card */}
          <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-surface-container-high/60">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
              <div>
                <h3 className="text-lg font-bold font-headline text-primary-text">Bus Bay Allocation (Gate 2)</h3>
                <p className="text-xs text-secondary-text">Real-time loading status and driver verification</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-surface-container-lowest px-3 py-1.5 rounded-xl text-xs font-bold text-primary-text hover:bg-surface-container-high transition-all border border-surface-container-high/60">
                  All Bays
                </button>
                <button className="bg-primary text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm font-headline">
                  Active Loading
                </button>
              </div>
            </div>

            {/* Bays Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bays.map((bay) => {
                const isLoading = bay.status === 'LOADING';
                return (
                  <div
                    key={bay.id}
                    className={`bg-surface-container-lowest rounded-xl p-4 flex flex-col justify-between border-l-4 ${bay.borderColor} ${
                      isLoading ? 'ring-2 ring-sun-gold/30 shadow-sm' : 'border-surface-container-high/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold font-headline text-primary-text">{bay.bayNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isLoading
                              ? 'bg-sun-gold/20 text-amber-900 border border-sun-gold/40'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}
                        >
                          {bay.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-primary-text line-clamp-1">{bay.route}</p>
                      <p className="text-[11px] text-secondary-text mt-0.5">Driver: {bay.driver} • {bay.kidsCount} Kids</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-surface-container-high/40 flex items-center justify-between text-xs">
                      {isLoading ? (
                        <>
                          <span className="text-[11px] text-secondary-text font-bold">PIN Verified</span>
                          <button
                            onClick={() => handleLogDeparture(bay.bayNumber)}
                            className="bg-primary hover:bg-primary-container text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                          >
                            Log Departure
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] text-secondary-text">Left at {bay.leftAt}</span>
                          <span className="text-primary font-bold flex items-center gap-1 text-[11px]">
                            <span className="material-symbols-outlined text-xs">done_all</span>
                            SMS Sent
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Student Release Queue Table */}
          <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-surface-container-high/60">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
              <div>
                <h3 className="text-lg font-bold font-headline text-primary-text">Afternoon Release Verification</h3>
                <p className="text-xs text-secondary-text">Staff PIN/OTP scan logs for individual pick-ups and bus boarding</p>
              </div>
              <div className="bg-surface-container-lowest px-3 py-1.5 rounded-xl flex items-center border border-surface-container-high/60 text-xs">
                <span className="material-symbols-outlined text-secondary-text text-base mr-2">search</span>
                <input
                  type="text"
                  placeholder="Search student or route..."
                  className="bg-transparent border-none outline-none text-xs text-primary-text w-40"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-surface-container-high/60 text-secondary-text font-bold uppercase tracking-wider text-[11px]">
                    <th className="pb-3 font-headline">Student Name</th>
                    <th className="pb-3 font-headline">Grade/Sec</th>
                    <th className="pb-3 font-headline">Mode</th>
                    <th className="pb-3 font-headline">Verifier / PIN</th>
                    <th className="pb-3 font-headline">Status</th>
                    <th className="pb-3 font-headline text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-high/40">
                  {students.map((student) => {
                    const isBoarded = student.status === 'Verified & Boarded';
                    const isReleased = student.status === 'Released';
                    return (
                      <tr key={student.id} className="hover:bg-surface-container-lowest/70 transition-colors">
                        <td className="py-3.5 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary-container/60 text-primary-text flex items-center justify-center font-bold text-xs">
                            {student.initials}
                          </div>
                          <div>
                            <p className="font-bold text-primary-text font-headline text-xs">{student.name}</p>
                            <p className="text-[10px] text-secondary-text font-mono">ID: {student.studentId}</p>
                          </div>
                        </td>
                        <td className="py-3.5 text-secondary-text font-medium">{student.grade}</td>
                        <td className="py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            student.mode === 'Parent Pick'
                              ? 'bg-sun-gold/20 text-amber-900 border border-sun-gold/30'
                              : 'bg-surface-container-lowest text-primary border border-surface-container-high/60'
                          }`}>
                            {student.mode}
                          </span>
                        </td>
                        <td className="py-3.5 font-mono text-secondary-text text-[11px]">{student.verifier}</td>
                        <td className="py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isBoarded || isReleased
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-surface-container-lowest text-secondary-text border border-surface-container-high/60'
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          {student.status === 'In Queue' ? (
                            <button
                              onClick={() => {
                                setInputStudentId(student.studentId);
                                setInputPin('4021');
                              }}
                              className="bg-primary hover:bg-primary-container text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs transition-all"
                            >
                              Verify PIN
                            </button>
                          ) : (
                            <button className="text-primary hover:underline font-bold text-xs">
                              Details
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Staff PIN/OTP Terminal & SMS Dispatch Feed */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Quick Verification Terminal Card (Exact Deep Blue Stitch Design) */}
          <div className="bg-deep-blue text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-primary/30 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold font-headline text-white">Staff PIN &amp; OTP Terminal</h3>
                <span className="bg-primary text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  Gate 2 Active
                </span>
              </div>
              <p className="text-xs text-white/70 mb-5 leading-relaxed">
                Enter student ID or scan RFID badge, followed by staff verification PIN to authorize immediate afternoon release.
              </p>

              <form onSubmit={handleAuthorizeTerminal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 font-headline">
                    Student ID / RFID Tag
                  </label>
                  <input
                    type="text"
                    value={inputStudentId}
                    onChange={(e) => setInputStudentId(e.target.value)}
                    placeholder="e.g. #HPS-7734 or Student Name"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/80 mb-1 font-headline">
                    Staff PIN or Guardian OTP
                  </label>
                  <input
                    type="password"
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    placeholder="••••"
                    maxLength={6}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:border-primary focus:ring-1 focus:ring-primary tracking-widest text-base font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-container text-white font-bold font-headline py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs"
                >
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>Authorize Release &amp; Dispatch SMS</span>
                </button>
              </form>
            </div>
          </div>

          {/* Automated SMS Dispatch Feed */}
          <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-surface-container-high/60 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-surface-container-high/40">
                <h3 className="text-base font-bold font-headline text-primary-text">Live SMS Dispatch Stream</h3>
                <span className="text-xs text-primary font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  Connected
                </span>
              </div>

              <div className="space-y-3">
                {smsStream.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-surface-container-lowest rounded-xl border border-surface-container-high/40 text-xs space-y-1 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary-text font-headline">{item.studentName}</span>
                      <span className="text-[10px] text-secondary-text">{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-secondary-text leading-snug">{item.messageSnippet}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-primary font-bold">
                      <span className="font-mono text-secondary-text">{item.phoneNumber}</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">done_all</span>
                        Delivered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-surface-container-high/40 text-center">
              <span className="text-[11px] text-secondary-text">
                All communications audited via Twilio &amp; DLT Registration.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
