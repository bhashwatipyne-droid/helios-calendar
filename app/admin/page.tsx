import type { Metadata } from 'next';
import AdminClient from './AdminClient';

export const metadata: Metadata = { title: 'Helios calendars — admin', robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminClient />;
}
