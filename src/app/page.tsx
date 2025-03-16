// src/app/page.tsx
import React from 'react';
import CalendarHeader from "../components/CalendarHeader";
import CalendarView from "../components/CalendarView";
import { getAuthenticatedUser } from '../app/actions';
import type { UserRecord, Event } from "../app/types";
import { getUserEvents } from './eventActions';
import { getFollowingUsers, getFollowers } from '../app/followActions';

// このページはサーバーコンポーネントとして実行されます
export default async function CalendarPage() {
  // サーバー側で認証済みユーザーの詳細情報（fullRecord）を取得する
  const userRecord = await getAuthenticatedUser();
  if (!userRecord) {
    throw new Error("Authenticated user not found.");
}
  
  // 仮にイベントデータを取得する処理が実装されている場合
  const events: Event[] = await getUserEvents(userRecord.id);
  
  const followingUsers: UserRecord[] = await getFollowingUsers(userRecord.id); // 実際のフォロー中ユーザー情報を取得する処理に置き換える
  const followers: UserRecord[] = await getFollowers(userRecord.id); // 実際のフォロワー情報を取得する処理に置き換える

  return (
    <div className="relative min-h-screen p-4 bg-gray-100">
      <div className="relative z-50 mb-6">
      {/* ヘッダーに認証済みユーザーの詳細情報を渡す */}
      <CalendarHeader 
        userAvatarUrl={userRecord.avatar_url || "/path/to/default-avatar.png"} 
        userName={userRecord.username || "ユーザー名"}  
        showSearch={true}
        followingUsers={followingUsers}
        followers={followers}
      />
      </div>
      {/* カレンダー表示 */}
      <div className="pt-4">
      <CalendarView 
        events={events} 
      />
      </div>
    </div>
  );
}