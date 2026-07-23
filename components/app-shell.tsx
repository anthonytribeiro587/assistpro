'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Bell, Menu, Plus, Search, ShieldCheck, X } from 'lucide-react';
import { navGroups, type NavGroup } from '@/lib/app-data';
import { LogoutButton } from '@/components/auth/logout-button';
import type { AssistProRole } from '@/lib/supabase-server';

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

function roleLabel(role: AssistProRole | null) {
  const labels: Record<AssistProRole, string> = {
    owner: 'Proprietário',
    admin: 'Administrador',
    attendant: 'Atendente',
    technician: 'Técnico'
  };
  return role ? labels[role] : 'Perfil pendente';
}

function visibleNavigation(role: AssistProRole | null) {
  const canAdminister = role === 'owner' || role === 'admin';

  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.href !== '/configuracoes' || canAdminister)
    }))
    .filter((group) => group.items.length > 0);
}

function Navigation({
  groups,
  pathname,
  onNavigate
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-950/30'
                      : 'text-slate-300 hover:bg-white/[.06] hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AppShell({
  children,
  userName,
  userEmail,
  userRole
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userRole: AssistProRole | null;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const groups = useMemo(() => visibleNavigation(userRole), [userRole]);
  const mobileItems = useMemo(
    () =>
      groups
        .flatMap((group) => group.items)
        .filter((item) =>
          ['/dashboard', '/ordens', '/whatsapp', '/clientes', '/configuracoes'].includes(item.href)
        )
        .slice(0, 5),
    [groups]
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] border-r border-white/5 bg-slate-950 text-white lg:block">
        <div className="flex h-full flex-col px-4 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-3.5"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-600 text-lg font-black text-white shadow-lg shadow-violet-950/50">
              JR
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-sm">AssistPro</strong>
              <span className="block truncate text-xs text-slate-400">JR Celular • Administração</span>
            </div>
          </Link>

          <div className="mt-7 flex-1 overflow-y-auto pr-1">
            <Navigation groups={groups} pathname={pathname} />
          </div>

          <div className="space-y-2 border-t border-white/10 pt-4">
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[.08] p-3">
              <p className="flex items-center gap-2 text-xs font-black text-emerald-300">
                <ShieldCheck className="h-4 w-4" /> Sessão protegida
              </p>
              <p className="mt-2 truncate text-sm font-bold text-white" title={userName}>
                {userName}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-400" title={userEmail}>
                {userEmail}
              </p>
              <span className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[.06] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-300">
                {roleLabel(userRole)}
              </span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col bg-slate-950 p-4 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-600 font-black">JR</span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm">AssistPro</strong>
                  <span className="block truncate text-xs text-slate-400">{roleLabel(userRole)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-300 hover:bg-white/10 hover:text-white"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex-1 overflow-y-auto">
              <Navigation groups={groups} pathname={pathname} onNavigate={() => setMobileMenuOpen(false)} />
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="mb-2 truncate px-3 text-xs text-slate-400">{userEmail}</p>
              <LogoutButton />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="flex h-[72px] items-center justify-between gap-4 px-4 md:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                  Operação administrativa
                </p>
                <strong className="block truncate text-lg text-slate-950">JR Celular</strong>
              </div>
            </div>

            <div className="hidden min-w-[300px] max-w-xl flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 md:flex">
              <Search className="h-4 w-4" />
              Buscar OS, cliente, aparelho ou conversa
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/ordens/nova"
                className="hidden items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 md:inline-flex"
              >
                <Plus className="h-4 w-4" /> Nova OS
              </Link>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500"
                aria-label="Notificações"
              >
                <Bell className="h-5 w-5" />
              </button>
              <div className="hidden sm:block">
                <LogoutButton compact />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] px-4 py-5 pb-28 md:px-7 md:py-7 lg:pb-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl lg:hidden" style={{ gridTemplateColumns: `repeat(${Math.max(mobileItems.length, 1)}, minmax(0, 1fr))` }}>
        {mobileItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-bold ${
                active ? 'bg-violet-50 text-violet-700' : 'text-slate-500'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="max-w-full truncate">
                {item.label === 'Visão geral'
                  ? 'Início'
                  : item.label === 'Ordens de serviço'
                    ? 'OS'
                    : item.label === 'Administração'
                      ? 'Admin'
                      : item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
