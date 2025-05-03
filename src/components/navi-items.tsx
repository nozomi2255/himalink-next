"use client";
import { CalendarDays, GalleryVerticalEnd, User, Search, NotebookTabs} from "lucide-react";
import React, { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export const navItems = [
  { label: "ホーム", icon: CalendarDays, href: "/my-calendar" },
  { label: "タイムライン", icon: GalleryVerticalEnd, href: "/timeline" },
  { label: "検索", icon: Search, href: "/search" },
  { label: "プロフィール", icon: User, href: "/profile" },
  { label: "メモ", icon: NotebookTabs, href: "/memo" },
] as const;

export const NavButtons: React.FC = () => {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = React.useState<string | null>(null);

  const handleClick = (href: string) => {
    setActiveRoute(href);
    startTransition(() => {
      // ナビゲーション完了後にactiveRouteをリセット
      setTimeout(() => setActiveRoute(null), 500);
    });
  };

  return (
    <div className="flex flex-row md:flex-col md:items-center justify-around w-full md:gap-5">
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = activeRoute === href;
        
        return (
          <Link 
            key={href} 
            href={href} 
            prefetch={true}
            onClick={() => handleClick(href)}
          >
            <Button
              variant="ghost"
              size="lg"
              aria-label={label}
              disabled={isActive}
              className="relative"
            >
              {isActive ? (
                <Loader2 className="size-6 animate-spin" />
              ) : (
                <Icon className="size-6" />
              )}
            </Button>
          </Link>
        );
      })}
    </div>
  );
};