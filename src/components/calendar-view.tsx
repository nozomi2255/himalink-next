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

interface ReactionUser {
  user_id: string;
  username: string;
  avatar_url?: string;
}
interface ReactionDetail {
  count: number;
  users: ReactionUser[];
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
  const [eventReactions, setEventReactions] = useState<Record<string, Record<string, number>>>({});
  const [eventReactionDetails, setEventReactionDetails] = useState<Record<string, Record<string, ReactionDetail>>>({});
  const [eventUserReactions, setEventUserReactions] = useState<Record<string, string[]>>({});
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

  // ──────────────────────────────────────────────
  // Fetch reactions for *all* events whenever
  //   - the calendar opens (initial mount) OR
  //   - the `events` array changes
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (events.length === 0) return;

    let isMounted = true;

    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        const newEventReactions: Record<string, Record<string, number>> = {};
        const newEventReactionDetails: Record<string, Record<string, ReactionDetail>> = {};
        const newEventUserReactions: Record<string, string[]> = {};

        await Promise.all(
          events.map(async (ev) => {
            const [summaryRes, usersRes] = await Promise.all([
              supabase.rpc("get_entry_reactions_summary", { p_entry_id: ev.id }),
              supabase.rpc("get_entry_reaction_users", { p_entry_id: ev.id }),
            ]);

            // Summary
            const summaryMap: Record<string, number> = {};
            (summaryRes.data ?? []).forEach((r: any) => {
              summaryMap[r.reaction_type] = r.count;
            });
            newEventReactions[ev.id] = summaryMap;

            // Detail + current‑user
            const detailMap: Record<string, ReactionDetail> = {};
            const currentUserReactionsSet = new Set<string>();

            (usersRes.data ?? []).forEach((r: any) => {
              if (!detailMap[r.reaction_type]) {
                detailMap[r.reaction_type] = { count: 0, users: [] };
              }
              detailMap[r.reaction_type].count++;
              detailMap[r.reaction_type].users.push({
                user_id: r.user_id,
                username: r.username || r.user_id,
                avatar_url: r.avatar_url,
              });
              if (r.user_id === currentUserId) {
                currentUserReactionsSet.add(r.reaction_type);
              }
            });

            newEventReactionDetails[ev.id] = detailMap;
            newEventUserReactions[ev.id] = Array.from(currentUserReactionsSet);
          })
        );

        if (!isMounted) return;
        setEventReactions(newEventReactions);
        setEventReactionDetails(newEventReactionDetails);
        setEventUserReactions(newEventUserReactions);
      } catch (err) {
        console.error("[CalendarView] fetchAllEventReactions error:", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [events, supabase]);
  // ──────────────────────────────────────────────

  const handleEventReactionToggle = async (eventId: string, emoji: string) => {
    try {
      const { data: existingReaction } = await supabase.rpc("get_user_reaction", {
        p_entry_id: eventId,
        p_reaction_type: emoji,
      });

      if (existingReaction && existingReaction.length > 0) {
        // remove
        const { error } = await supabase.rpc("delete_entry_reaction", {
          p_entry_id: eventId,
          p_reaction_type: emoji,
        });
        if (error) throw error;
      } else {
        // add
        const { error } = await supabase.rpc("add_entry_reaction", {
          p_entry_id: eventId,
          p_reaction_type: emoji,
        });
        if (error) throw error;
      }

      // refresh single event reaction info
      const [{ data: summary }, { data: users }] = await Promise.all([
        supabase.rpc("get_entry_reactions_summary", { p_entry_id: eventId }),
        supabase.rpc("get_entry_reaction_users", { p_entry_id: eventId }),
      ]);

      const summaryMap: Record<string, number> = {};
      (summary ?? []).forEach((r: any) => {
        summaryMap[r.reaction_type] = r.count;
      });

      const detailMap: Record<string, ReactionDetail> = {};
      const currentUserReactionsSet = new Set<string>();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = user?.id;

      (users ?? []).forEach((r: any) => {
        if (!detailMap[r.reaction_type]) {
          detailMap[r.reaction_type] = { count: 0, users: [] };
        }
        detailMap[r.reaction_type].count++;
        detailMap[r.reaction_type].users.push({
          user_id: r.user_id,
          username: r.username || r.user_id,
          avatar_url: r.avatar_url,
        });
        if (r.user_id === currentUserId) {
          currentUserReactionsSet.add(r.reaction_type);
        }
      });

      setEventReactions((prev) => ({ ...prev, [eventId]: summaryMap }));
      setEventReactionDetails((prev) => ({ ...prev, [eventId]: detailMap }));
      setEventUserReactions((prev) => ({ ...prev, [eventId]: Array.from(currentUserReactionsSet) }));
    } catch (err) {
      console.error("[CalendarView] handleEventReactionToggle error:", err);
    }
  };

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

  // ---------------------- 追加 state (entry/comments/reactions) ----------------------
  const [entry, setEntry] = useState<Event | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [reactionDetails, setReactionDetails] = useState<Record<string, ReactionDetail>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [commentText, setCommentText] = useState("");

  // entryId 選択時の取得処理
  useEffect(() => {
    const fetchEntryData = async () => {
      if (!selectedEventId) return;
      const [entryRes, commentsRes, summaryRes, usersRes] = await Promise.all([
        supabase.rpc("get_entry_with_details", { p_entry_id: selectedEventId }),
        supabase.rpc("get_entry_comments", { p_entry_id: selectedEventId }),
        supabase.rpc("get_entry_reactions_summary", { p_entry_id: selectedEventId }),
        supabase.rpc("get_entry_reaction_users", { p_entry_id: selectedEventId }),
      ]);

      const currentUser = (await supabase.auth.getUser()).data.user;
      const currentUserId = currentUser?.id;

      setEntry(entryRes.data?.[0] || null);
      setComments(commentsRes.data ?? []);
      setReactions(Object.fromEntries((summaryRes.data ?? []).map((r: any) => [r.reaction_type, r.count])));

      const detailsMap: Record<string, ReactionDetail> = {};
      const currentUserReactionsSet = new Set<string>();
      (usersRes.data ?? []).forEach((r: any) => {
        if (!detailsMap[r.reaction_type]) {
          detailsMap[r.reaction_type] = { count: 0, users: [] };
        }
        detailsMap[r.reaction_type].count++;
        detailsMap[r.reaction_type].users.push({
          user_id: r.user_id,
          username: r.username || r.user_id,
          avatar_url: r.avatar_url,
        });
        if (r.user_id === currentUserId) {
          currentUserReactionsSet.add(r.reaction_type);
        }
      });
      setReactionDetails(detailsMap);
      setUserReactions(Array.from(currentUserReactionsSet));
    };

    if (dialogOpen && selectedEventId) {
      fetchEntryData();
    } else {
      setEntry(null);
      setComments([]);
      setReactions({});
      setReactionDetails({});
      setUserReactions([]);
    }
  }, [dialogOpen, selectedEventId, supabase]);

  // コメント送信処理
  const handleCommentTextChange = (text: string) => {
    setCommentText(text);
  };

  const handleCommentSubmit = async () => {
    if (!selectedEventId || !commentText.trim()) return;

    const { error } = await supabase.rpc("add_entry_comment", {
      p_entry_id: selectedEventId,
      p_comment: commentText,
    });

    if (error) {
      console.error("コメント投稿エラー:", error.message);
      return;
    }

    const { data } = await supabase.rpc("get_entry_comments", {
      p_entry_id: selectedEventId,
    });

    setComments(data ?? []);
    setCommentText("");
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
          eventReactions={eventReactions}
          eventReactionDetails={eventReactionDetails}
          eventUserReactions={eventUserReactions}
          onEventReactionToggle={handleEventReactionToggle}
          // --- entry/comments/reactions props 追加 ---
          entry={entry}
          comments={comments}
          reactions={reactions}
          reactionDetails={reactionDetails}
          userReactions={userReactions}
          commentText={commentText}
          onCommentTextChange={handleCommentTextChange}
          onCommentSubmit={handleCommentSubmit}
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
              eventReactions={eventReactions}
              eventReactionDetails={eventReactionDetails}
              eventUserReactions={eventUserReactions}
              onEventReactionToggle={handleEventReactionToggle}
            />
          );
        })()}
    </div>
  );
}