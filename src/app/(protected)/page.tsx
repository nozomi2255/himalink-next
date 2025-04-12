// src/app/page.tsx
import React from 'react';
import CalendarView from "../../components/CalendarView";
import { getAuthenticatedUser } from '../actions';
import type { UserRecord } from "../types";
import { getFollowingUsers, getFollowers } from '../followActions';

// このページはサーバーコンポーネントとして実行されます
export default async function CalendarPage() {
  // サーバー側で認証済みユーザーの詳細情報（fullRecord）を取得する
  const userRecord = await getAuthenticatedUser();
  if (!userRecord) {
    throw new Error("Authenticated user not found.");
  }

  return <CalendarView userId={userRecord.id} currentUserId={userRecord.id} />;
}