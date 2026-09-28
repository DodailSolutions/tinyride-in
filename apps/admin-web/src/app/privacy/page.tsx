import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Mail } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | TinyRide',
  description: 'Privacy Policy for TinyRide school transportation platform. Understand how we collect, use, and protect your family and student transit data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide — School transportation and live ride tracking"
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-white border-b border-slate-200/80 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-200/80 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            This policy describes how TinyRide collects, uses, protects, and discloses your information when you use our school transportation platform and applications.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
            <span><strong>Last updated:</strong> September 28, 2026</span>
            <span>•</span>
            <span>Dodail Solutions Private Limited</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10 text-sm leading-relaxed text-slate-700">
        {/* Section 1: Introduction */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">1.</span> Introduction
          </h2>
          <p>
            TinyRide (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), operated by Dodail Solutions Private Limited, provides a software platform designed to coordinate school commutes for parents, partner schools, and verified drivers. We understand that your child&apos;s daily safety and privacy are paramount.
          </p>
          <p>
            This Privacy Policy explains our practices regarding data collected through the TinyRide mobile applications, parent portal, driver interface, and website (collectively, the &quot;Service&quot;). By creating an account or using TinyRide, you consent to the collection and use of information in accordance with this policy.
          </p>
        </section>

        {/* Section 2: Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">2.</span> Information We Collect
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#006B2F]" />
                Account Information
              </h3>
              <p className="text-xs text-slate-600">
                When you register as a parent or driver, we collect your phone number, full name, optional email address, and authentication tokens (e.g. OTP verification records).
              </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#006B2F]" />
                Child &amp; School Details
              </h3>
              <p className="text-xs text-slate-600">
                Child’s first name, grade, assigned school campus, scheduled pickup stop location, optional medical allergy notes, and generated SafeKey verification tokens.
              </p>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#006B2F]" />
              Vehicle &amp; Location Information
            </h3>
            <p className="text-xs text-slate-600">
              During active school commute runs, our driver applications transmit high-precision vehicle GPS coordinates, vehicle speed, heading, and stop timestamps. We do <strong>not</strong> track parents&apos; personal GPS locations in the background; vehicle GPS is collected exclusively from active in-service vehicle runs.
            </p>
          </div>
        </section>

        {/* Section 3: How We Use Information */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">3.</span> How We Use Information
          </h2>
          <p>We use the collected information strictly for operational transportation purposes:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>Providing live vehicle tracking and estimated time of arrival (ETA) calculation.</li>
            <li>Confirming student boarding and drop-off through SafeKey verification tokens.</li>
            <li>Dispatching automated proximity alerts (e.g. 500m vehicle approach notifications).</li>
            <li>Enabling parents to record scheduled absences so drivers do not wait unnecessarily.</li>
            <li>Enabling schools to coordinate arrival bus bays and monitor transit punctuality.</li>
            <li>Ensuring technical stability, preventing fraud, and resolving route disruptions.</li>
          </ul>
        </section>

        {/* Section 4: Data Sharing & Service Providers */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">4.</span> Data Sharing &amp; Third Parties
          </h2>
          <p>
            We do <strong>not</strong> sell, rent, or monetize personal student or parent information to advertisers or marketing networks. Information is shared strictly under the following circumstances:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li><strong>With Your Partner School:</strong> School transport administrators can access student manifest lists, assigned routes, and arrival timestamps.</li>
            <li><strong>With Assigned Drivers:</strong> Drivers receive designated pickup stop addresses, student first names, and SafeKey verification codes for active routes. Drivers do not have access to permanent parent records or sensitive private notes.</li>
            <li><strong>Service Infrastructure Providers:</strong> Trusted cloud infrastructure, SMS/OTP dispatch gateways, and mapping APIs operating under strict contractual data protection agreements.</li>
            <li><strong>Legal &amp; Safety Requirements:</strong> We may disclose information if required by applicable law, court order, or to protect the vital safety interests of students and the public.</li>
          </ul>
        </section>

        {/* Section 5: Data Security & Retention */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">5.</span> Data Security &amp; Retention
          </h2>
          <p>
            We implement administrative, technical, and physical safeguards designed to protect personal information from unauthorized access, loss, alteration, or disclosure. All data transmissions are encrypted using standard Transport Layer Security (TLS 1.3/HTTPS).
          </p>
          <p>
            Trip telemetry data (GPS coordinates) is retained for operational audit and customer support purposes for a rolling window of [Retention Period: Subject to regulatory confirmation / 90 days], after which granular GPS points are archived or aggregated. Account profiles remain active for the duration of the student&apos;s enrollment in the transport program.
          </p>
        </section>

        {/* Section 6: Children's Information & Parent Rights */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">6.</span> Children’s Information &amp; Parent Rights
          </h2>
          <p>
            TinyRide accounts are created exclusively by parents, legal guardians, or educational institutions. We do not knowingly permit minors under the age of majority to create independent accounts. Student transportation profiles are managed directly by the child’s authorized parent or school.
          </p>
          <p>
            As a parent or guardian, you have the right to review the information stored regarding your child, request corrections to erroneous details, or request deletion of your account upon withdrawing from the transportation program.
          </p>
        </section>

        {/* Section 7: Cookies and Tracking */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">7.</span> Cookies &amp; Local Storage
          </h2>
          <p>
            We use essential session tokens and local storage strictly to keep you authenticated across page reloads, remember your child selection, and support offline Progressive Web App (PWA) functionality. We do not use third-party behavioral advertising cookies.
          </p>
        </section>

        {/* Section 8: Changes to This Policy */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">8.</span> Changes to This Privacy Policy
          </h2>
          <p>
            We may update our Privacy Policy periodically to reflect changes in our service or legal obligations. We will notify you of material changes by posting the updated policy on this page with a revised &quot;Last updated&quot; date and, where appropriate, through an in-app notice or SMS/email communication.
          </p>
        </section>

        {/* Section 9: Contact */}
        <section className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#006B2F]" />
            9. Contact Us
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact our privacy desk:
          </p>
          <div className="text-xs space-y-1 text-slate-700 font-medium">
            <p><strong>Entity:</strong> Dodail Solutions Private Limited</p>
            <p><strong>Email:</strong> privacy@tinyride.in / support@tinyride.in</p>
            <p><strong>Address:</strong> Hyderabad, Telangana, India [Registered office address placeholder for legal review]</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-2">
        <p>© {new Date().getFullYear()} TinyRide by Dodail Solutions Private Limited. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 text-slate-600 font-medium">
          <Link href="/terms" className="hover:text-emerald-800 transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="text-emerald-800 font-bold">Privacy Policy</Link>
          <span>•</span>
          <Link href="/parents" className="hover:text-emerald-800 transition-colors">For Parents</Link>
        </div>
      </footer>
    </div>
  );
}
