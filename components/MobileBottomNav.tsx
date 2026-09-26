"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, CalendarClock, Archive, User } from "lucide-react";
import { useUser } from "@/context/UserContext";

function MobileBottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentUser, isLoading } = useUser();

  // Do not render on auth pages or when unauthenticated
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (isLoading || !currentUser || isAuthPage) {
    return null;
  }

  const viewParam = searchParams.get("view");

  const navItems = [
    {
      label: "Classes",
      href: "/dashboard",
      icon: LayoutGrid,
      isActive:
        (pathname === "/dashboard" && viewParam !== "deadlines") ||
        pathname.startsWith("/classroom"),
    },
    {
      label: "Deadlines",
      href: "/dashboard?view=deadlines",
      icon: CalendarClock,
      isActive: pathname === "/dashboard" && viewParam === "deadlines",
    },
    {
      label: "Locker",
      href: "/dashboard/student/locker",
      icon: Archive,
      isActive: pathname.startsWith("/dashboard/student/locker"),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: User,
      isActive: pathname.startsWith("/profile"),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1 shadow-lg transition-colors pb-[calc(0.25rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center min-h-[44px] py-1 px-2 rounded-xl transition-all active:scale-95 ${
                active
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
              }`}
            >
              <div
                className={`flex items-center justify-center p-1 rounded-lg transition-colors ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950/60"
                    : "bg-transparent"
                }`}
              >
                <Icon strokeWidth={1.75} size={20} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavContent />
    </Suspense>
  );
}
