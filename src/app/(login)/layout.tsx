import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "ひまリンク",
  description: "予定共有アプリ",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen p-0">
      <div className="mt-0 flex">
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
