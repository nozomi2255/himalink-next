'use client'

import { useRouter } from "next/navigation";
import { CalendarDays, User, GalleryVerticalEnd } from "lucide-react"
import { useEffect, useState } from "react";
import { createClient } from '@/utils/supabase/client';
import { Button } from "@/components/ui/button";
import React from "react";

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

  return (
    <div className="w-[180px] bg-[#f8faff] p-5 gap-5 flex flex-col items-center border-r border-[#ddd] h-screen">
      {/* ホーム画面への遷移ボタン */}
      <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
        <CalendarDays className="size-6" />
      </Button>

      {/* タイムライン画面への遷移ボタン */}
      <Button variant="ghost" size="icon" onClick={() => router.push('/timeline')}>
        <GalleryVerticalEnd className="size-6" />
      </Button>

      {/* プロフィールアイコン */}
      <Button variant="ghost" size="icon" onClick={() => router.push('/profile')}>
        <User className="size-6" />
      </Button>

      {/* テンプレート予定 */}
      <div className="w-full mt-auto">
        <h4>テンプレート</h4>
        <Button variant="secondary" className="w-full py-1.5 mb-2 text-[13px] bg-[#e0f7ff] hover:bg-[#d2f0fa]">
          ひま
        </Button>
        <Button variant="secondary" className="w-full py-1.5 mb-2 text-[13px] bg-[#e0f7ff] hover:bg-[#d2f0fa]">
          買い物
        </Button>
        <Button variant="secondary" className="w-full py-1.5 mb-2 text-[13px] bg-[#e0f7ff] hover:bg-[#d2f0fa]">
          映画
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;