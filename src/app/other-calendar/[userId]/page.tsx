// src/app/other-calendar/[userId]/page.tsx
import React from 'react';
import CalendarHeader from "../../../components/CalendarHeader";
import CalendarView from "../../../components/CalendarView";
import { getUserRecord } from "../../../app/actions";
import type { UserRecord, Event } from "../../../app/types";
import { getUserEvents } from "../../../app/eventActions";

interface OtherCalendarPageProps {
  params: {
    userId: string;
  };
}

export default async function OtherCalendarPage({ params }: OtherCalendarPageProps) {
  // URLパラメータから userId を取得
  const { userId } = params;

  // 渡された userId を元に Users テーブルからユーザーの詳細情報を取得
  const userRecord: UserRecord | null = await getUserRecord(userId);
  if (!userRecord) {
    throw new Error("User record not found.");
  }

  // 渡された userId を利用してイベント情報を取得
  const events: Event[] = await getUserEvents(userId);

  // 実際のフォロー中、フォロワー情報の取得処理に置き換える
  const followingUsers: UserRecord[] = [];
  const followers: UserRecord[] = [];

  return (
    <div className="relative min-h-screen p-4 bg-gray-100">
      {/* ヘッダーに他ユーザーの詳細情報を渡す */}
      <CalendarHeader 
        userAvatarUrl={userRecord.avatar_url || "/path/to/default-avatar.png"} 
        userName={userRecord.username || "ユーザー名"}  
        showSearch={true}
        followingUsers={followingUsers}
        followers={followers}
      />
      {/* カレンダー表示 */}
      <CalendarView events={events} />
    </div>
  );
}