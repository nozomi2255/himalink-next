"use client";

import React from "react";

interface FollowingModalProps {
  followingUsers: { id: string; username: string }[];
  onClose: () => void;
  onUserClick: (userId: string) => void;
}

const FollowingModal: React.FC<FollowingModalProps> = ({ followingUsers, onClose, onUserClick }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-80">
        <h2 className="text-xl font-bold">フォロー中</h2>
        <ul className="mt-2">
          {followingUsers.length > 0 ? (
            followingUsers.map((user) => (
              <li key={user.id} className="p-2 border-b cursor-pointer" onClick={() => onUserClick(user.id)}>
                {user.username}
              </li>
            ))
          ) : (
            <p>No following users.</p>
          )}
        </ul>
        <button onClick={onClose} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded">
          Close
        </button>
      </div>
    </div>
  );
};

export default FollowingModal;
