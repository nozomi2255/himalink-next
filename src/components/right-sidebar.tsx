"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

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
  const supabase = createClient();

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
            events: []
          };
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
              <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Link href={`/other-calendar/${group.user_id}`}>
                  <img 
                    src={group.avatar_url || "/default-avatar.png"} 
                    alt="ユーザーアバター" 
                    className="w-10 h-10 rounded-full object-cover cursor-pointer"
                  />
                </Link>
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