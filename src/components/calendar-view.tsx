"use client";

import React, { useState, useEffect } from "react";
import MainCalendar from "./main-calendar";
import { Event } from '../app/types';
import { createClient } from "@/utils/supabase/client";
import { EventDialog } from "@/components/event-dialog"
import { useCalendar } from "@/contexts/calendar-context";
import { CalendarTimelineSheet } from "@/components/calendar-timeline-sheet";
import type { UserProfile } from "@/app/types"

interface CalendarViewProps {
  userId?: string; // オプショナルにして、未指定の場合は現在のユーザーのイベントを取得
  currentUserId: string;
}

export default function CalendarView({ userId, currentUserId }: CalendarViewProps) {
  const { setUserId, setAvatarUrl: setContextAvatarUrl, setUsername: setContextUsername } = useCalendar();
  const [events, setEvents] = useState<Event[]>([]);
  const isOwner = !userId || userId === currentUserId;
  const [userProfile, setUserProfile] = useState<UserProfile>({
    avatarUrl: null,
    username: "",
    bio: "",
  });
  const supabase = createClient();

  // ContextにユーザーIDを設定
  useEffect(() => {
    if (currentUserId) {
      setUserId(currentUserId);
    }
  }, [currentUserId, setUserId]);

  // プロフィール情報の取得
  const fetchUserProfile = async () => {
    console.log("userId:", userId);

    const { data, error } = await supabase.rpc("get_user_profile_by_id", {
      target_user_id: userId,
    });

    if (error) {
      console.error("Failed to fetch user profile info:", error.message);
      return;
    }

    if (data && data.length > 0) {
      const { avatar_url, username, bio } = data[0];

      setUserProfile({
        avatarUrl: avatar_url,
        username,
        bio,
      });

      // Contextにも設定
      setContextAvatarUrl(avatar_url);
      setContextUsername(username);
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
    fetchUserProfile();
  }, [userId]); // userIdが変更されたときにも再取得

  // eventsの値が変わったときに実行されるeffectを追加
  useEffect(() => {
    console.log("events updated:", events);
  }, [events]);

  // EventFormModal の表示状態を管理（初期状態は非表示）
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>("");
  const [selectedRange, setSelectedRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!dialogOpen) {
      setSelectedEventId("");
      setModalPosition({ top: 0, left: 0 }); // モーダル位置を初期化
      fetchEvents();
    }
  }, [dialogOpen]); // userIdが変更されたときにも再取得

  // 日付がクリックされたときの処理
  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedEventId("");
    setSelectedEventTitle("");
    setDialogOpen(true);
  };

  // イベントがクリックされたときの処理
  const handleEventClick = (arg: { event: { id: string, title: string } }) => {
    setSelectedDate("");
    setSelectedRange(null);
    setSelectedEventId(arg.event.id);
    setSelectedEventTitle(arg.event.title);
    setDialogOpen(true);
  };

  const handleDragDateChange = ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    setSelectedRange({ startDate, endDate });
    setDialogOpen(true);
  };

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <MainCalendar
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
          events={events}
          entryId={selectedEventId}
          targetUserId={userId}
          targetUserProfile={userProfile}
          selectedStartDate={selectedRange?.startDate || ""}
          selectedEndDate={selectedRange?.endDate || ""}
          modalPosition={modalPosition}
        />
      )}
    </div>
  );
}