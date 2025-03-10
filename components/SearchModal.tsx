"use client";

import React from "react";

interface SearchModalProps {
  searchEmail: string;
  setSearchEmail: (email: string) => void;
  handleSearch: () => void;
  onClose: () => void;
}

export default function SearchModal({
  searchEmail,
  setSearchEmail,
  handleSearch,
  onClose,
}: SearchModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999]">
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
      </div>
    </div>
  );
}