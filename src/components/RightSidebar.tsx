"use client";

import React, { useEffect, useState } from "react";
import "./RightSidebar.css";
import { createClient } from "@/utils/supabase/client";

interface RecentEvent {
  event_id: string;
  user_id: string;
  title: string;
  updated_at: string;
  avatar_url: string;
  time_since_update: string;
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
    };

    fetchRecentEvents();

    // 1分ごとに更新
    const interval = setInterval(fetchRecentEvents, 60000);

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="right-sidebar">
      <div className="search-bar">
        <input
          type="text"
          placeholder="ユーザー検索（検索機能は未実装）"
          disabled
        />
      </div>

      <div className="section-divider" />

      <div className="recent-updates">
        <h3>直近の更新</h3>
        {recentEvents.map((event) => (
          <div key={event.event_id} className="user-entry">
            <img 
              src={event.avatar_url || "/default-avatar.png"} 
              alt="ユーザーアバター" 
              className="avatar"
            />
            <div className="info">
              <div className="title">{event.title}</div>
              <div className="time">{formatTimeSince(event.time_since_update)}</div>
            </div>
          </div>
        ))}
        {recentEvents.length === 0 && (
          <div className="no-updates">
            直近24時間の更新はありません
          </div>
        )}
      </div>

      <div className="view-all">
        <button onClick={() => alert("全ての通知を見るへ遷移")}>
          全ての通知を見る
        </button>
      </div>
    </div>
  );
};

export default RightSidebar;