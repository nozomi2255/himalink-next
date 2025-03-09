// app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import { supabase } from "../../lib/supabaseClient";
import UserProfileForm from "../../../components/UserProfileForm";
import { useRouter } from "next/navigation";
import { HomeIcon } from '@heroicons/react/24/outline';

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
  const router = useRouter();
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

  // ログアウト処理
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error); // エラーハンドリング
    } else {
      router.replace('/auth'); // ログアウト後に認証画面にリダイレクト
    }
  };

  return (
    <>
      <Head>
        <title>プロフィール設定 - ひまリンク</title>
        <meta name="description" content="ひまリンクのプロフィール設定画面" />
      </Head>
      <div className="max-w-2xl mx-auto p-8 relative">
        <h1 className="text-3xl font-bold mb-4">プロフィール設定</h1>
        <button
          onClick={() => router.push('/calendar')} // ホームボタンのクリックでカレンダーにリダイレクト
          className="mb-4 flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <HomeIcon className="h-5 w-5" />
        </button>
        <button
          onClick={handleLogout} // ログアウトボタンを追加
          className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
        {profile && <UserProfileForm profile={profile} />} {/* プロフィール情報が存在する場合、フォームを表示 */}
      </div>
    </>
  );
}