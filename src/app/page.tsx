// src/app/page.tsx
import React from 'react';
import Sidebar from "../components/Sidebar";
import CalendarView from "../components/CalendarView";
import { getAuthenticatedUser } from '../app/actions';
import type { UserRecord } from "../app/types";
import { getFollowingUsers, getFollowers } from '../app/followActions';
import RightSidebar from "../components/RightSidebar";

// このページはサーバーコンポーネントとして実行されます
export default async function CalendarPage() {
  // サーバー側で認証済みユーザーの詳細情報（fullRecord）を取得する
  const userRecord = await getAuthenticatedUser();
  if (!userRecord) {
    throw new Error("Authenticated user not found.");
  }
  
  const followingUsers: UserRecord[] = await getFollowingUsers(userRecord.id); // 実際のフォロー中ユーザー情報を取得する処理に置き換える
  const followers: UserRecord[] = await getFollowers(userRecord.id); // 実際のフォロワー情報を取得する処理に置き換える

  return (
    <div className="relative min-h-screen p-0 bg-blue-50">
      {/* カレンダー表示 */}
      <div className="mt-0 flex">
        <Sidebar />
        <div className="flex-1">
          <CalendarView />
        </div>
        <RightSidebar updates={[]} />
      </div>
    </div>
  );
}