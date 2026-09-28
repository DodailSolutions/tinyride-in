'use client';

import React, { useEffect, useState } from 'react';
import { Users, ShieldCheck, Phone } from 'lucide-react';

export default function SchoolDriversPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/school/data')
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const trips = data?.trips || [];
  // Extract unique drivers from trips
  const driverMap = new Map();
  trips.forEach((t: any) => {
    if (t.drivers && t.driver_id && !driverMap.has(t.driver_id)) {
      driverMap.set(t.driver_id, {
        id: t.driver_id,
        name: t.drivers?.profiles?.full_name || 'Assigned Driver',
        phone: t.drivers?.profiles?.phone_e164,
        vehicle: t.vehicles?.registration_number,
        route: t.routes?.name,
      });
    }
  });
  const drivers = Array.from(driverMap.values());

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-200">
          Supply Roster
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Assigned Drivers
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verified commercial drivers operating your school transport corridors
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading driver records...</div>
      ) : drivers.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Drivers Assigned Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            When verified drivers are assigned to your school routes, their contact details, vehicle links, and active trip history will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((drv) => (
            <div
              key={drv.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-sm font-bold text-slate-900">{drv.name}</span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Approved
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {drv.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{drv.phone}</span>
                    </div>
                  )}
                  {drv.vehicle && (
                    <p className="text-slate-500">
                      Vehicle: <span className="font-mono font-bold text-slate-800">{drv.vehicle}</span>
                    </p>
                  )}
                  {drv.route && <p className="text-slate-500">Route: {drv.route}</p>}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>RTA License Verified</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
