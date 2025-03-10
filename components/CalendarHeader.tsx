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
  onAvatarClick?: () => void;
  onSearchModalOpen: () => void;
}

export default function CalendarHeader({
  userAvatarUrl,
  userName,
  showSearch,
  onAvatarClick,
  onSearchModalOpen,
}: CalendarHeaderProps) {
  const router = useRouter();

  // onAvatarClick が渡されていない場合は、デフォルトでプロフィール設定へ遷移する
  const handleAvatarClick = onAvatarClick || (() => router.push('/profile'));
  
  return (
    <div className="absolute top-4 left-4 flex items-center space-x-4">
      <UserAvatar
        avatarUrl={userAvatarUrl}
        username={userName || "?"}
        onClick={handleAvatarClick}
        size={60}
      />

      {showSearch && (
              <div className="mt-2">
                <button 
                  onClick={onSearchModalOpen}
                  className="flex items-center bg-gray-300 text-black px-2 py-2 rounded hover:bg-gray-400"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </div>
      )}
    </div>
  )
}