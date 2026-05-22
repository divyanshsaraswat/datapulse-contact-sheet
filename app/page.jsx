import { redirect } from 'next/navigation';
import { getServerSessionSafe } from '@/lib/auth';
import NotebookApp from '@/components/NotebookApp';

export default async function HomePage() {
  const session = await getServerSessionSafe();
  if (!session) redirect('/login');
  return <NotebookApp />;
}
