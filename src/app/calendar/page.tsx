// app/calendar/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";

interface Entry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  start_time: string; // ISO 8601 format
  end_time: string; // ISO 8601 format
}

export default function CalendarPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/auth'); // 未ログインの場合、認証画面にリダイレクト
      } else {
        setCurrentUserId(data.session.user.id);
        fetchEntries(data.session.user.id); // ユーザーIDでエントリーを取得
        console.log("Current User ID:", data.session.user.id); // Example usage
      }
    });
  }, [router]);

  const fetchEntries = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Entries')
      .select('id, user_id, title, content, start_time, end_time')
      .eq('user_id', userId) // ユーザーIDでフィルタリング
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

  // 日付セルがクリックされた際の処理
  const handleDateClick = (arg: any) => {
    // arg.dateStr はクリックされた日付 (ISO形式)
    setSelectedDate(arg.dateStr);
    setShowForm(true);
  };

  // 予定追加処理
  const handleAddEvent = async () => {
    if (!currentUserId) return;

    // クリックした日付を基にstart_timeとend_timeを設定
    const startTime = `${selectedDate}T00:00:00`; // クリックした日付の00:00
    const endTime = `${selectedDate}T00:00:00`; // 次の日の00:00

    const { data, error } = await supabase
      .from("Entries")
      .insert([
        {
          user_id: currentUserId,
          entry_type: "event",
          title: newTitle,
          content: "",
          start_time: startTime, // ここでstart_timeを設定
          end_time: endTime, // ここでend_timeを設定
          is_all_day: true, // all_dayをtrueに設定
          location: null,
        },
      ]);

    if (error) {
      console.error("Error adding event:", error);
    } else {
      // 追加後、一覧を更新
      fetchEntries(currentUserId);
      setShowForm(false);
      setNewTitle("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <h1 className="text-2xl font-bold">Calendar</h1>
      <div className="absolute top-4 right-4">
        <button onClick={handleLogout} className="bg-red-500 text-white p-2 rounded hover:bg-red-600">
          Logout
        </button>
      </div>
      {loading ? (
        <p>Loading entries...</p>
      ) : (
        <div className="w-full max-w-4xl mt-4">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin, dayGridPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            editable={true}
            selectable={!showForm}
            dateClick={handleDateClick}
          />
        </div>
      )}

      {showForm && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md bg-white bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl mb-4">
              Add Event on {selectedDate}
            </h2>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter event title"
              className="border p-2 w-full mb-4"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="mr-2 bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}