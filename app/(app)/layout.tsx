import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getAuthenticatedUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  return <AppShell userEmail={user.email || 'Usuário autenticado'}>{children}</AppShell>;
}
