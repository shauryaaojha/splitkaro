import type { Metadata, Viewport } from "next";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import SplashScreen from "@/components/layout/SplashScreen";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitKaro - Split expenses, not friendships",
  description:
    "Create groups, add shared expenses, simplify debts, and settle with UPI QR codes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SplitKaro",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1A1A2E",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <SplashScreen />
        <ThemeProvider>
          <ServiceWorkerRegister />
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
