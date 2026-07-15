'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, Lock, Mail, Smartphone } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
  remember: z.boolean().default(true)
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '', remember: true } });

  async function onSubmit() {
    setMessage('Entrando no ambiente de demonstração...');
    await new Promise((resolve) => setTimeout(resolve, 450));
    router.push('/dashboard');
  }

  return (
    <main className="grid min-h-screen bg-[#111827] px-4 py-6 md:grid-cols-[1.1fr_.9fr] md:p-8">
      <section className="hidden rounded-[2rem] bg-gradient-to-br from-brandDark via-brand to-[#1e0f3d] p-10 text-white shadow-card md:flex md:flex-col md:justify-between">
        <div>
          <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">AssistPro • JR Celular</span>
          <h1 className="mt-8 max-w-xl text-5xl font-black tracking-tight">Sistema de OS com WhatsApp IA integrado.</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-violet-100">Controle a entrada do aparelho, orçamento, aprovação, etapas, mensagens e relatórios em uma operação mobile-first.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {['OS em tempo real', 'Atendimento por áudio', 'Relatórios claros'].map((item) => (
            <div key={item} className="rounded-3xl bg-white/12 p-4 font-semibold text-violet-50">{item}</div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-md items-center justify-center">
        <div className="w-full rounded-[2rem] bg-white p-5 shadow-card sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-[1.8rem] bg-brandLight text-5xl font-black text-brand">JR</div>
            <h2 className="mt-5 text-2xl font-black text-ink">AssistPro</h2>
            <p className="mt-1 text-sm text-muted">Faça login para continuar</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-ink">E-mail ou telefone</span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-line bg-app px-4 py-3 focus-within:border-brand">
                <Mail className="h-4 w-4 text-muted" />
                <input {...register('email')} className="w-full bg-transparent text-sm outline-none" placeholder="seu@email.com" type="email" />
              </div>
              {errors.email ? <small className="mt-1 block text-danger">{errors.email.message}</small> : null}
            </label>

            <label className="block">
              <span className="text-sm font-bold text-ink">Senha</span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-line bg-app px-4 py-3 focus-within:border-brand">
                <Lock className="h-4 w-4 text-muted" />
                <input {...register('password')} className="w-full bg-transparent text-sm outline-none" placeholder="••••••••" type={showPassword ? 'text' : 'password'} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Mostrar senha" className="text-muted">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              {errors.password ? <small className="mt-1 block text-danger">{errors.password.message}</small> : null}
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input {...register('remember')} type="checkbox" className="h-4 w-4 accent-brand" />
                Lembrar-me
              </label>
              <Link href="/recuperar-senha" className="font-bold text-brand">Esqueci minha senha</Link>
            </div>

            <button disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-4 text-sm font-black text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>

            <button type="button" onClick={() => router.push('/dashboard')} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand px-4 py-3 text-sm font-bold text-brand">
              <Smartphone className="h-4 w-4" /> Biometria / modo demonstração
            </button>
          </form>

          {message ? <p className="mt-4 rounded-2xl bg-brandLight p-3 text-center text-sm font-semibold text-brand">{message}</p> : null}
          <p className="mt-8 text-center text-xs text-muted">© JR Celular • Todos os direitos reservados</p>
        </div>
      </section>
    </main>
  );
}
