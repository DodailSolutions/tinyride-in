'use client';

import React, { useEffect, useState } from 'react';
import { GraduationCap } from 'lucide-react';

export default function SchoolStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/school/data')
      .then((res) => res.json())
      .then((data) => setStudents(data?.students || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-200">
          Student Roster
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Transport Enrolled Students
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Student manifests linked to authorized school route corridors and pickup landmarks
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading student records...</div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Students Enrolled in Transport Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            As parents register their children for school transportation and select designated pickup stops, student attendance logs will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Grade &amp; Section</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Transport Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {student.first_name} {student.last_name || ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {student.grade || '—'} {student.section || ''}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {student.school_roll_no || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {student.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
