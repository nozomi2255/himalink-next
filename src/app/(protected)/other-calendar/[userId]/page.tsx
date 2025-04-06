// src/app/other-calendar/[userId]/page.tsx
import React from 'react';
import CalendarView from "../../../../components/CalendarView";
import { getUserRecord } from "../../../actions";
import type { UserRecord } from "../../../types";
import { getFollowingUsers, getFollowers } from "../../../followActions";

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

  // フォロー中、フォロワー情報の取得
  const followingUsers = await getFollowingUsers(userId);
  const followers = await getFollowers(userId);

  return <CalendarView userId={userId} />;
}