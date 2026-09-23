'use client';

import React, { useState } from 'react';

interface RosterStudent {
  childId: string;
  fullName: string;
  grade: string;
  dateOfBirth: string;
  assignedRoute: string;
  designatedStop: string;
  medicalNotes?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  status: 'active' | 'suspended';
}

export default function StudentRosterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [medicalOnly, setMedicalOnly] = useState(false);

  const initialStudents: RosterStudent[] = [
    {
      childId: 'c-1',
      fullName: 'Aarav Sharma',
      grade: 'Grade 3A',
      dateOfBirth: '2016-04-12',
      assignedRoute: 'Jubilee Hills Morning Run 1',
      designatedStop: 'Road No. 36 Junction',
      medicalNotes: 'Asthma inhaler in bag - keep accessible',
      emergencyContact: {
        name: 'Priya Sharma',
        relationship: 'Mother',
        phone: '+91 98765 43210',
      },
      status: 'active',
    },
    {
      childId: 'c-2',
      fullName: 'Diya Patel',
      grade: 'Grade 4B',
      dateOfBirth: '2015-08-22',
      assignedRoute: 'Jubilee Hills Morning Run 1',
      designatedStop: 'Checkpost Circle',
      emergencyContact: {
        name: 'Karan Patel',
        relationship: 'Father',
        phone: '+91 98765 43211',
      },
      status: 'active',
    },
    {
      childId: 'c-3',
      fullName: 'Rohan Verma',
      grade: 'Grade 2C',
      dateOfBirth: '2017-02-14',
      assignedRoute: 'Jubilee Hills Morning Run 1',
      designatedStop: 'Apollo Hospitals Gate 2',
      medicalNotes: 'Severe Peanut & Nut Allergy',
      emergencyContact: {
        name: 'Sunita Verma',
        relationship: 'Mother',
        phone: '+91 98765 43212',
      },
      status: 'active',
    },
    {
      childId: 'c-4',
      fullName: 'Ananya Reddy',
      grade: 'Grade 5A',
      dateOfBirth: '2014-11-05',
      assignedRoute: 'Madhapur Express 2',
      designatedStop: 'Hitec City Metro Pillar 24',
      emergencyContact: {
        name: 'Vikram Reddy',
        relationship: 'Father',
        phone: '+91 98765 43213',
      },
      status: 'active',
    },
    {
      childId: 'c-5',
      fullName: 'Kabir Mehta',
      grade: 'Grade 1A',
      dateOfBirth: '2018-06-30',
      assignedRoute: 'Madhapur Express 2',
      designatedStop: 'Cyber Towers Quad',
      medicalNotes: 'Motion sickness - front passenger seat requested',
      emergencyContact: {
        name: 'Neha Mehta',
        relationship: 'Mother',
        phone: '+91 98765 43214',
      },
      status: 'active',
    },
    {
      childId: 'c-6',
      fullName: 'Saanvi Gupta',
      grade: 'Grade 4B',
      dateOfBirth: '2015-09-18',
      assignedRoute: 'Gachibowli Ring Line 3',
      designatedStop: 'DLF CyberCity Main Gate',
      emergencyContact: {
        name: 'Amit Gupta',
        relationship: 'Father',
        phone: '+91 98765 43215',
      },
      status: 'active',
    },
    {
      childId: 'c-7',
      fullName: 'Vivaan Joshi',
      grade: 'Grade 3B',
      dateOfBirth: '2016-12-01',
      assignedRoute: 'Gachibowli Ring Line 3',
      designatedStop: 'Financial District Phase 1',
      medicalNotes: 'Lactose intolerance - emergency EpiPen with driver kit',
      emergencyContact: {
        name: 'Radhika Joshi',
        relationship: 'Mother',
        phone: '+91 98765 43216',
      },
      status: 'active',
    },
  ];

  const filteredStudents = initialStudents.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.emergencyContact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.assignedRoute.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = selectedGrade === 'all' || student.grade.startsWith(selectedGrade);
    const matchesMedical = !medicalOnly || Boolean(student.medicalNotes);

    return matchesSearch && matchesGrade && matchesMedical;
  });

  const totalMedicalAlerts = initialStudents.filter((s) => s.medicalNotes).length;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">groups</span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Student Transport Directory</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-headline text-primary-text tracking-tight">
            Enrolled Student Transport Roster
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Oakridge International School • Complete commuter profiles, guardian contacts, allergies, and bus route assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Exporting verified transport roster as CSV for Oakridge Gate Records...')}
            className="flex items-center gap-2 bg-surface-container-lowest border border-surface-container-high/60 hover:bg-surface-container-low text-primary-text px-4 py-2.5 rounded-xl text-xs font-bold font-headline shadow-xs transition-all"
          >
            <span className="material-symbols-outlined text-emerald-600 text-base">download</span>
            <span>Export Roster CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider mb-1">Total Enrolled Commuters</p>
            <p className="text-3xl font-black font-headline text-primary-text">{initialStudents.length}</p>
            <p className="text-xs text-secondary-text mt-1">Verified 2026 Academic Term</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">groups</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider mb-1">Medical Care Alerts</p>
            <p className="text-3xl font-black font-headline text-amber-700">{totalMedicalAlerts}</p>
            <p className="text-xs text-secondary-text mt-1">Allergies &amp; Emergency Kits on Board</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sun-gold/15 flex items-center justify-center text-amber-800">
            <span className="material-symbols-outlined text-2xl">medical_information</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider mb-1">Transit Clusters</p>
            <p className="text-3xl font-black font-headline text-primary">3 Route Networks</p>
            <p className="text-xs text-secondary-text mt-1">Jubilee, Madhapur &amp; Gachibowli</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-container/15 flex items-center justify-center text-primary-container">
            <span className="material-symbols-outlined text-2xl">alt_route</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high/60 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-secondary-text text-lg">search</span>
          <input
            type="text"
            placeholder="Search by student name, guardian, or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-surface-container-high/60 rounded-xl text-xs text-primary-text placeholder-secondary-text/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 border border-surface-container-high/60 rounded-xl px-3 py-2 bg-surface-container-low">
            <span className="material-symbols-outlined text-secondary-text text-base">filter_list</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-transparent text-xs font-bold text-primary-text outline-none cursor-pointer"
            >
              <option value="all">All Grades</option>
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
            </select>
          </div>

          <label className="flex items-center gap-2 border border-amber-200 bg-amber-50/70 rounded-xl px-3 py-2 text-xs font-bold text-amber-900 cursor-pointer">
            <input
              type="checkbox"
              checked={medicalOnly}
              onChange={(e) => setMedicalOnly(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <span className="material-symbols-outlined text-amber-700 text-sm">medical_services</span>
            <span>Medical Alerts Only</span>
          </label>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-container-high/40 text-secondary-text font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-6 font-headline">Student Details</th>
                <th className="py-4 px-6 font-headline">Grade / Age</th>
                <th className="py-4 px-6 font-headline">Assigned Route &amp; Stop</th>
                <th className="py-4 px-6 font-headline">Medical &amp; Safety Tags</th>
                <th className="py-4 px-6 font-headline">Guardian Contact</th>
                <th className="py-4 px-6 font-headline text-center">Enrollment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high/30">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-secondary-text">
                    <span className="material-symbols-outlined text-3xl text-secondary-text/40 mb-1">person_off</span>
                    <p>No students match the selected filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.childId} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-headline">
                          {student.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <p className="font-bold text-primary-text font-headline text-sm">{student.fullName}</p>
                          <p className="text-[11px] text-secondary-text font-mono">ID: {student.childId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-bold text-primary-text">{student.grade}</span>
                      <p className="text-[11px] text-secondary-text font-mono">DOB: {student.dateOfBirth}</p>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-bold text-primary">
                        <span className="material-symbols-outlined text-sm">directions_bus</span>
                        <span>{student.assignedRoute}</span>
                      </div>
                      <p className="text-secondary-text text-[11px] mt-0.5">{student.designatedStop}</p>
                    </td>

                    <td className="py-4 px-6">
                      {student.medicalNotes ? (
                        <div className="flex items-start gap-1.5 text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg text-[11px]">
                          <span className="material-symbols-outlined text-amber-700 text-xs shrink-0 mt-0.5">medical_information</span>
                          <span className="font-medium">{student.medicalNotes}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-secondary-text/70 italic">None noted</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold text-primary-text text-xs">
                          {student.emergencyContact.name} ({student.emergencyContact.relationship})
                        </p>
                        <a
                          href={`tel:${student.emergencyContact.phone}`}
                          className="flex items-center gap-1 text-[11px] text-primary hover:underline font-mono mt-0.5 font-bold"
                        >
                          <span className="material-symbols-outlined text-xs">call</span>
                          <span>{student.emergencyContact.phone}</span>
                        </a>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[#eff6eb] text-primary border border-primary/20">
                        <span className="material-symbols-outlined text-xs">check</span>
                        Enrolled
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
