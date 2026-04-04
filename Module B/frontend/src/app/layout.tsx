import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GateGuard',
  description: 'GateGuard Campus Security System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen bg-gray-950 text-white flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-950 pt-20 md:pt-6">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
