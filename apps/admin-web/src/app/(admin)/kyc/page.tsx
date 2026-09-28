import { redirect } from 'next/navigation';

export default function KycRedirectPage() {
  redirect('/admin/compliance');
}
