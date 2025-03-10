// components/UserAvatar.tsx
"use client";

import React from "react";
import Image from "next/image";

interface UserAvatarProps {
  avatarUrl?: string | null;
  username: string;
  onClick?: () => void;
  size?: number;
}

export default function UserAvatar({
  avatarUrl,
  username,
  onClick,
  size = 80, // デフォルトサイズ80px
}: UserAvatarProps) {
  return (
    <button onClick={onClick} className="focus:outline-none">
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${username}のプロフィール画像`}
          width={size}
          height={size}
          className="rounded-full object-cover"
        />
      ) : (
        <div
          style={{ width: `${size}px`, height: `${size}px` }}
          className={`rounded-full flex items-center justify-center bg-gray-300`}
        >
          <span className="text-xl font-bold">
            {username.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </button>
  );
}