'use client'

import { useRouter } from "next/navigation";
import { HomeIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from "react";
import { createClient } from '@/utils/supabase/client';
import UserAvatar from "@/components/UserAvatar";

import React from "react";
import "./Sidebar.css"; // スタイルは別ファイルで定義（後述）

const Sidebar = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error('Failed to get user:', error.message);
        return;
      }

      if (user) {
        console.log("Fetched user ID:", user.id); // ← ここでuserIdを確認
        setUserId(user.id);
      }
    };

    getUserId();
  }, []);

  const handleAvatarClick = () => {
    if (userId) {
      router.push('/profile');
    } else {
      console.warn('User ID is null, cannot navigate to profile.');
    }
  };

  return (
    <div className="sidebar">
      {/* ホーム画面への遷移ボタン */}
      <div className="home-button" onClick={() => router.push('/')}>
        <HomeIcon style={{ width: '24px', height: '24px', marginRight: '8px' }} />
      </div>

      {/* プロフィールアイコン */}
      <div className="avatar" onClick={handleAvatarClick}>
        {userId && <UserAvatar userId={userId} onClick={handleAvatarClick} size={30} />}
      </div>

      {/* テンプレート予定 */}
      <div className="template-section" style={{ marginTop: 'auto' }}>
        <h4>テンプレート</h4>
        <button className="template-button">ひま</button>
        <button className="template-button">買い物</button>
        <button className="template-button">映画</button>
      </div>
    </div>
  );
};

export default Sidebar;