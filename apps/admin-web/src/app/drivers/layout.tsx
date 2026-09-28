import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TinyRide for Drivers | Simple School Route Management',
  description:
    'TinyRide helps school transportation drivers manage assigned routes, pickup stops, boarding and trip updates from one simple mobile experience.',
  alternates: {
    canonical: 'https://tinyride.in/drivers',
  },
  openGraph: {
    title: 'TinyRide for Drivers | Simple School Route Management',
    description:
      'Manage assigned school routes, share live vehicle location, and verify student boarding with ease.',
    url: 'https://tinyride.in/drivers',
    siteName: 'TinyRide',
    locale: 'en_IN',
    type: 'website',
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
            operatingSystem: 'All (Progressive Web App)',
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
