"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UserPlus, Users, Building2, CreditCard, FileText, Settings, Menu, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { href: "/quick-checkin", label: "پذیرش سریع", icon: UserPlus },
  { href: "/residents", label: "ساکنین", icon: Users },
  { href: "/rooms", label: "اتاق‌ها", icon: Home },
  { href: "/payments", label: "پرداخت‌ها", icon: CreditCard },
  { href: "/reports", label: "گزارش", icon: FileText },
  { href: "/settings", label: "تنظیمات", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col bg-card border-l border-border/50">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg shrink-0">
          ا
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm truncate">خوابگاه البرز</h1>
          <p className="text-[10px] text-muted-foreground">مدیریت خوابگاه</p>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border/30 p-3 text-center text-[10px] text-muted-foreground">
        نسخه ۱.۰
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 right-3 z-50 lg:hidden shadow-sm bg-white"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:right-0 z-40">
        {sidebar}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 right-0 z-50 w-72 bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:hidden",
        mobileOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {sidebar}
      </aside>
    </>
  );
}
