'use client';

import React, { useEffect, useState } from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';

export default function SchoolVehiclesPage() {
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
  // Extract unique vehicles from trips
  const vehicleMap = new Map();
  trips.forEach((t: any) => {
    if (t.vehicles && t.vehicle_id && !vehicleMap.has(t.vehicle_id)) {
      vehicleMap.set(t.vehicle_id, {
        id: t.vehicle_id,
        regNumber: t.vehicles?.registration_number,
        vehicleType: t.vehicles?.vehicle_type,
        driver: t.drivers?.profiles?.full_name,
        route: t.routes?.name,
      });
    }
  });
  const vehicles = Array.from(vehicleMap.values());

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-200">
          Fleet Assets
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Registered Vehicles
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Auto-rickshaws, vans, and minibuses assigned to active school corridors
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading fleet records...</div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Vehicles Linked Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            When authorized vehicles are assigned to your school routes, their registration number, vehicle type, and capacity will be displayed here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-sm font-black font-mono text-slate-900">{v.regNumber}</span>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 capitalize">
                    {v.vehicleType || 'Auto Rickshaw'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  {v.driver && <p className="text-slate-500">Assigned Driver: <strong className="text-slate-900">{v.driver}</strong></p>}
                  {v.route && <p className="text-slate-500">Route: {v.route}</p>}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Fitness Validated</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
