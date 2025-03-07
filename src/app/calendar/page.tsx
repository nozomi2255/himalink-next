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
  is_all_day: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");

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
      .select('id, user_id, title, content, start_time, end_time, is_all_day')
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

  // ユーザー検索処理
  const handleSearch = async () => {
    const { data, error } = await supabase
      .from("Users")
      .select("id, username, email")
      .ilike("email", `%${searchEmail}%`); // メールアドレスで検索

    if (error) {
      console.error("Error searching users:", error);
    } else {
      setSearchResults(data);
    }
  };

  const handleUserClick = (userId: string) => {
    // ユーザーのカレンダーを表示するためにリダイレクト
    router.push(`/other-calendar/${userId}`);
  };

  // Supabaseから取得したエントリーデータをFullCalendar用のイベントに変換
  const events = entries.map((entry) => {
    if (entry.is_all_day) {
      return {
        id: entry.id,
        title: entry.title,
        start: entry.start_time ? entry.start_time.split("T")[0] : "", // "YYYY-MM-DD"
        end: entry.end_time ? entry.end_time.split("T")[0] : "", // 終日イベントのため日付のみ
        allDay: true,
      };
    } else {
      return {
        id: entry.id,
        title: entry.title,
        start: entry.start_time,
        end: entry.end_time,
        allDay: false,
      };
    }
  });

  // 日付セルがクリックされた際の処理
  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr);
    setNewTitle(""); // 新しいタイトルをリセット
    setShowForm(true); // フォームを表示
    setSelectedEventId(""); // 選択されたイベントIDをリセット
  };

  // 予定の編集処理
  const handleEventClick = (arg: { event: { id: string } }) => {
    const event = entries.find(entry => entry.id === arg.event.id);
    if (event) {
      setNewTitle(event.title); // 既存のタイトルを設定
      setSelectedDate(event.start_time.split("T")[0]); // 日付を設定
      setShowForm(true); // フォームを表示
      setSelectedEventId(event.id); // 選択されたイベントIDを設定
    }
  };

  // 予定の更新処理
  const handleUpdateEvent = async () => {
    if (!currentUserId || !selectedEventId) return; // selectedEventIdが必要

    const { error } = await supabase
      .from("Entries")
      .update({ title: newTitle }) // タイトルを更新
      .eq("id", selectedEventId); // IDでフィルタリング

    if (error) {
      console.error("Error updating event:", error);
    } else {
      fetchEntries(currentUserId); // 一覧を更新
      setShowForm(false); // フォームを非表示
      setNewTitle(""); // タイトルをリセット
    }
  };

  // 予定の削除処理
  const handleDeleteEvent = async () => {
    if (!selectedEventId) return; // selectedEventIdが必要

    const { error } = await supabase
      .from("Entries")
      .delete()
      .eq("id", selectedEventId); // IDでフィルタリング

    if (error) {
      console.error("Error deleting event:", error);
    } else {
      if (currentUserId) { // currentUserIdがnullでないことを確認
        fetchEntries(currentUserId); // 一覧を更新
      }
      setShowForm(false); // フォームを非表示
      setNewTitle(""); // タイトルをリセット
    }
  };

  // 予定追加処理
  const handleAddEvent = async () => {
    if (!currentUserId) return;

    const { error } = await supabase
      .from("Entries")
      .insert([
        {
          user_id: currentUserId,
          entry_type: "event",
          title: newTitle,
          content: "",
          start_time: `${selectedDate}T00:00:00`, // ここでstart_timeを設定
          end_time: `${selectedDate}T23:59:59`, // ここでend_timeを設定
          is_all_day: true, // all_dayをtrueに設定
          location: null,
        },
      ]);

    if (error) {
      console.error("Error adding event:", error);
    } else {
      fetchEntries(currentUserId); // 一覧を更新
      setShowForm(false); // フォームを非表示
      setNewTitle(""); // タイトルをリセット
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

      {/* 検索ボタン */}
      <button onClick={() => setShowSearch(!showSearch)} className="mt-4 btn">
        {showSearch ? "Close Search" : "Search User"}
      </button>
      {showSearch && (
        <div className="mt-2">
          <input
            type="email"
            placeholder="Enter email address"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="border p-2"
          />
          <button onClick={handleSearch} className="ml-2 btn">Search</button>
          {userName && <p className="mt-2">Selected user: {userName}</p>}
          {searchResults.length > 0 && (
            <ul className="mt-2">
              {searchResults.map((user) => (
              <li
                key={user.id}
                onClick={() => {
                  setUserName(user.username);
                  handleUserClick(user.id);
                }}
                className="cursor-pointer"
              >
                {user.username} ({user.email})
              </li>
            ))}
            </ul>
          )}
        </div>
      )}

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
            eventClick={handleEventClick}
          />
        </div>
      )}

      {showForm && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md bg-white bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-xl mb-4">
              {selectedEventId ? `Edit Event on ${selectedDate}` : `Add Event on ${selectedDate}`}
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
              {selectedEventId ? (
                <>
                  <button
                    onClick={handleUpdateEvent}
                    className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                  >
                    Update
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddEvent}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}