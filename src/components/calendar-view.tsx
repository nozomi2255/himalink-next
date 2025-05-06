"use client";

import React, { useState, useEffect } from "react";
import MainCalendar from "./main-calendar";
import { Event } from '../app/types';
import { createClient } from "@/utils/supabase/client";
import { EventDialog } from "@/components/event-dialog"
import { EventDialog as FollowedRecentEventDialog } from "@/components/followed-recent-event-dialog";
import { useCalendar } from "@/contexts/calendar-context";
import type { UserProfile, RecentEvent } from "@/app/types"

interface CalendarViewProps {
  userId?: string; // オプショナルにして、未指定の場合は現在のユーザーのイベントを取得
  currentUserId: string;
}

export default function CalendarView({ userId, currentUserId }: CalendarViewProps) {
  const {
    setUserId,
    setAvatarUrl: setContextAvatarUrl,
    setUsername: setContextUsername,
    setRecentAvatars,
    setIsLoadingRecentAvatars,
    setRecentAvatarsError,
    selectedUserIdForDialog,
    isFollowedEventDialogOpen,
    setIsFollowedEventDialogOpen,
    recentAvatars,
  } = useCalendar();
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

  // --- ここから RecentEvents 取得ロジック ---
  useEffect(() => {
    const fetchRecentEvents = async () => {
      setIsLoadingRecentAvatars(true);
      setRecentAvatarsError(null);

      // currentUserId が利用可能になるまで待機
      if (!currentUserId) {
        console.log("Current user ID not available yet for recent events fetch.");
        setIsLoadingRecentAvatars(false); // 待機中はローディング解除
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_recent_followed_events', {
            _follower_id: currentUserId // props の currentUserId を使用
          });

        if (error) {
          console.error("Error fetching recent events:", error);
          setRecentAvatarsError(error.message);
          return;
        }

        console.log("Recent events data fetched in CalendarView:", data);
        setRecentAvatars(data || []); // データをコンテキストにセット
      } catch (err: any) { // エラー型を明示
        console.error("Exception in fetching recent events:", err);
        setRecentAvatarsError("データ取得中にエラーが発生しました");
      } finally {
        setIsLoadingRecentAvatars(false); // ローディング状態を解除
      }
    };

    fetchRecentEvents();

    // 1分ごとに更新
    const interval = setInterval(fetchRecentEvents, 60000);

    // クリーンアップ関数
    return () => clearInterval(interval);
  }, [currentUserId, supabase, setRecentAvatars, setIsLoadingRecentAvatars, setRecentAvatarsError]); // 依存配列を更新
  // --- ここまで RecentEvents 取得ロジック ---

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

      {isFollowedEventDialogOpen && selectedUserIdForDialog && (() => {
          // 選択されたユーザーのイベントをフィルタリング
          const filteredEvents = recentAvatars.filter(event => event.user_id === selectedUserIdForDialog);
          // ユーザー名を取得 (フィルタ結果があれば最初の要素から)
          const username = filteredEvents.length > 0 ? filteredEvents[0].username : 'ユーザー';
          // Event[] 型に変換
          const mappedEvents = filteredEvents.map(re => ({
            ...re,
            id: re.event_id,
            created_at: re.updated_at, 
          }));

          return (
            <FollowedRecentEventDialog
              open={isFollowedEventDialogOpen}
              onOpenChange={setIsFollowedEventDialogOpen}
              isOwner={false}
              events={mappedEvents} // 変換後のイベント配列
              targetUserId={selectedUserIdForDialog}
              username={username} // 抽出したユーザー名を渡す
            />
          );
        })()}
    </div>
  );
}