"use client";
import { CalendarDays, GalleryVerticalEnd, User } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export const navItems = [
  { label: "ホーム",    icon: CalendarDays,      href: "/" },
  { label: "タイムライン", icon: GalleryVerticalEnd, href: "/timeline" },
  { label: "プロフィール", icon: User,             href: "/profile" },
] as const;

export const NavButtons: React.FC = () => {
  const router = useRouter();
  return (
    <div className="flex flex-row md:flex-col items-center justify-around w-full">
      {navItems.map(({ href, icon: Icon, label }) => (
        <Button
          key={href}
          variant="ghost"
          size="icon"
          onClick={() => router.push(href)}
          aria-label={label}
        >
          <Icon className="w-6 h-6" />
        </Button>
      ))}
    </div>
  );
};