import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TinyRide for Parents | School Ride Tracking & Safety',
  description:
    "Track your child's school ride with TinyRide. See the vehicle, driver, ETA, boarding status and school arrival updates in one simple parent experience.",
  alternates: {
    canonical: 'https://tinyride.in/parents',
  },
  openGraph: {
    title: 'TinyRide for Parents | School Ride Tracking & Safety',
    description:
      "Track your child's school ride with TinyRide. See the vehicle, driver, ETA, boarding status and school arrival updates in one simple parent experience.",
    url: 'https://tinyride.in/parents',
    siteName: 'TinyRide',
  },
};

export default function ParentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
