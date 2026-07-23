import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export type AssistProRole = 'owner' | 'admin' | 'attendant' | 'technician';

export type AuthenticatedProfile = {
  id: string;
  companyId: string;
  fullName: string;
  role: AssistProRole;
  email: string;
};

export async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase público não configurado.');
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components não podem alterar cookies depois que o streaming começou.
          // O middleware mantém a sessão atualizada antes da renderização.
        }
      }
    }
  });
}

export async function getAuthenticatedUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const profile = await supabase
    .from('profiles')
    .select('id,company_id,full_name,role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile.error || !profile.data?.company_id) return null;

  return {
    id: user.id,
    companyId: String(profile.data.company_id),
    fullName: String(profile.data.full_name || user.email || 'Usuário'),
    role: profile.data.role as AssistProRole,
    email: user.email || ''
  };
}

export function hasAnyRole(
  profile: AuthenticatedProfile | null,
  allowedRoles: AssistProRole[]
) {
  return Boolean(profile && allowedRoles.includes(profile.role));
}
