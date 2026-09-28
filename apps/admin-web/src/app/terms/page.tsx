import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Mail } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | TinyRide',
  description: 'Terms of Service governing the use of TinyRide school transportation platform, parent application, and driver dispatch software.',
};

export default function TermsOfServicePage() {
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
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>Legal Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Please read these terms carefully before accessing or using the TinyRide software platform, parent mobile application, or driver tracking tools.
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
        {/* Section 1: Acceptance of Terms */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">1.</span> Acceptance of Terms
          </h2>
          <p>
            By accessing or using the TinyRide application, mobile web interface, or associated software products provided by Dodail Solutions Private Limited (&quot;TinyRide,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be legally bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service.
          </p>
        </section>

        {/* Section 2: TinyRide Service Scope */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">2.</span> The TinyRide Service
          </h2>
          <p>
            TinyRide provides a technology platform facilitating communication, live GPS ride tracking, student boarding verification (SafeKey), and ETA calculation between parents, participating schools, and authorized transportation operators.
          </p>
          <p className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 font-medium">
            <strong>Important Operational Notice:</strong> TinyRide provides coordination software and digital tracking tools. Unless explicitly specified in a direct service contract, physical vehicles and drivers are operated by participating schools or licensed third-party fleet operators.
          </p>
        </section>

        {/* Section 3: Parent Accounts */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">3.</span> Parent Accounts &amp; Registration
          </h2>
          <p>
            To use the parent tracking features, you must register using a valid mobile phone number and verify ownership via a One-Time Password (OTP). You agree to provide accurate and truthful details regarding your child&apos;s name, grade, school, and designated pickup stop.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>You are responsible for maintaining the confidentiality of your session and devices.</li>
            <li>You must notify us immediately if you suspect unauthorized access to your account.</li>
            <li>Accounts cannot be transferred or shared outside your immediate family or authorized guardians.</li>
          </ul>
        </section>

        {/* Section 4: School Transportation Coordination */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">4.</span> School Transportation &amp; Boarding Verification
          </h2>
          <p>
            TinyRide enables SafeKey boarding confirmation and proximity alerts. Parents agree to accompany younger children to the designated pickup stop punctually according to the estimated arrival time.
          </p>
          <p>
            If your child will be absent, you should record the absence in the TinyRide parent interface prior to the morning route departure so the vehicle route does not incur unnecessary delays.
          </p>
        </section>

        {/* Section 5: Driver & Vehicle Information */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">5.</span> Driver &amp; Vehicle Information
          </h2>
          <p>
            TinyRide displays assigned driver names, contact details, vehicle registration numbers, and route codes as provided by the school or transport operator. Contacting the driver should be reserved for urgent commute coordination. Drivers must not be called or distracted while actively operating a moving vehicle.
          </p>
        </section>

        {/* Section 6: Acceptable Use */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">6.</span> Acceptable Use Policy
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
            <li>Reverse engineer, decompile, or extract the source code of the TinyRide applications or telemetry protocols.</li>
            <li>Transmit artificial location coordinates or disrupt real-time GPS synchronization.</li>
            <li>Harass, abuse, or intimidate drivers, school staff, or other parents through the platform.</li>
            <li>Use the service for unauthorized commercial distribution or data scraping.</li>
          </ul>
        </section>

        {/* Section 7: Notifications & Location Telemetry */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">7.</span> Notifications &amp; Location Accuracy
          </h2>
          <p>
            Estimated arrival times and live vehicle locations rely on cellular network connectivity, GPS satellite signals, and traffic conditions. While TinyRide employs advanced corridor algorithms to deliver precise ETAs, temporary network blind spots or heavy congestion may occasionally impact real-time refresh rates.
          </p>
        </section>

        {/* Section 8: Service Availability & Modifications */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">8.</span> Service Availability &amp; Modifications
          </h2>
          <p>
            We strive to provide uninterrupted service during school operating hours. We reserve the right to modify, suspend, or update features to enhance reliability, performance, or security, with reasonable prior notice for scheduled maintenance where practical.
          </p>
        </section>

        {/* Section 9: Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">9.</span> Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by applicable law, TinyRide and Dodail Solutions Private Limited shall not be liable for indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the software platform, including delays caused by severe weather, road blockages, cellular network outages, or third-party vehicle malfunctions.
          </p>
        </section>

        {/* Section 10: Account Suspension */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">10.</span> Account Termination &amp; Suspension
          </h2>
          <p>
            We reserve the right to suspend or terminate access to TinyRide if a user violates these Terms, attempts unauthorized platform access, or upon request from the registered partner school coordinating the student&apos;s enrollment.
          </p>
        </section>

        {/* Section 11: Governing Law */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="text-[#006B2F]">11.</span> Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Hyderabad, Telangana, India.
          </p>
        </section>

        {/* Section 12: Contact */}
        <section className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#006B2F]" />
            12. Contact Information &amp; Grievance
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            For legal inquiries, terms interpretation, or grievance redressal, please contact:
          </p>
          <div className="text-xs space-y-1 text-slate-700 font-medium">
            <p><strong>Entity:</strong> Dodail Solutions Private Limited</p>
            <p><strong>Email:</strong> legal@tinyride.in / support@tinyride.in</p>
            <p><strong>Grievance Officer:</strong> Legal Officer, Dodail Solutions [Designation placeholder for legal review]</p>
            <p><strong>Jurisdiction:</strong> Hyderabad, Telangana, India</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 space-y-2">
        <p>© {new Date().getFullYear()} TinyRide by Dodail Solutions Private Limited. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 text-slate-600 font-medium">
          <Link href="/terms" className="text-emerald-800 font-bold">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-emerald-800 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/parents" className="hover:text-emerald-800 transition-colors">For Parents</Link>
        </div>
      </footer>
    </div>
  );
}
