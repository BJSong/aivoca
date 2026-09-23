import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "AI Smart Vocab | 초등 4~6학년 맞춤형 AI 영단어",
  description:
    "교재 사진 촬영 한 번으로 단어장을 생성하고, 인지과학 SM-2 간격 반복과 3단계 힌트 페이딩으로 스스로 끝까지 완주하는 AI 스마트 영단어 학습기",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-800 antialiased min-h-screen flex flex-col selection:bg-brand-200">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
        <footer className="py-6 text-center text-xs font-semibold text-slate-400 border-t border-slate-200">
          AI Smart Vocab &copy; {new Date().getFullYear()} &bull; 초등 고학년 인지과학 기반 스마트 단어장
        </footer>
      </body>
    </html>
  );
}
