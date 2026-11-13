import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import CalendarScreen from '@/components/CalendarScreen';
import { SESSION_COOKIE, displayLabel } from '@/lib/auth';

export default async function CalendarPage() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) redirect('/');
  return <CalendarScreen userLabel={displayLabel(id)} />;
}
