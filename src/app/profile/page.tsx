// app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import { supabase } from "../../lib/supabaseClient";
import UserProfileForm from "../../../components/UserProfileForm";

// Profileインターフェースの定義
interface Profile {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string | null;
  bio?: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null); // プロフィール情報を格納するステート
  const [loading, setLoading] = useState(true); // ローディング状態を管理するステート

  // コンポーネントのマウント時にプロフィール情報を取得
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession(); // セッションを取得
      if (session) {
        // セッションが存在する場合、ユーザーのプロフィール情報を取得
        const { data, error } = await supabase
          .from("Users")
          .select("id, username, email, full_name, avatar_url, bio")
          .eq("id", session.user.id)
          .single(); // ユーザーIDでフィルタリングし、1件取得

        if (!error) {
          setProfile(data); // プロフィール情報をステートに設定
        }
      }
      setLoading(false); // ローディング終了
    };

    fetchProfile(); // プロフィール情報を取得する関数を呼び出す
  }, []);

  // ローディング中はメッセージを表示
  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Head>
        <title>プロフィール設定 - ひまリンク</title>
        <meta name="description" content="ひまリンクのプロフィール設定画面" />
      </Head>
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-4">プロフィール設定</h1>
        {profile && <UserProfileForm profile={profile} />} {/* プロフィール情報が存在する場合、フォームを表示 */}
      </div>
    </>
  );
}