"use client";

import React, { useState, useEffect } from "react";
import Calendar from "./Calendar";
import { Event } from '../app/types';
import { createClient } from "@/utils/supabase/client";
import { EventDialog } from "@/components/EventDialog"

interface CalendarViewProps {
  userId?: string; // オプショナルにして、未指定の場合は現在のユーザーのイベントを取得
  currentUserId: string;
}

export default function CalendarView({ userId, currentUserId }: CalendarViewProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const isOwner = !userId || userId === currentUserId;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const supabase = createClient();

  //AvatarUrlを取得
  const fetchAvatarUrl = async () => {
    console.log("userId:", userId)
    const { data, error } = await supabase.rpc("get_user_avatar", {
      user_id: userId,
    });

    if (error) {
      console.error("Failed to fetch user avatar info:", error.message);
    } else if (data && data.length > 0) {
      setAvatarUrl(data[0].avatar_url);
      setUsername(data[0].username);
    }
  };

  // イベント一覧を取得する関数（RPCを使用）
  const fetchEvents = async () => {
    if (userId) {
      // 他のユーザーのイベントを取得
      const { data, error } = await supabase
        .rpc('get_user_events', { _user_id: userId });

      if (error) {
        console.error("Failed to fetch events:", error);
        return;
      }
      setEvents(data || []);
    } else {
      // 現在のユーザーのイベントを取得（既存の実装）
      const res = await fetch(`/api/event`, { cache: "no-store" });
      if (res.ok) {
        const data: Event[] = await res.json();
        setEvents(data);
      } else {
        console.error("Failed to fetch events");
      }
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchAvatarUrl();
  }, [userId]); // userIdが変更されたときにも再取得

  // EventFormModal の表示状態を管理（初期状態は非表示）
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("");
  const [selectedRange, setSelectedRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if(!dialogOpen) {
      setSelectedEventId("");
      setModalPosition({ top: 0, left: 0 }); // モーダル位置を初期化
    }
  }, [dialogOpen]); // userIdが変更されたときにも再取得

  // 日付がクリックされたときの処理
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedEventId(""); // 追加の場合はイベントIDは空にする
    setSelectedEventTitle(""); // 追加の場合はタイトルは空にする
    setDialogOpen(true);
  };

  // イベントがクリックされたときの処理
  const handleEventClick = (arg: { event: { id: string, title: string } }) => {
    setSelectedDate(""); // ← これ追加
    setSelectedRange(null); // ← これも
    setSelectedEventId(arg.event.id);
    setSelectedEventTitle(arg.event.title); // クリックされたイベントのタイトルを設定
    setDialogOpen(true);
    console.log("isOwner:", isOwner)
  };

  const handleDragDateChange = ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    setSelectedRange({ startDate, endDate });
    setDialogOpen(true);
  };

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <Calendar
        avatarUrl={avatarUrl}
        username={username}
        events={events}
        editable={true}
        selectable={true}
        dateClick={(arg) => handleDateClick(arg.dateStr)}
        eventClick={handleEventClick}
        dragDateChange={isOwner ? handleDragDateChange : undefined}
        modalOpen={dialogOpen}
        modalPosition={modalPosition}
        setModalPosition={setModalPosition}
      />

      {dialogOpen && (
        <EventDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isOwner={isOwner}
          entryId={selectedEventId}
          currentUserId={currentUserId}
          selectedStartDate={selectedRange?.startDate || ""}
          selectedEndDate={selectedRange?.endDate || ""}
          modalPosition={modalPosition}
        />
      )}
    </div>
  );
}