// app/calendar/page.tsx
"use client";

import React, { useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function CalendarPage() {
  const router = useRouter();

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      if (!data.session) {
        router.replace('/auth'); // 未ログインの場合、認証画面にリダイレクト
      }
    });
  }, [router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    } else {
      router.replace('/auth'); // ログアウト後に認証画面にリダイレクト
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold">Calendar</h1>
      {/* 横タイムライン形式のカレンダーUIをここに実装 */}
      <p>This is where the innovative timeline calendar will be displayed.</p>
      <button onClick={handleLogout} className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600">
        Logout
      </button>
    </div>
  );
}