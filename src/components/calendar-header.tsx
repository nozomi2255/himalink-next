import { useCalendar } from "@/contexts/calendar-context";
import { useEffect, useState } from "react";
// import { createClient } from "@/utils/supabase/client"; // May not be needed anymore
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import type { RecentEvent } from "@/app/types"; // Import type from types.ts

interface CalendarHeaderProps {
  // アニメーション関連のプロパティを削除
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({}) => {
  const {
    currentMonth,
    userId,
    setSelectedUserIdForDialog,
    recentAvatars, // Get from context
    isLoadingRecentAvatars, // Get from context
    recentAvatarsError, // Get from context
    setIsFollowedEventDialogOpen, // Get setter from context
    /* , openUserEventDialog */
  } = useCalendar();
  const [visitedUsers, setVisitedUsers] = useState<{[key: string]: {visited: boolean, lastSeenUpdate?: string}}>({});
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  // const supabase = createClient(); // Remove if not used elsewhere in this component
  const currentDate = new Date(currentMonth + "-01"); // YYYY-MM-01 形式に変換
  
  // 月の日本語表記
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const year = currentDate.getFullYear();
  const month = monthNames[currentDate.getMonth()];

  useEffect(() => {
    // 訪問済みユーザーをローカルストレージから読み込む
    const storedVisitedUsers = localStorage.getItem('visitedUsers');
    if (storedVisitedUsers) {
      setVisitedUsers(JSON.parse(storedVisitedUsers));
    }
  }, []);

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

  // ユーザー訪問の記録 & ダイアログを開く
  const handleAvatarClick = (userId: string, updatedAt?: string) => {
    setLoadingUserId(userId); // ローディング表示は一旦残す（ダイアログ表示中に見せるか検討）

    // 訪問済みユーザー情報を更新
    const newVisitedUsers = { 
      ...visitedUsers,
      [userId]: { 
        visited: true, 
        lastSeenUpdate: updatedAt 
      }
    };
    
    setVisitedUsers(newVisitedUsers);
    localStorage.setItem('visitedUsers', JSON.stringify(newVisitedUsers));

    // コンテキストに選択されたユーザーIDを設定
    setSelectedUserIdForDialog(userId);
    // フォローしているユーザーのイベントダイアログを開く
    setIsFollowedEventDialogOpen(true);

    console.log(`Set selected user ID in context: ${userId}`); // ログも更新

    // ダイアログを開いた後、ローディング状態を解除する（適切なタイミングで）
    setLoadingUserId(null);
  };

  // ユーザーが新しいイベントを持っているかチェック
  const hasNewEvent = (userId: string, updatedAt?: string) => {
    if (!visitedUsers[userId] || !updatedAt) return true;
    
    const lastSeen = visitedUsers[userId].lastSeenUpdate;
    
    // 最後に見た更新日時がない、または新しい更新がある場合
    if (!lastSeen || (updatedAt && lastSeen < updatedAt)) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="sticky flex-col top-0 z-[40] bg-white border-b border-gray-300 shadow-sm p-4">
      <div className="flex flex-row items-center px-2">
        <div className="w-17 flex flex-col items-start">
          <span className="text-sm text-gray-500">{year}年</span>
          <h2 className="text-2xl font-bold">{month}</h2>
        </div>
        <div className="flex-1 overflow-x-auto max-w-[80vw]">
          <div className="flex space-x-2">
            {avatarsToDisplay.map((event, index) => {
              const isVisited = visitedUsers[event.user_id]?.visited || false;
              const hasNewContent = hasNewEvent(event.user_id, event.updated_at);
              const isLoadingAvatar = loadingUserId === event.user_id;
              
              // ボーダースタイルの設定 - 新しいコンテンツがある場合はカラーボーダー
              const borderStyle = isVisited && !hasNewContent
                ? 'border-2 border-gray-200' 
                : 'p-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600';
              
              return (
                <div 
                  key={`${event.user_id || index}`}
                  className={`relative rounded-full cursor-pointer ${borderStyle}`}
                  style={{ width: '52px', height: '52px' }}
                  onClick={() => handleAvatarClick(event.user_id, event.updated_at)}
                  title="このユーザーのイベントを表示"
                >
                  <Avatar 
                    className={`inline-flex bg-white`}
                    style={{ width: '48px', height: '48px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  >
                    <AvatarImage src={event.avatar_url || "/default-avatar.png"} alt="ユーザーアバター" />
                    <AvatarFallback>ユ</AvatarFallback>
                  </Avatar>
                  {isLoadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full z-20">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
              );
            })}
            {isLoadingRecentAvatars && <div className="text-sm text-gray-500 my-auto ml-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
              読込中...
            </div>}
            {!isLoadingRecentAvatars && avatarsToDisplay.length === 0 && !recentAvatarsError && userId && (
              <div className="text-sm text-gray-500 my-auto ml-2">最近の更新はありません</div>
            )}
            {/* Display error message if needed - uncomment and style if required */}
            {recentAvatarsError && <div className="text-sm text-red-500 my-auto ml-2">エラー: {recentAvatarsError}</div>}
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