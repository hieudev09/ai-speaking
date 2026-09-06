import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Daily speaking with me (DSWM) — Practice English with AI',
  description:
    'Master English speaking with AI-powered pronunciation analysis, personalized feedback, and adaptive conversation practice. Start your journey today.',
  keywords: ['English learning', 'AI tutor', 'speaking practice', 'pronunciation', 'IELTS', 'DSWM'],
  openGraph: {
    title: 'Daily speaking with me (DSWM)',
    description: 'Practice English speaking with AI — pronunciation, fluency, grammar feedback',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
