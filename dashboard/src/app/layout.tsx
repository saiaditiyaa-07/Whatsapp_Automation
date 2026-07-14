import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WhatsApp SaaS Automation Dashboard',
  description: 'Enterprise WhatsApp Marketing and Rule Trigger automation engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-100 bg-darkBg min-h-screen">
        {children}
      </body>
    </html>
  );
}
