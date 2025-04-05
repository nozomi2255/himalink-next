// app/profile/page.tsx
import React from "react";
import Head from "next/head";
import { getAuthenticatedUser } from "../../app/actions";
import { getFollowingUsers, getFollowers } from "../../app/followActions";
import UserProfileForm from "../../components/UserProfileForm";
import type { UserRecord } from "@/app/types";

export default async function ProfilePage() {
  // サーバー側で認証済みユーザーの詳細情報を取得する
  const profile: UserRecord | null = await getAuthenticatedUser();
  if (!profile) {
    throw new Error("Authenticated user not found.");
  }

  const followingUsers = await getFollowingUsers(profile.id);
  const followers = await getFollowers(profile.id);

  return (
    <>
      <Head>
        <title>プロフィール設定 - ひまリンク</title>
        <meta name="description" content="ひまリンクのプロフィール設定画面" />
      </Head>
      <div className="flex">
        <div className="flex-grow max-w-2xl mx-auto p-8 relative">
          <h1 className="text-3xl font-bold mb-4">プロフィール設定</h1>
          <UserProfileForm 
            profile={profile} 
            followingUsers={followingUsers}
            followers={followers}
          />
        </div>
      </div>
    </>
  );
}