// app/(protected)/layout.tsx
import "../globals.css";
import Sidebar from "@/components/left-sidebar";
import RightSidebar from "@/components/right-sidebar";
import { getAuthenticatedUser } from "../actions";
import MobileFooter from "@/components/mobile-footer";
import { CalendarProvider } from "@/contexts/calendar-context";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRecord = await getAuthenticatedUser();
  if (!userRecord) throw new Error("Authenticated user not found.");

  return (
    <div className="relative min-h-screen p-0">
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
