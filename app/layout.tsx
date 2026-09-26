import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { ThemeProvider } from "@/context/ThemeContext";
import MobileBottomNav from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "ClassPulse – Academic Platform",
  description:
    "Enterprise Academic Platform for Higher Education and Classroom Collaboration.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClassPulse",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4F46E5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen selection:bg-indigo-500 selection:text-white">
        <ThemeProvider>
          <UserProvider>
            {children}
            <Suspense fallback={null}>
              <MobileBottomNav />
            </Suspense>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
