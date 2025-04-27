"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface RecentEvent {
  event_id: string;
  user_id: string;
  title: string;
  updated_at: string;
  avatar_url: string;
  time_since_update: string;
}

interface GroupedEvents {
  user_id: string;
  avatar_url: string;
  events: RecentEvent[];
  latest_updated_at?: string;
}

interface RightSidebarProps {
  userId?: string; // 現在のユーザーID
}

const formatTimeSince = (timeSince: string) => {
  // PostgreSQLのintervalをパースして時間と分を抽出
  const matches = timeSince.match(/(\d+):(\d+):\d+/);
  if (!matches) return "数分前";

  const hours = parseInt(matches[1]);
  const minutes = parseInt(matches[2]);

  if (hours > 0) {
    return `${hours}時間前`;
  } else if (minutes > 0) {
    return `${minutes}分前`;
  } else {
    return "数分前";
  }
};

const RightSidebar: React.FC<RightSidebarProps> = ({ userId }) => {
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvents[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [visitedUsers, setVisitedUsers] = useState<{[key: string]: {visited: boolean, lastSeenUpdate?: string}}>({});
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // 訪問済みユーザーをローカルストレージから読み込む
    const storedVisitedUsers = localStorage.getItem('visitedUsers');
    if (storedVisitedUsers) {
      setVisitedUsers(JSON.parse(storedVisitedUsers));
    }
  }, []);

  useEffect(() => {
    const fetchRecentEvents = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .rpc('get_recent_followed_events', {
          _follower_id: userId
        });

      if (error) {
        console.error("Error fetching recent events:", error);
        return;
      }

      setRecentEvents(data || []);
      
      // イベントをユーザーごとにグループ化
      const grouped: Record<string, GroupedEvents> = {};
      (data || []).forEach((event: RecentEvent) => {
        if (!grouped[event.user_id]) {
          grouped[event.user_id] = {
            user_id: event.user_id,
            avatar_url: event.avatar_url,
            events: [],
            latest_updated_at: event.updated_at
          };
        }
        
        // 最新の更新日時を追跡
        if (grouped[event.user_id] && 
            (!grouped[event.user_id].latest_updated_at || 
            event.updated_at > grouped[event.user_id].latest_updated_at!)) {
          grouped[event.user_id].latest_updated_at = event.updated_at;
        }
        
        grouped[event.user_id].events.push(event);
      });
      
      setGroupedEvents(Object.values(grouped));
    };

    fetchRecentEvents();

    // 1分ごとに更新
    const interval = setInterval(fetchRecentEvents, 60000);

    return () => clearInterval(interval);
  }, [userId]);

  const toggleExpand = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
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

  // ユーザー訪問の記録
  const handleUserVisit = (userId: string, updatedAt?: string) => {
    setLoadingUserId(userId);
    
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
    
    // ローディング表示を一定時間後に解除（画面遷移のタイミングに合わせる）
    setTimeout(() => {
      setLoadingUserId(null);
    }, 1000);
  };

  return (
    <div className="w-[200px] p-4 border-l border-gray-200 bg-gray-50 flex flex-col gap-4 hidden md:block">
      <div className="flex items-center gap-2 bg-white p-2 rounded shadow-sm">
        <input
          type="text"
          placeholder="ユーザー検索（検索機能は未実装）"
          disabled
          className="w-full border-none outline-none text-sm"
        />
      </div>

      <div className="h-px bg-gray-200 my-2" />

      <div className="flex flex-col gap-3">
        <h3 className="font-semibold">直近の更新</h3>
        {groupedEvents.map((group) => (
          <div key={group.user_id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="flex gap-2.5 p-2 hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => toggleExpand(group.user_id)}
            >
              <div className="flex-shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                {(() => {
                  const isVisited = visitedUsers[group.user_id]?.visited || false;
                  const hasNewContent = hasNewEvent(group.user_id, group.latest_updated_at);
                  const isLoading = loadingUserId === group.user_id;
                  
                  // ボーダースタイルの設定 - 新しいコンテンツがある場合はカラーボーダー
                  const borderStyle = isVisited && !hasNewContent
                    ? 'border-2 border-gray-200' 
                    : 'p-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600';
                  
                  return (
                    <div 
                      className={`relative rounded-full ${borderStyle}`}
                      style={{ width: '42px', height: '42px' }}
                    >
                      <Link 
                        href={`/other-calendar/${group.user_id}`}
                        onClick={() => handleUserVisit(group.user_id, group.latest_updated_at)}
                        className="relative inline-block w-full h-full"
                      >
                        <Avatar 
                          className="inline-flex bg-white cursor-pointer"
                          style={{ width: '38px', height: '38px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                        >
                          <AvatarImage src={group.avatar_url || "/default-avatar.png"} alt="ユーザーアバター" />
                          <AvatarFallback>ユ</AvatarFallback>
                        </Avatar>
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full z-20">
                            <Loader2 className="h-4 w-4 text-white animate-spin" />
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })()}
              </div>
              <div className="flex flex-col justify-center flex-1">
                <div className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {group.events[0].title}
                </div>
                <div className="text-xs text-gray-500">
                  {formatTimeSince(group.events[0].time_since_update)}
                  {group.events.length > 1 && ` (他 ${group.events.length - 1} 件)`}
                </div>
              </div>
            </div>
            
            {expandedUsers.has(group.user_id) && group.events.length > 1 && (
              <div className="pl-12 pr-2 pb-2">
                {group.events.slice(1).map(event => (
                  <div key={event.event_id} className="py-1.5 border-t border-gray-100">
                    <div className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">{event.title}</div>
                    <div className="text-xs text-gray-500">{formatTimeSince(event.time_since_update)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {recentEvents.length === 0 && (
          <div className="text-center text-gray-500 text-sm">
            直近24時間の更新はありません
          </div>
        )}
      </div>

      <div className="mt-auto text-center">
        <button 
          onClick={() => alert("全ての通知を見るへ遷移")}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          全ての通知を見る
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;