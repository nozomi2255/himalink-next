import { useCalendar } from "@/contexts/calendar-context";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

interface RecentEvent {
  event_id: string;
  user_id: string;
  avatar_url: string;
}

interface CalendarHeaderProps {
  // アニメーション関連のプロパティを削除
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({}) => {
  const { currentMonth, userId } = useCalendar();
  const [recentAvatars, setRecentAvatars] = useState<RecentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const currentDate = new Date(currentMonth + "-01"); // YYYY-MM-01 形式に変換
  
  // 月の日本語表記
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const year = currentDate.getFullYear();
  const month = monthNames[currentDate.getMonth()];

  useEffect(() => {
    const fetchRecentEvents = async () => {
      setIsLoading(true);
      setError(null);
      
      console.log("Current userId:", userId);
      
      if (!userId) {
        setIsLoading(false);
        // エラーメッセージを表示しない（開発時のみコンソールに出力）
        console.log("ユーザーIDが設定されていません - 待機中");
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_recent_followed_events', {
            _follower_id: userId
          });

        if (error) {
          console.error("Error fetching recent events:", error);
          setError(error.message);
          return;
        }

        console.log("Recent events data:", data);
        setRecentAvatars(data || []);
      } catch (err) {
        console.error("Exception in fetching events:", err);
        setError("データ取得中にエラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentEvents();

    // 1分ごとに更新
    const interval = setInterval(fetchRecentEvents, 60000);

    return () => clearInterval(interval);
  }, [userId, supabase]);

  // 同じユーザーIDのアバターは1つだけ表示する処理
  const uniqueAvatars = recentAvatars.reduce<RecentEvent[]>((unique, event) => {
    // すでに同じユーザーIDのアバターが追加されているか確認
    const isUserIdExists = unique.some(item => item.user_id === event.user_id);
    
    // ユーザーIDが存在しない場合のみ追加
    if (!isUserIdExists) {
      unique.push(event);
    }
    
    return unique;
  }, []);
  
  // すべてのユニークなアバターを表示（最大件数の制限を削除）
  const avatarsToDisplay = uniqueAvatars;

  return (
    <div className="sticky flex-col top-0 z-[40] bg-white border-b border-gray-300 shadow-sm p-4">
      <div className="flex flex-row items-center px-2">
        <div className="w-24 flex flex-col items-center mr-4">
          <span className="text-sm text-gray-500">{year}年</span>
          <h2 className="text-2xl font-bold">{month}</h2>
        </div>
        <div className="flex-1 overflow-x-auto max-w-[70vw]">
          <div className="flex space-x-2">
            {avatarsToDisplay.map((event, index) => (
              <Link 
                key={`${event.user_id || index}`}
                href={`/other-calendar/${event.user_id}`}
                title="このユーザーのカレンダーを表示"
              >
                <Avatar 
                  className="inline-flex border-2 border-white hover:border-blue-400 transition-colors cursor-pointer"
                  style={{ width: '48px', height: '48px', zIndex: 10 - (index % 10) }}
                >
                  <AvatarImage src={event.avatar_url || "/default-avatar.png"} alt="ユーザーアバター" />
                  <AvatarFallback>ユ</AvatarFallback>
                </Avatar>
              </Link>
            ))}
            {isLoading && <div className="text-sm text-gray-500 my-auto ml-2">読込中...</div>}
            {!isLoading && avatarsToDisplay.length === 0 && !error && userId && (
              <div className="text-sm text-gray-500 my-auto ml-2">最近の更新はありません</div>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        {["日", "月", "火", "水", "木", "金", "土"].map((day, idx) => (
          <div key={idx} className="w-1/7 text-center text-sm font-medium">{day}</div>
        ))}
      </div>
    </div>
  );
}; 