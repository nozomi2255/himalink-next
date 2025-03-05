// app/calendar/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface Entry {
  id: string;
  title: string;
  content: string;
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
}

export default function CalendarPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      if (!data.session) {
        router.replace('/auth'); // 未ログインの場合、認証画面にリダイレクト
      } else {
        fetchEntries(); // ログインしている場合、エントリを取得
      }
    });
  }, [router]);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Entries')
      .select('id, title, content, start_time, end_time')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching entries:', error);
    } else {
      setEntries(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    } else {
      router.replace('/auth'); // ログアウト後に認証画面にリダイレクト
    }
  };

  // Supabaseから取得したエントリーデータをFullCalendar用のイベントに変換
  const events = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    start: entry.start_time,
    end: entry.end_time,
  }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold">Calendar</h1>
      <button onClick={handleLogout} className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600">
        Logout
      </button>
      {loading ? (
        <p>Loading entries...</p>
      ) : (
        <div className="w-full max-w-4xl mt-4">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridWeek,timeGridDay",
            }}
            events={events}
            editable={true}
            selectable={true}
            // 今後、ドラッグ＆ドロップや他のインタラクションを拡張できます
          />
        </div>
      )}
    </div>
  );
}