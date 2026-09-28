import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AdminShell } from '@/components/AdminShell';

export const viewport: Viewport = {
  themeColor: '#006B2F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://tinyride.in'),
  title: 'TinyRide | School Transportation & Live School Ride Tracking',
  description:
    'TinyRide makes school transportation simpler for parents, schools and drivers. Track school rides, see live vehicle status and know when your child arrives.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TinyRide',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  keywords: [
    'school transportation',
    'school bus tracking',
    'school ride tracking',
    'school pickup tracking',
    'school bus tracking app',
    'child school transportation',
    'school transport management system',
  ],
  authors: [{ name: 'Dodail Solutions Private Limited' }],
  creator: 'Dodail Solutions Private Limited',
  publisher: 'TinyRide',
  alternates: {
    canonical: 'https://tinyride.in',
  },
  openGraph: {
    title: 'TinyRide | School Transportation & Live School Ride Tracking',
    description:
      'TinyRide makes school transportation simpler for parents, schools and drivers. Track school rides, see live vehicle status and know when your child arrives.',
    url: 'https://tinyride.in',
    siteName: 'TinyRide',
    images: [
      {
        url: '/brand/logo-horizontal.png',
        width: 1200,
        height: 630,
        alt: 'TinyRide — School Transportation & Live Ride Tracking',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TinyRide | School Transportation & Live School Ride Tracking',
    description:
      'TinyRide makes school transportation simpler for parents, schools and drivers. Track school rides, see live vehicle status and know when your child arrives.',
    images: ['/brand/logo-horizontal.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://tinyride.in/#organization',
      name: 'TinyRide',
      legalName: 'Dodail Solutions Private Limited',
      url: 'https://tinyride.in',
      logo: 'https://tinyride.in/brand/logo-horizontal.png',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@tinyride.in',
        contactType: 'customer service',
      },
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Hyderabad',
        addressRegion: 'Telangana',
        addressCountry: 'IN',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://tinyride.in/#website',
      url: 'https://tinyride.in',
      name: 'TinyRide',
      description: 'School Transportation & Live School Ride Tracking Platform',
      publisher: { '@id': 'https://tinyride.in/#organization' },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://tinyride.in/#software',
      name: 'TinyRide',
      applicationCategory: 'TransportationApplication',
      operatingSystem: 'iOS, Android, Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
      },
      description:
        'Connected school transportation platform for parents, schools, and drivers with live GPS tracking, SafeKey boarding verification, and automated arrival alerts.',
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://tinyride.in/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is TinyRide?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'TinyRide is a dedicated school transportation platform that connects parents, schools, and drivers to provide live vehicle tracking, SafeKey boarding verification, and automated arrival notifications.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does TinyRide track school rides?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'TinyRide uses high-precision GPS telemetry coupled with pre-approved school route corridors to calculate real-time, traffic-adjusted arrival times without requiring driver interaction while on the road.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can parents see where the school vehicle is in real time?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Yes. Parents can open the TinyRide parent app at any time during an active trip to see the vehicle's exact position along the route, current speed, and minute-by-minute estimated arrival time.",
          },
        },
        {
          '@type': 'Question',
          name: 'How do parents know when their child boards the vehicle?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "At each designated pickup stop, the driver confirms boarding using the student's unique SafeKey verification token. Parents receive an immediate lock-screen confirmation as soon as their child is safely on board.",
          },
        },
        {
          '@type': 'Question',
          name: 'Can schools manage their transport operations with TinyRide?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Schools use the TinyRide school dashboard to monitor all active routes simultaneously, coordinate bus bay drop-offs to prevent gate congestion, and review student transit safety in real time.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does TinyRide work for drivers without causing distractions?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The TinyRide driver interface features high-contrast, oversized touch targets with a sequential stop list. Boarding is confirmed with a single tap, automated proximity alerts are dispatched to parents 500 meters in advance, and incoming calls are completely eliminated while driving.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Plus+Jakarta+Sans:wght@100..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TinyRide" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(e) {
                    console.warn('TinyRide SW registration notice:', e);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-surface font-body text-on-surface antialiased">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
