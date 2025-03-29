"use client";

import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import "./RightSidebar.css";

interface UserUpdate {
  id: string;
  name: string;
  avatarUrl: string;
  lastUpdated: string;
  summary: string;
}

interface RightSidebarProps {
  onUserClick: (userId: string) => void;
  updates: UserUpdate[];
  onSearch: (query: string) => void;
  searchResults: UserUpdate[];
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  onUserClick,
  updates,
  onSearch,
  searchResults,
}) => {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="right-sidebar">
      <div className="search-bar">
        <FiSearch className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="ユーザー検索"
        />
      </div>

      {query && (
        <div className="search-results">
          {searchResults.map((user) => (
            <div
              key={user.id}
              className="user-entry"
              onClick={() => onUserClick(user.id)}
            >
              <img src={user.avatarUrl} alt={user.name} className="avatar" />
              <div className="info">
                <div className="name">{user.name}</div>
                <div className="summary">{user.summary}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-divider" />

      <div className="recent-updates">
        <h3>直近の更新</h3>
        {updates.map((user) => (
          <div
            key={user.id}
            className="user-entry"
            onClick={() => onUserClick(user.id)}
          >
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