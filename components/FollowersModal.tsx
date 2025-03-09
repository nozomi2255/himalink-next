// components/FollowersModal.tsx
"use client";

import React from "react";

interface FollowersModalProps {
  followers: { id: string; username: string; email: string }[];
  onClose: () => void;
  onUserClick: (userId: string) => void;
}

const FollowersModal: React.FC<FollowersModalProps> = ({ followers, onClose, onUserClick }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-80">
        <h2 className="text-xl font-bold">フォロワー</h2>
        <ul className="mt-2">
          {followers.length > 0 ? (
            followers.map((user) => (
              <li key={user.id} className="p-2 border-b cursor-pointer" onClick={() => onUserClick(user.id)}>
                {user.username} ({user.email})
              </li>
            ))
          ) : (
            <p>No followers found.</p>
          )}
        </ul>
        <button onClick={onClose} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded">
          Close
        </button>
      </div>
    </div>
  );
};

export default FollowersModal;