import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TinyRide for Parents | School Ride Tracking',
  description:
    "Track your child's school ride with TinyRide. See the vehicle, driver, ETA, boarding status and school arrival updates in one simple parent experience.",
  alternates: {
    canonical: 'https://tinyride.in/parents',
  },
  openGraph: {
    title: 'TinyRide for Parents | School Ride Tracking',
    description:
      "Track your child's school ride with TinyRide. See the vehicle, driver, ETA, boarding status and school arrival updates in one simple parent experience.",
    url: 'https://tinyride.in/parents',
    siteName: 'TinyRide',
    type: 'website',
    images: [
      {
        url: '/brand/logo-horizontal.png',
        width: 1200,
        height: 630,
        alt: 'TinyRide for Parents — School Ride Tracking',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TinyRide for Parents | School Ride Tracking',
    description:
      "Track your child's school ride with TinyRide. See the vehicle, driver, ETA, boarding status and school arrival updates in one simple parent experience.",
    images: ['/brand/logo-horizontal.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ParentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
