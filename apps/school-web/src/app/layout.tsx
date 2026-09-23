import './globals.css';
import { SchoolShell } from '@/components/SchoolShell';

export const metadata = {
  title: 'Oakridge International — TinyRide School Gate Portal',
  description: 'School transport intake, morning arrivals, afternoon releases & student roster',
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-primary-text font-body antialiased min-h-screen">
        <SchoolShell>{children}</SchoolShell>
      </body>
    </html>
  );
}
