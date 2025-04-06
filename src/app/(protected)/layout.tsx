import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Sidebar from "../../components/Sidebar";
import RightSidebar from "../../components/RightSidebar";
import { getAuthenticatedUser } from '../actions';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ひまリンク",
  description: "予定共有アプリ",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userRecord = await getAuthenticatedUser();
  if (!userRecord) {
    throw new Error("Authenticated user not found.");
  }

  return (
    <html lang="ja">
      <head>
        <style data-fullcalendar></style>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="relative min-h-screen p-0 bg-blue-50">
          <div className="mt-0 flex">
            <Sidebar />
            <div className="flex-1">
              {children}
            </div>
            <RightSidebar userId={userRecord.id} />
          </div>
        </div>
      </body>
    </html>
  );
}
