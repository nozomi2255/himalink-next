// components/FollowersModal.tsx
"use client";

import React, { useState } from "react";
import type { UserRecord } from "../app/types";

interface FollowersModalProps {
  followers: UserRecord[];
}


export default function FollowersModal({ followers }: FollowersModalProps) {
  const [visible, setVisible] = useState(true);

  // 内部でユーザークリック時の処理を定義
  const handleUserClick = (userId: string) => {
    console.log("ユーザーがクリックされました:", userId);
    // ここに必要な内部処理（例: 詳細画面への遷移など）を実装します
  };

  // 内部でモーダルを閉じる処理を定義
  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-80">
        <h2 className="text-xl font-bold">フォロワー</h2>
        <ul className="mt-2">
          {followers.length > 0 ? (
            followers.map((user) => (
              <li key={user.id} 
              className="p-2 border-b cursor-pointer" 
              onClick={() => handleUserClick(user.id)}
              >
                {user.username} ({user.email})
              </li>
            ))
          ) : (
            <p>No followers found.</p>
          )}
        </ul>
        <button 
          onClick={handleClose} 
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}