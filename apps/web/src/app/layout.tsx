import type { Metadata } from "next";
import '@/styles/globals.css';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import BottomNav from '@/components/BottomNav';
import MobileHeader from '@/components/MobileHeader';
import WebSocketProvider from '@/components/WebSocketProvider';

export const metadata: Metadata = {
  title: "VedaAI — AI Assessment Creator",
  description: "Generate structured question papers with AI. Create assignments, define question types, and get professionally formatted exam papers instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WebSocketProvider />
        <div className="app-layout">
          <Sidebar />
          <div className="main-wrapper">
            <MobileHeader />
            <TopHeader />
            <main className="main-content">
              {children}
            </main>
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
