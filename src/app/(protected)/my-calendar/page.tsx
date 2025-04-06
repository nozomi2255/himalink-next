// src/app/page.tsx
import React from 'react';
import CalendarView from "@/components/CalendarView";
import { getAuthenticatedUser } from "@/app/actions";

// このページはサーバーコンポーネントとして実行されます
export default async function CalendarPage() {
  // サーバー側で認証済みユーザーの詳細情報（fullRecord）を取得する
  const userRecord = await getAuthenticatedUser();
  if (!userRecord) {
    throw new Error("Authenticated user not found.");
  }

  return <CalendarView userId={userRecord.id} />;
}