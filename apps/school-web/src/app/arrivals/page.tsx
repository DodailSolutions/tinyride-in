'use client';

import React, { useState } from 'react';

interface ArrivalStudent {
  tripChildId: string;
  childId: string;
  childName: string;
  grade: string;
  status: 'picked_up' | 'at_school';
  isAbsent: boolean;
  medicalNotes?: string;
  arrivedAt?: string;
}

interface InboundVan {
  tripId: string;
  tripNumber: string;
  routeName: string;
  driverName: string;
  driverPhone: string;
  vehicleRegistration: string;
  vehicleType: string;
  students: ArrivalStudent[];
}

export default function MorningArrivalsPage() {
  const [vans, setVans] = useState<InboundVan[]>([
    {
      tripId: 'trip-1',
      tripNumber: 'TRIP-HYD-001',
      routeName: 'Jubilee Hills Morning Run 1',
      driverName: 'Suresh Kumar',
      driverPhone: '+91 98765 43210',
      vehicleRegistration: 'TS09UB9876',
      vehicleType: 'van',
      students: [
        {
          tripChildId: 'tc-1',
          childId: 'c-1',
          childName: 'Aarav Sharma',
          grade: 'Grade 3A',
          status: 'at_school',
          isAbsent: false,
          medicalNotes: 'Asthma inhaler in bag',
          arrivedAt: '08:04 AM',
        },
        {
          tripChildId: 'tc-2',
          childId: 'c-2',
          childName: 'Diya Patel',
          grade: 'Grade 4B',
          status: 'picked_up',
          isAbsent: false,
        },
        {
          tripChildId: 'tc-3',
          childId: 'c-3',
          childName: 'Rohan Verma',
          grade: 'Grade 2C',
          status: 'picked_up',
          isAbsent: false,
        },
      ],
    },
    {
      tripId: 'trip-2',
      tripNumber: 'TRIP-HYD-002',
      routeName: 'Madhapur Express 2',
      driverName: 'Venkat Rao',
      driverPhone: '+91 99887 76655',
      vehicleRegistration: 'TS08UA4321',
      vehicleType: 'auto',
      students: [
        {
          tripChildId: 'tc-4',
          childId: 'c-4',
          childName: 'Ananya Reddy',
          grade: 'Grade 5A',
          status: 'at_school',
          isAbsent: false,
          arrivedAt: '08:10 AM',
        },
        {
          tripChildId: 'tc-5',
          childId: 'c-5',
          childName: 'Kavya Rao',
          grade: 'Grade 3B',
          status: 'at_school',
          isAbsent: false,
          arrivedAt: '08:10 AM',
        },
      ],
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const handleConfirmStudent = (tripId: string, tripChildId: string, studentName: string) => {
    const timeNow = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setVans(
      vans.map((v) => {
        if (v.tripId !== tripId) return v;
        return {
          ...v,
          students: v.students.map((s) =>
            s.tripChildId === tripChildId
              ? { ...s, status: 'at_school', arrivedAt: timeNow }
              : s,
          ),
        };
      }),
    );

    setNotification(`Gate receipt recorded for ${studentName} at ${timeNow}. Parent notified instantly via TinyRide push notification.`);
  };

  const handleConfirmAllInVan = (tripId: string, vanPlate: string) => {
    const timeNow = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setVans(
      vans.map((v) => {
        if (v.tripId !== tripId) return v;
        return {
          ...v,
          students: v.students.map((s) => ({
            ...s,
            status: 'at_school',
            arrivedAt: s.arrivedAt || timeNow,
          })),
        };
      }),
    );

    setNotification(`All students in vehicle ${vanPlate} marked as safely received at school gate.`);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">wb_sunny</span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Morning Arrival &amp; Gate Intake</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-headline text-primary-text tracking-tight">
            Morning Gate Intake &amp; Check-In
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Verify arriving students from TinyRide vehicles. Gate check-in immediately dispatches parent push notification &amp; SMS.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#eff6eb] border border-primary/20 px-4 py-2 rounded-full text-primary text-xs font-bold font-headline shadow-sm">
          <span className="material-symbols-outlined text-base">timer</span>
          <span>Gate Cut-Off: 08:30 AM (On Schedule)</span>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-[#eff6eb] border border-primary/20 text-primary-text rounded-2xl text-sm font-medium flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-bold text-primary hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Vans Intake List */}
      <div className="space-y-6">
        {vans.map((van) => {
          const totalInVan = van.students.length;
          const arrivedInVan = van.students.filter((s) => s.status === 'at_school').length;
          const allArrived = totalInVan > 0 && arrivedInVan === totalInVan;

          return (
            <div
              key={van.tripId}
              className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm p-6 space-y-5 transition-all hover:shadow-md"
            >
              {/* Van Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-surface-container-high/40 gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container-low border border-surface-container-high/60 flex items-center justify-center text-primary font-bold">
                    <span className="material-symbols-outlined text-2xl">directions_bus</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold font-headline text-lg text-primary-text">{van.routeName}</h3>
                      <span className="font-mono text-xs bg-surface-container-low px-2.5 py-0.5 rounded-md font-bold text-secondary-text border border-surface-container-high/40">
                        {van.vehicleRegistration}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-text mt-0.5 flex items-center gap-2">
                      <span>Driver: <strong className="text-primary-text">{van.driverName}</strong></span>
                      <span>•</span>
                      <span className="font-mono">{van.driverPhone}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-headline text-secondary-text bg-surface-container-low px-3.5 py-2 rounded-xl border border-surface-container-high/40">
                    {arrivedInVan} of {totalInVan} Received
                  </span>
                  {!allArrived && (
                    <button
                      onClick={() => handleConfirmAllInVan(van.tripId, van.vehicleRegistration)}
                      className="px-4 py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold font-headline shadow-sm hover:shadow transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">done_all</span>
                      <span>Check-In All ({totalInVan})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Student Checklist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {van.students.map((student) => {
                  const isReceived = student.status === 'at_school';
                  return (
                    <div
                      key={student.tripChildId}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                        isReceived
                          ? 'bg-[#eff6eb] border-primary/20 shadow-xs'
                          : 'bg-surface-container-lowest border-surface-container-high/60 hover:border-surface-container-high'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold font-headline text-sm text-primary-text">{student.childName}</h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isReceived
                                ? 'bg-primary/10 text-primary border border-primary/20'
                                : 'bg-sun-gold/15 text-amber-800 border border-sun-gold/30'
                            }`}
                          >
                            {isReceived ? 'At School' : 'In Transit'}
                          </span>
                        </div>
                        <p className="text-xs text-secondary-text mt-0.5">{student.grade}</p>

                        {student.medicalNotes && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200 px-2 py-1 rounded-lg mt-2 font-medium">
                            <span className="material-symbols-outlined text-amber-700 text-xs">medical_information</span>
                            <span className="truncate">{student.medicalNotes}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-surface-container-high/40 flex items-center justify-between">
                        {isReceived ? (
                          <span className="text-xs text-primary font-bold flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            <span>Arrived at {student.arrivedAt}</span>
                          </span>
                        ) : (
                          <button
                            onClick={() =>
                              handleConfirmStudent(
                                van.tripId,
                                student.tripChildId,
                                student.childName,
                              )
                            }
                            className="w-full py-2 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold font-headline shadow-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">check</span>
                            <span>Confirm Arrival Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
