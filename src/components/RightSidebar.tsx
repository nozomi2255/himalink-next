"use client";

import React from "react";
import "./RightSidebar.css";

interface UserUpdate {
  id: string;
  name: string;
  avatarUrl: string;
  lastUpdated: string;
  summary: string;
}

interface RightSidebarProps {
  updates: UserUpdate[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({ updates }) => {
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
        {updates.map((user) => (
          <div key={user.id} className="user-entry">
            <img src={user.avatarUrl} alt={user.name} className="avatar" />
            <div className="info">
              <div className="name">{user.name}</div>
              <div className="time">{user.lastUpdated}</div>
              <div className="summary">{user.summary}</div>
            </div>
          </div>
        ))}
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