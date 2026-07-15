'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LogOut, Menu, Plus, Search } from 'lucide-react';
import { navItems } from '@/lib/app-data';

function isActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-app">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-brandDark/20 bg-gradient-to-b from-brandDark via-brand to-[#241044] text-white lg:block">
        <div className="flex h-full flex-col p-5">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-3xl bg-white/10 p-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl font-black text-brand">JR</div>
            <div>
              <strong className="block leading-tight">AssistPro</strong>
              <span className="text-xs text-violet-100/80">JR Celular</span>
            </div>
          </Link>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active ? 'bg-white text-brand shadow-soft' : 'text-violet-50/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl bg-white/10 p-4 text-sm">
            <p className="font-bold">Evolution preparada</p>
            <p className="mt-1 text-xs leading-5 text-violet-100/80">WhatsApp será conectado por instância e webhooks.</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
              <button className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-white text-ink lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Operação ao vivo</p>
                <strong className="text-lg text-ink">JR Celular</strong>
              </div>
            </div>

            <div className="hidden min-w-[320px] items-center gap-2 rounded-2xl border border-line bg-app px-4 py-3 text-sm text-muted md:flex">
              <Search className="h-4 w-4" />
              Buscar OS, cliente ou aparelho
            </div>

            <div className="flex items-center gap-2">
              <Link href="/ordens/nova" className="hidden items-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-glow md:inline-flex">
                <Plus className="h-4 w-4" /> Nova OS
              </Link>
              <button className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-white text-muted" aria-label="Notificações">
                <Bell className="h-5 w-5" />
              </button>
              <Link href="/login" className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-white text-muted" aria-label="Sair">
                <LogOut className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-5 pb-28 md:px-8 md:py-8 lg:pb-8">{children}</main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[1.5rem] border border-line bg-white p-2 shadow-card lg:hidden">
        {navItems.slice(0, 5).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold ${active ? 'bg-brandLight text-brand' : 'text-muted'}`}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
