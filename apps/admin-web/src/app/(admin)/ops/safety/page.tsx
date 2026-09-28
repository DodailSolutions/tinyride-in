import { redirect } from 'next/navigation';

export default function OpsSafetyRedirectPage() {
  redirect('/admin/safety');
}
