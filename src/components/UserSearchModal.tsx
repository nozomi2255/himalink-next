"use client";

import React, { useState } from "react";
import type { UserRecord } from "../app/types";

interface UserSearchModalProps {
  initialSearchEmail: string;
  searchResults: UserRecord[];
  onClose: () => void;
}

export default function UserSearchModal({
  initialSearchEmail = "",
  searchResults,
  onClose,
}: UserSearchModalProps) {
  // 内部状態として検索文字列を管理
  const [searchEmail, setSearchEmail] = useState(initialSearchEmail);

  // 内部で検索処理を定義
  const handleSearch = () => {
    console.log("検索処理を実行:", searchEmail);
    // 検索APIの呼び出しなどのロジックをここに実装
  };

  // 内部でモーダルのクローズ処理を定義
  const handleClose = () => {
    console.log("モーダルを閉じる処理を実行");
    // モーダルの表示状態を更新する処理をここに実装
  };

  // 内部でユーザークリック時の処理を定義
  const handleUserClick = (userId: string) => {
    console.log("ユーザーがクリックされました:", userId);
    // ユーザー選択時の処理をここに実装
  };
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
                  onClick={() => handleUserClick(user.id)}
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
