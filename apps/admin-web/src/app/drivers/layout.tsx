import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TinyRide for Drivers | School Transportation Made Simple',
  description:
    'TinyRide helps school transportation drivers manage assigned routes, pickup stops, boarding and trip updates from one simple mobile experience.',
  alternates: {
    canonical: 'https://tinyride.in/drivers',
  },
  openGraph: {
    title: 'TinyRide for Drivers | School Transportation Made Simple',
    description:
      'TinyRide helps school transportation drivers manage assigned routes, pickup stops, boarding and trip updates from one simple mobile experience.',
    url: 'https://tinyride.in/drivers',
    siteName: 'TinyRide',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/brand/logo-horizontal.png',
        width: 1200,
        height: 630,
        alt: 'TinyRide for Drivers — School Transportation Made Simple',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TinyRide for Drivers | School Transportation Made Simple',
    description:
      'TinyRide helps school transportation drivers manage assigned routes, pickup stops, boarding and trip updates from one simple mobile experience.',
    images: ['/brand/logo-horizontal.png'],
  },
};

export default function DriversLayout({
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
            name: 'TinyRide for Drivers',
            operatingSystem: 'All (Web & Mobile Browser)',
            applicationCategory: 'TransportationApplication',
            description:
              'TinyRide helps school transportation drivers manage assigned routes, pickup stops, boarding and trip updates from one simple mobile experience.',
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
