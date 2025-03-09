"use client";

import React from "react";

interface UserSearchModalProps {
  searchResults: { id: string; username: string; email: string }[];
  onClose: () => void;
  onUserClick: (userId: string) => void;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ searchResults, onClose, onUserClick }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-80">
        <h2 className="text-xl font-bold">検索結果</h2>
        <ul className="mt-2">
          {searchResults.length > 0 ? (
            searchResults.map((user) => (
              <li key={user.id} className="p-2 border-b cursor-pointer" onClick={() => onUserClick(user.id)}>
                {user.username} ({user.email})
              </li>
            ))
          ) : (
            <p>ユーザーが見つかりませんでした。</p>
          )}
        </ul>
        <button onClick={onClose} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded">
          閉じる
        </button>
      </div>
    </div>
  );
};

export default UserSearchModal;
