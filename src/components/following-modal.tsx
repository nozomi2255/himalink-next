"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { UserRecord } from "../app/types";

interface FollowingModalProps {
  followingUsers: UserRecord[];
  onClose: () => void;
}

export default function FollowingModal({ followingUsers, onClose }: FollowingModalProps) {
  const router = useRouter();

  // ユーザークリック時の処理を定義
  const handleUserClick = (userId: string) => {
    router.push(`/${userId}`);
    onClose(); // モーダルを閉じる
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white p-6 rounded shadow-lg w-80 relative z-10">
        <h2 className="text-xl font-bold">フォロー中</h2>
        <ul className="mt-2">
          {followingUsers.length > 0 ? (
            followingUsers.map((user) => (
              <li 
                key={user.id} 
                className="p-2 border-b cursor-pointer hover:bg-gray-100" 
                onClick={() => handleUserClick(user.id)}
              >
                {user.username}
              </li>
            ))
          ) : (
            <p>フォローしているユーザーはいません</p>
          )}
        </ul>
        <button 
          onClick={onClose} 
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
