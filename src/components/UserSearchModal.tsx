"use client";

import React from "react";

interface UserSearchModalProps {
  searchEmail: string;
  setSearchEmail: (email: string) => void;
  handleSearch: () => void;
  onClose: () => void;
  searchResults: { id: string; username: string; email: string }[];
  onUserClick: (userId: string) => void;
}

export default function UserSearchModal({
  searchEmail,
  setSearchEmail,
  handleSearch,
  onClose,
  searchResults,
  onUserClick,
}: UserSearchModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[999]">
      <div className="bg-white p-6 rounded shadow-lg w-80">
        <h2 className="text-lg font-bold mb-4">ユーザー検索</h2>
        <input
          type="email"
          placeholder="メールアドレスを入力"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="border p-2 w-full mb-4"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            検索
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            キャンセル
          </button>
        </div>
        <div className="mt-4">
          {searchResults.length > 0 ? (
            <ul>
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  onClick={() => onUserClick(user.id)}
                  className="cursor-pointer p-2 border-b hover:bg-gray-100"
                >
                  {user.username} ({user.email})
                </li>
              ))}
            </ul>
          ) : (
            <p>検索結果がありません</p>
          )}
        </div>
      </div>
    </div>
  );
}
