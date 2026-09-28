import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TinyRide for Schools | School Transportation Management',
  description:
    'TinyRide helps schools manage routes, drivers, vehicles, student transportation and live school ride updates from one connected platform.',
  alternates: {
    canonical: 'https://tinyride.in/schools',
  },
  openGraph: {
    title: 'TinyRide for Schools | School Transportation Management',
    description:
      'TinyRide helps schools manage routes, drivers, vehicles, student transportation and live school ride updates from one connected platform.',
    url: 'https://tinyride.in/schools',
    siteName: 'TinyRide',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/brand/logo-horizontal.png',
        width: 1200,
        height: 630,
        alt: 'TinyRide for Schools — School Transportation Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TinyRide for Schools | School Transportation Management',
    description:
      'TinyRide helps schools manage routes, drivers, vehicles, student transportation and live school ride updates from one connected platform.',
    images: ['/brand/logo-horizontal.png'],
  },
};

export default function SchoolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'TinyRide for Schools',
            operatingSystem: 'All (Web & Mobile Browser)',
            applicationCategory: 'BusinessApplication',
            description:
              'TinyRide helps schools manage routes, drivers, vehicles, student transportation and live school ride updates from one connected platform.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'INR',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
