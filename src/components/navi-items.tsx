"use client";
import { CalendarDays, GalleryVerticalEnd, User, Search } from "lucide-react";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const navItems = [
  { label: "ホーム", icon: CalendarDays, href: "/my-calendar" },
  { label: "タイムライン", icon: GalleryVerticalEnd, href: "/timeline" },
  { label: "検索", icon: Search, href: "/search" },
  { label: "プロフィール", icon: User, href: "/profile" },
] as const;

export const NavButtons: React.FC = () => {
  return (
    <div className="flex flex-row md:flex-col md:items-center justify-around w-full md:gap-5">
      {navItems.map(({ href, icon: Icon, label }) => (
        <Link key={href} href={href} prefetch={true} >
          <Button
            variant="ghost"
            size="lg"
            aria-label={label}
          >
            <Icon className="size-6" />
          </Button>
        </Link>
      ))}
    </div>
  );
};