"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/hooks/use-user";

// 新しい型定義
interface EventDetail {
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
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvent[]>([]); // 型を変更
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const supabase = createClient();

  useEffect(() => {
    const fetchTimelineEvents = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      // 新しいRPC関数を呼び出す
      const { data, error } = await supabase
        .rpc('get_all_followed_events_grouped', {
          _follower_id: user.id
        })
        // 型アサーションを追加
        .returns<GroupedEvent[]>();

      if (error) {
        console.error("Error fetching timeline events:", error);
        // エラーハンドリング: 必要に応じてユーザーに通知
        setIsLoading(false); // エラー時もローディング解除
        return;
      }

      // 取得したデータを状態に設定
      // SQL側で ORDER BY event_date DESC されているので、そのままセット
      // dataが配列であることを確認してからセットする
      if (Array.isArray(data)) {
        setGroupedEvents(data);
      } else {
        // dataが期待した配列でない場合のエラーハンドリング
        console.error("Unexpected data format received:", data);
        setGroupedEvents([]); // または適切なエラー状態を設定
      }
      setIsLoading(false);
    };

    fetchTimelineEvents();

    // 自動更新は削除
    // const interval = setInterval(fetchTimelineEvents, 60000);
    // return () => clearInterval(interval);

    // user.id が変更された時のみ再実行
  }, [user?.id]); // supabase は依存配列から削除

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">タイムライン</h1>

      {groupedEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          {/* メッセージを調整 */}
          <p className="text-gray-600">フォローしているユーザーのイベントはありません</p>
        </div>
      ) : (
        <div className="space-y-8"> {/* 日付ごとの間隔を調整 */}
          {/* 日付ごとにグループ化して表示 */}
          {groupedEvents.map((group) => (
            <div key={group.event_date}>
              {/* 日付ヘッダー */}
              <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-gray-100 dark:bg-gray-800 py-2 px-4 rounded -mx-4 z-10">
                {formatDate(group.event_date)}
              </h2>
              <div className="space-y-6">
                {/* 同日のイベントを時間順（SQL側でソート済み）に表示 */}
                {group.events.map((event) => (
                  <div
                    key={event.event_id}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <img
                        src={event.avatar_url || "/default-avatar.png"}
                        alt={`${event.username}のアバター`}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0" // flex-shrink-0 を追加
                      />
                      <div className="flex-1 min-w-0"> {/* min-w-0 を追加 */}
                        <div className="flex items-center justify-between flex-wrap gap-x-2"> {/* flex-wrap と gap を追加 */}
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate"> {/* truncate を追加 */}
                            {event.username}
                          </h3>
                           {/* 更新日時ではなくイベント時刻を表示 */}
                           <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                             {event.is_all_day
                               ? "終日"
                               : `${formatTime(event.start_time)}${event.end_time ? ` - ${formatTime(event.end_time)}` : ''}`
                             }
                           </span>
                        </div>
                        <h4 className="text-xl font-medium mt-2 text-gray-800 dark:text-gray-200">{event.title}</h4>
                        {/* 詳細情報を表示 */}
                        {event.content && (
                          <p className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{event.content}</p>
                        )}
                        {event.location && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">場所: {event.location}</p>
                        )}
                         {/* 必要であれば最終更新日時も表示 */}
                         {/* <p className="mt-1 text-xs text-gray-400">最終更新: {new Date(event.updated_at).toLocaleString('ja-JP')}</p> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
