"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import UserAvatar from "./UserAvatar";

interface CalendarHeaderProps {
  userAvatarUrl: string | null;
  userName: string | null;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  searchEmail: string;
  setSearchEmail: (email: string) => void;
  handleSearch: () => void;
}

export default function CalendarHeader({
  userAvatarUrl,
  userName,
  showSearch,
  setShowSearch,
  searchEmail,
  setSearchEmail,
  handleSearch,
}: CalendarHeaderProps) {
  const router = useRouter();
  
  return (
    <div className="absolute top-4 left-4 flex items-center space-x-4">
      <UserAvatar
        avatarUrl={userAvatarUrl}
        username={userName || "?"}
        onClick={() => router.push('/profile')}
        size={40}
      />
      <button onClick={() => setShowSearch(!showSearch)} className="flex items-center bg-gray-300 text-black px-2 py-2 rounded hover:bg-gray-400">
        <MagnifyingGlassIcon className="h-5 w-5" />
      </button>
      {showSearch && (
        <div className="mt-2">
          <input
            type="email"
            placeholder="メールアドレスを入力"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="border p-2 ml-2"
          />
          <button onClick={handleSearch} className="ml-2 bg-blue-500 text-white px-4 py-2 rounded">
            検索
          </button>
        </div>
      )}
    </div>
  );
}