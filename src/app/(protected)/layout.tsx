// app/(protected)/layout.tsx
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Sidebar from "@/components/left-sidebar";
import RightSidebar from "@/components/right-sidebar";
import { getAuthenticatedUser } from "../actions";
import MobileFooter from "@/components/mobile-footer";
import { CalendarProvider } from "@/contexts/calendar-context";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRecord = await getAuthenticatedUser();
  if (!userRecord) throw new Error("Authenticated user not found.");

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen p-0 bg-blue-50`}
    >
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <CalendarProvider>{children}</CalendarProvider>
        </div>
        <RightSidebar userId={userRecord.id} />
      </div>
      <MobileFooter />
    </div>
  );
}
