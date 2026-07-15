# AssistPro

Sistema web para assistência técnica, inspirado no protótipo mobile da JR Celular, com foco em controle de ordens de serviço, orçamento, etapas, WhatsApp e IA.

## Análise do protótipo

O protótipo possui 10 telas principais:

1. Login / boas-vindas
2. Dashboard
3. Lista de OS
4. Detalhes da OS
5. Etapas da OS
6. Orçamento
7. WhatsApp integrado
8. Chat com IA
9. Resposta em áudio com voz autorizada
10. Relatórios

O conceito correto é um sistema operacional, não uma landing page. Por isso a interface foi reorganizada com sidebar roxa, conteúdo branco, rotas separadas e navegação mobile.

## Funcionalidades já estruturadas

- Login visual com validação via React Hook Form + Zod
- Dashboard operacional
- Lista de ordens de serviço em tabela desktop e cards mobile
- Cadastro de nova OS com validação
- Detalhe da OS
- Linha do tempo de etapas
- Orçamento e link de aprovação
- Inbox WhatsApp
- Chat com IA
- Tela de áudio / voz autorizada
- Clientes
- Relatórios
- Configurações
- Helpers Supabase
- Endpoint inicial de classificação de IA
- Estrutura visual compatível com Vercel

## Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Supabase
- Lucide React
- React Hook Form
- Zod
- Vercel

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse:

```txt
http://localhost:3000/login
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE_NAME=
AI_PROVIDER=openai
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
```

## Supabase

Rode `supabase/schema.sql` no SQL Editor do Supabase. A próxima etapa é conectar os formulários às tabelas reais e aplicar as policies finais por tenant.

## Deploy Vercel

1. Criar projeto na Vercel apontando para o repositório.
2. Configurar as variáveis de ambiente.
3. Rodar deploy.
4. Validar rotas principais:
   - `/login`
   - `/dashboard`
   - `/ordens`
   - `/ordens/nova`
   - `/whatsapp`
   - `/relatorios`

## Próximas etapas técnicas

- Trocar dados de demonstração por queries Supabase.
- Implementar Supabase Auth real com sessão persistente.
- Implementar server actions para CRUD de OS, clientes e orçamentos.
- Criar storage para fotos dos aparelhos.
- Conectar webhook da Evolution API.
- Implementar transcrição de áudio e resposta com voz autorizada.
