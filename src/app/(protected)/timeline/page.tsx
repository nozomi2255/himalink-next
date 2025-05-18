// src/app/(protected)/timeline/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Search } from "lucide-react";

// 型定義
interface EventDetail {
  id?: string; // 検索結果では必要、イベントには不要
  is_following?: boolean; // 検索結果で使用
  event_id: string;
  user_id: string;
  username: string;
  title: string;
  content: string | null;
  entry_type: string;
  start_time: string;
  end_time: string | null;
  is_all_day: boolean;
  location: string | null;
  updated_at: string;
  avatar_url: string | null;
}

interface GroupedEvent {
  event_date: string;
  events: EventDetail[];
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

// 日付フォーマット関数 (必要に応じてカスタマイズ)
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  // 日本語ロケールで年月日と曜日を表示
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short', // 例: (月)
    timeZone: 'Asia/Tokyo', // タイムゾーンを明示
  });
};

// 時刻フォーマット関数 (必要に応じてカスタマイズ)
const formatTime = (timeString: string | null) => {
  if (!timeString) return null;
  const date = new Date(timeString);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo', // タイムゾーンを明示
  });
};

export default function TimelinePage() {
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<EventDetail[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const supabase = createClient();

  // --- 追加: イベントごとのリアクション・コメント用state ---
  const [eventReactions, setEventReactions] = useState<Record<string, Record<string, number>>>({});
  const [eventReactionDetails, setEventReactionDetails] = useState<Record<string, Record<string, ReactionDetail>>>({});
  const [eventUserReactions, setEventUserReactions] = useState<Record<string, string[]>>({});
  const [eventComments, setEventComments] = useState<Record<string, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  // 画像一覧用state
  const [eventImages, setEventImages] = useState<Record<string, any[]>>({});
  // イベント画像取得
  const fetchEntryImages = async (eventId: string) => {
    const { data, error } = await supabase.rpc("get_entry_images", {
      p_entry_id: eventId,
    });
    if (!error) {
      setEventImages((prev) => ({ ...prev, [eventId]: data || [] }));
    } else {
      console.error("画像取得エラー:", error);
    }
  };

  // 画像アップロード
  const handleImageUpload = async (eventId: string, file: File | undefined) => {
    if (!file) return;
    const fileExt = file.name.split(".").pop();
    const filePath = `entry-images/${eventId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("public-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("アップロードエラー:", uploadError);
      return;
    }

    const { data: urlData } = supabase.storage.from("public-files").getPublicUrl(filePath);

    const { error: rpcError } = await supabase.rpc("add_entry_image", {
      p_entry_id: eventId,
      p_image_url: urlData?.publicUrl,
      p_caption: "", // キャプションがあれば後で追加可
    });

    if (rpcError) {
      console.error("DB登録エラー:", rpcError);
      return;
    }

    fetchEntryImages(eventId);
  };

  // 画像削除
  const handleImageDelete = async (eventId: string, imageId: string, imageUrl: string) => {
    const path = imageUrl.split("/public-files/")[1];
    if (!path) return;

    const { error: storageError } = await supabase.storage
      .from("public-files")
      .remove([path]);

    if (storageError) {
      console.error("ストレージ削除エラー:", storageError);
      return;
    }

    const { error: dbError } = await supabase
      .from("EntryImages")
      .delete()
      .eq("id", imageId);

    if (dbError) {
      console.error("DB削除エラー:", dbError);
      return;
    }

    fetchEntryImages(eventId);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('search_users', {
          search_query: searchQuery.toLowerCase()
        });

      if (error) throw error;

      // 検索結果がイベントではなくユーザー型の場合は変換処理を記述
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user?.id) throw new Error("ユーザーが見つかりません");

      const { data: followingIdsData, error: followError } = await supabase
        .rpc('get_following_ids', { follower_id: currentUser.user.id });

      if (followError) throw followError;

      const followingIds = new Set(
        (followingIdsData ?? []).map((row: { following_id: string }) => row.following_id)
      );

      setSearchResults(
        data.map((user: any) => ({
          ...user,
          is_following: followingIds.has(user.id),
        }))
      );
    } catch (error) {
      console.error("検索エラー:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user?.id) throw new Error("ログインが必要です");

      const { error } = await supabase
        .rpc('toggle_follow', {
          p_follower_id: currentUser.user.id,
          p_following_id: userId,
        });

      if (error) throw error;

      setSearchResults(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, is_following: !user.is_following }
            : user
        )
      );
    } catch (error) {
      console.error("フォロー処理中にエラー:", error);
    }
  };

  useEffect(() => {
    const fetchTimelineEvents = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      // 新しいRPC関数を呼び出す
      const { data, error } = await supabase
        .rpc('get_all_followed_events_grouped', {
          _follower_id: user.id
        })
        .returns<GroupedEvent[]>();

      if (error) {
        console.error("Error fetching timeline events:", error);
        setIsLoading(false);
        return;
      }

      if (Array.isArray(data)) {
        setGroupedEvents(data);
      } else {
        console.error("Unexpected data format received:", data);
        setGroupedEvents([]);
      }
      setIsLoading(false);
    };

    fetchTimelineEvents();
  }, [user?.id]);

  // ──────────────── 追加: イベントごとのリアクション・コメント・画像初期取得 ────────────────
  useEffect(() => {
    // 全イベントを1配列に
    const allEvents = groupedEvents.flatMap(g => g.events);
    if (!allEvents.length) return;

    let isMounted = true;
    (async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        const currentUserId = currentUser?.id;
        const newEventReactions: Record<string, Record<string, number>> = {};
        const newEventReactionDetails: Record<string, Record<string, ReactionDetail>> = {};
        const newEventUserReactions: Record<string, string[]> = {};
        const newEventComments: Record<string, any[]> = {};
        await Promise.all(
          allEvents.map(async (ev) => {
            const [summaryRes, usersRes, commentsRes] = await Promise.all([
              supabase.rpc("get_entry_reactions_summary", { p_entry_id: ev.event_id }),
              supabase.rpc("get_entry_reaction_users", { p_entry_id: ev.event_id }),
              supabase.rpc("get_entry_comments", { p_entry_id: ev.event_id }),
            ]);
            // summary
            const summaryMap: Record<string, number> = {};
            (summaryRes.data ?? []).forEach((r: any) => {
              summaryMap[r.reaction_type] = r.count;
            });
            newEventReactions[ev.event_id] = summaryMap;
            // detail
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
            newEventReactionDetails[ev.event_id] = detailMap;
            newEventUserReactions[ev.event_id] = Array.from(currentUserReactionsSet);
            // comments
            newEventComments[ev.event_id] = commentsRes.data ?? [];
            // 画像
            fetchEntryImages(ev.event_id);
          })
        );
        if (!isMounted) return;
        setEventReactions(newEventReactions);
        setEventReactionDetails(newEventReactionDetails);
        setEventUserReactions(newEventUserReactions);
        setEventComments(newEventComments);
      } catch (err) {
        console.error("[TimelinePage] fetchAllEventReactions error:", err);
      }
    })();
    return () => { isMounted = false; };
  }, [groupedEvents]);

  // ──────────────── 追加: リアクション処理関数 ────────────────
  const handleEventReactionToggle = async (eventId: string, emoji: string) => {
    try {
      const { data: existingReaction } = await supabase.rpc("get_user_reaction", {
        p_entry_id: eventId,
        p_reaction_type: emoji,
      });

      if (existingReaction && existingReaction.length > 0) {
        await supabase.rpc("delete_entry_reaction", {
          p_entry_id: eventId,
          p_reaction_type: emoji,
        });
      } else {
        await supabase.rpc("add_entry_reaction", {
          p_entry_id: eventId,
          p_reaction_type: emoji,
        });
      }

      // 最新情報取得
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
      console.error("リアクション更新エラー:", err);
    }
  };

  // ──────────────── 追加: コメント投稿処理 ────────────────
  const handleCommentChange = (eventId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [eventId]: value }));
  };

  const handleCommentSubmit = async (eventId: string) => {
    const content = commentInputs[eventId];
    if (!content?.trim()) return;
    const { error } = await supabase.rpc("add_entry_comment", {
      p_entry_id: eventId,
      p_comment: content,
    });
    if (error) {
      console.error("コメント投稿エラー:", error);
      return;
    }
    const { data: comments } = await supabase.rpc("get_entry_comments", {
      p_entry_id: eventId,
    });
    setEventComments((prev) => ({ ...prev, [eventId]: comments || [] }));
    setCommentInputs((prev) => ({ ...prev, [eventId]: "" }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="ユーザーを検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={searchLoading}>
            <Search className="size-4 mr-2" />
            {searchLoading ? "検索中..." : "検索"}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-4 bg-white p-4 rounded-lg shadow-md border border-gray-200">
            {searchResults.map((user: any) => (
              <div key={user.id} className="flex items-center justify-between border-b pb-3 last:border-none">
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <Button
                  variant={user.is_following ? "default" : "outline"}
                  onClick={() => handleFollow(user.id)}
                >
                  {user.is_following ? "フォロー中" : "フォロー"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <h1 className="text-2xl font-bold mb-8">タイムライン</h1>

      {groupedEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">フォローしているユーザーのイベントはありません</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEvents.map((group) => (
            <div key={group.event_date}>
              <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-gray-100 dark:bg-gray-800 py-2 px-4 rounded -mx-4 z-10">
                {formatDate(group.event_date)}
              </h2>
              <div className="space-y-6">
                {group.events.map((event) => (
                  <Card key={event.event_id}>
                    <CardHeader className="flex flex-row items-start gap-4">
                      <Avatar>
                        <AvatarImage src={event.avatar_url || "/default-avatar.png"} alt={`${event.username}のアバター`} />
                        <AvatarFallback>{event.username.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-x-2">
                          <CardTitle className="text-lg truncate">{event.username}</CardTitle>
                          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {event.is_all_day
                              ? "終日"
                              : `${formatTime(event.start_time)}${event.end_time ? ` - ${formatTime(event.end_time)}` : ''}`
                            }
                          </span>
                        </div>
                        <h4 className="text-xl font-medium mt-2 text-gray-800 dark:text-gray-200">{event.title}</h4>
                        {event.content && (
                          <p className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{event.content}</p>
                        )}
                        {event.location && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">場所: {event.location}</p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* 画像一覧表示 */}
                      {eventImages[event.event_id]?.map((img, index) => (
                        <div key={index} className="mt-4 relative inline-block">
                          <img
                            src={img.image_url}
                            alt={img.caption || "event image"}
                            className="rounded w-full max-w-md"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 hover:bg-white"
                            onClick={() => handleImageDelete(event.event_id, img.id, img.image_url)}
                          >
                            ✕
                          </Button>
                          {img.caption && <p className="text-sm text-gray-500 mt-1">{img.caption}</p>}
                        </div>
                      ))}

                      {/* アップロードフォーム */}
                      <div className="mt-4 space-y-2">
                        <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(event.event_id, e.target.files?.[0])} />
                      </div>
                      <div className="mt-2 flex gap-2">
                        {["👍", "❤️", "🎉", "🤔"].map((emoji) => (
                          <Button
                            key={emoji}
                            variant={(eventUserReactions[event.event_id] || []).includes(emoji) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleEventReactionToggle(event.event_id, emoji)}
                          >
                            {emoji} {(eventReactions[event.event_id]?.[emoji] || 0)}
                          </Button>
                        ))}
                      </div>
                      <div className="mt-4">
                        <textarea
                          placeholder="コメントを入力..."
                          className="w-full border rounded p-2 text-sm"
                          rows={2}
                          value={commentInputs[event.event_id] || ""}
                          onChange={(e) => handleCommentChange(event.event_id, e.target.value)}
                        />
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => handleCommentSubmit(event.event_id)}
                        >
                          コメントを投稿
                        </Button>
                        <div className="mt-2 space-y-1 text-sm text-gray-700">
                          {(eventComments[event.event_id] || []).map((c: any, index: number) => (
                            <div key={index} className="border rounded px-2 py-1 bg-gray-50 flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                {c.avatar_url && (
                                  <img
                                    src={c.avatar_url}
                                    alt={c.username || c.user_id}
                                    className="w-5 h-5 rounded-full object-cover"
                                  />
                                )}
                                <strong>{c.username || c.user_id}</strong>
                              </span>
                              <span>: {c.comment}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
