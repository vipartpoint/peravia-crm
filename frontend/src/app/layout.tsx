import type { Metadata } from "next";
import localFont from 'next/font/local';
import "./globals.css";

const kalameh = localFont({
  src: [
    {
      path: '../assets/fonts/KalamehFaNum-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/KalamehFaNum-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/KalamehFaNum-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: "--font-kalameh",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "CRM کارخانه روانکار",
  description: "سیستم مدیریت ارتباط با مشتریان اختصاصی",
};

import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${kalameh.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
