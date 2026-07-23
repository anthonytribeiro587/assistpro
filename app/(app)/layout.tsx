import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getAuthenticatedProfile, getAuthenticatedUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const profile = await getAuthenticatedProfile();

  return (
    <AppShell
      userName={profile?.fullName || user.email?.split('@')[0] || 'Usuário'}
      userEmail={user.email || 'Usuário autenticado'}
      userRole={profile?.role || null}
    >
      {children}
    </AppShell>
  );
}
