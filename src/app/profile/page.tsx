// app/profile/page.tsx
import React from "react";
import Head from "next/head";
import { getAuthenticatedUser } from "../../app/actions";
import UserProfileForm from "../../components/UserProfileForm";
import CalendarHeader from "../../components/CalendarHeader";
import type { UserRecord } from "@/app/types";

export default async function ProfilePage() {
  // サーバー側で認証済みユーザーの詳細情報を取得する
  const profile: UserRecord | null = await getAuthenticatedUser();
  if (!profile) {
    throw new Error("Authenticated user not found.");
  }

  return (
    <>
      <CalendarHeader 
          userAvatarUrl={profile.avatar_url || "/path/to/default-avatar.png"}
          userName={profile.username || "ユーザー名"}
          showSearch={true}
          followingUsers={[]}
          followers={[]}
          isProfilePage={true}
      />
      <Head>
        <title>プロフィール設定 - ひまリンク</title>
        <meta name="description" content="ひまリンクのプロフィール設定画面" />
      </Head>
      <div className="max-w-2xl mx-auto p-8 relative">
        <h1 className="text-3xl font-bold mb-4">プロフィール設定</h1>
        {/* 取得済みのユーザー情報（UserRecord 型）を UserProfileForm に渡す */}
        <UserProfileForm profile={profile} />
      </div>
    </>
  );
}