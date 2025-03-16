"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import UserAvatar from "./UserAvatar";
import UserSearchModal from "./UserSearchModal";
import type { UserRecord } from "../app/types";

interface CalendarHeaderProps {
  userAvatarUrl: string | null;
  userName: string | null;
  showSearch: boolean;
  followingUsers: UserRecord[];
  followers: UserRecord[];
}

export default function CalendarHeader({
  userAvatarUrl,
  userName,
  showSearch,
  followingUsers,
  followers,
}: CalendarHeaderProps) {

  const router = useRouter();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);

  // アバターがクリックされたときの処理（プロフィール画面へ遷移）
  const handleAvatarClick = () => {
    router.push('/profile');
  };

  // 検索ボタンがクリックされたときの処理（ここでは例としてコンソールに出力）
  const handleSearchButtonClick = () => {
    console.log("検索モーダルを開く処理を実行します");
    setIsSearchModalOpen(true);
  };

  // 内部でモーダルを閉じる処理を定義
  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
  };

  // フォロー中ボタン：フォロー中モーダルを開く（内部処理例）
  const handleFollowingButtonClick = () => {
    console.log("フォロー中モーダルを開く処理を実行します");
    setIsFollowingModalOpen(true);
  };

  const handleCloseFollowingModal = () => {
    setIsFollowingModalOpen(false);
  };

  // フォロワーボタン：フォロワーモーダルを開く（内部処理例）
  const handleFollowersButtonClick = () => {
    console.log("フォロワーモーダルを開く処理を実行します");
    setIsFollowersModalOpen(true);
  };

  const handleCloseFollowersModal = () => {
    setIsFollowersModalOpen(false);
  };
  
  return (
    <>
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
                  onClick={handleSearchButtonClick}
                  className="flex items-center bg-gray-300 text-black px-2 py-2 rounded hover:bg-gray-400"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </div>
      )}

      {/* フォロー中/フォロワーボタンを CalendarHeader 内に追加 */}
      <div className="ml-4 flex space-x-2">
          <button 
            onClick={handleFollowingButtonClick}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            フォロー中 ({followingUsers.length})
          </button>
          <button 
            onClick={handleFollowersButtonClick}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            フォロワー ({followers.length})
          </button>
        </div>
    </div>

    {/* 以下、各モーダルの表示：必要に応じて実装 */}
    {isSearchModalOpen && (
      <UserSearchModal 
        initialSearchEmail="" 
        searchResults={[]} 
        onClose={handleCloseSearchModal}
      />
    )}

    {/* ここではフォロー中/フォロワーのモーダルも内部で管理する例として */}
    {isFollowingModalOpen && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-80">
          <h2 className="text-xl font-bold">フォロー中</h2>
          {/* followingUsers を一覧表示する処理 */}
          <ul className="mt-2">
            {followingUsers.length > 0 ? (
              followingUsers.map(user => (
                <li key={user.id} className="p-2 border-b">
                  {user.username} ({user.email})
                </li>
              ))
            ) : (
              <p>フォロー中のユーザーはありません</p>
            )}
          </ul>
          <button
            onClick={handleCloseFollowingModal}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    )}

    {isFollowersModalOpen && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-80">
          <h2 className="text-xl font-bold">フォロワー</h2>
          {/* followers を一覧表示する処理 */}
          <ul className="mt-2">
            {followers.length > 0 ? (
              followers.map(user => (
                <li key={user.id} className="p-2 border-b">
                  {user.username} ({user.email})
                </li>
              ))
            ) : (
              <p>フォロワーはありません</p>
            )}
          </ul>
          <button
            onClick={handleCloseFollowersModal}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    )}
    </>
  )
}