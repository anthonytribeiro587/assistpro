import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AssistPro | OS + WhatsApp IA',
  description: 'Sistema para assistência técnica com ordens de serviço, WhatsApp e IA.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
