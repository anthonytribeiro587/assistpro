'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Wrench } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSupabaseBrowserClient } from '@/lib/supabase';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
  remember: z.boolean().default(true)
});

type LoginForm = z.infer<typeof loginSchema>;

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true }
  });

  async function onSubmit(values: LoginForm) {
    setMessage(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim().toLowerCase(),
        password: values.password
      });

      if (error) {
        setMessage('E-mail ou senha inválidos. Confira os dados e tente novamente.');
        return;
      }

      const nextPath = typeof window === 'undefined'
        ? '/dashboard'
        : safeNextPath(new URLSearchParams(window.location.search).get('next'));
      router.replace(nextPath);
      router.refresh();
    } catch {
      setMessage('Não foi possível acessar o sistema agora. Tente novamente em instantes.');
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1500px] overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.12fr_.88fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(124,58,237,.35),transparent_35%),radial-gradient(circle_at_80%_75%,rgba(59,130,246,.18),transparent_35%)]" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-xl font-black text-violet-700">JR</span>
              <div>
                <strong className="block text-lg">AssistPro</strong>
                <span className="text-sm text-slate-400">Operação JR Celular</span>
              </div>
            </div>

            <div className="mt-20 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-violet-200">
                <ShieldCheck className="h-4 w-4" /> Ambiente administrativo
              </span>
              <h1 className="mt-7 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
                Atendimento, assistência e WhatsApp em uma operação segura.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                Controle conversas, clientes, ordens de serviço, automações e parâmetros da IA em um único painel.
              </p>
            </div>
          </div>

          <div className="relative grid gap-3 sm:grid-cols-3">
            {[
              ['Rotas protegidas', 'Sessão validada no servidor'],
              ['WhatsApp real', 'Histórico salvo no Supabase'],
              ['IA parametrizada', 'Regras alteradas pelo CRM']
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <strong className="text-sm">{title}</strong>
                <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center bg-slate-50 px-5 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-700 text-lg font-black text-white">JR</span>
              <div><strong className="block text-slate-950">AssistPro</strong><span className="text-sm text-slate-500">JR Celular</span></div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                <Wrench className="h-5 w-5" />
              </span>
              <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-950">Acessar o painel</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Use o usuário cadastrado no Supabase Auth.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                <label className="block">
                  <span className="text-sm font-bold text-slate-800">E-mail</span>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <input {...register('email')} className="w-full bg-transparent text-sm text-slate-900 outline-none" placeholder="teste@teste.com" type="email" autoComplete="email" />
                  </div>
                  {errors.email ? <small className="mt-1.5 block font-semibold text-red-600">{errors.email.message}</small> : null}
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-800">Senha</span>
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
                    <Lock className="h-4 w-4 text-slate-400" />
                    <input {...register('password')} className="w-full bg-transparent text-sm text-slate-900 outline-none" placeholder="••••••••" type={showPassword ? 'text' : 'password'} autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="text-slate-400 transition hover:text-violet-700">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password ? <small className="mt-1.5 block font-semibold text-red-600">{errors.password.message}</small> : null}
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-500">
                  <input {...register('remember')} type="checkbox" className="h-4 w-4 accent-violet-700" />
                  Manter sessão neste navegador
                </label>

                {message ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{message}</p> : null}

                <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 py-4 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Validando acesso...</> : 'Entrar no AssistPro'}
                </button>
              </form>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-slate-400">
              Acesso restrito. As sessões são validadas no servidor e podem ser encerradas pelo administrador.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
