// src/app/page.tsx
import React from 'react';
import CalendarView from "../components/CalendarView";
import { getAuthenticatedUser } from '../app/actions';
import type { UserRecord } from "../app/types";
import { getFollowingUsers, getFollowers } from '../app/followActions';

// このページはサーバーコンポーネントとして実行されます
export default async function CalendarPage() {
  // サーバー側で認証済みユーザーの詳細情報（fullRecord）を取得する
  const userRecord = await getAuthenticatedUser();
  if (!userRecord) {
    throw new Error("Authenticated user not found.");
  }
  
  const followingUsers: UserRecord[] = await getFollowingUsers(userRecord.id);
  const followers: UserRecord[] = await getFollowers(userRecord.id);

  return <CalendarView userId={undefined} />;
}