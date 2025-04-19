"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

interface UserAvatarProps {
  userId: string;
  onClick?: () => void;
  size?: number;
}

export default function UserAvatar({
  userId,
  onClick,
  size = 50,
}: UserAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("ユーザー");

  useEffect(() => {
    const fetchAvatarUrl = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_user_avatar", {
        user_id: userId,
      });
      
      if (error) {
        console.error("Failed to fetch user avatar info:", error.message);
      } else if (data && data.length > 0) {
        console.log("RPC result:", data);
        setAvatarUrl(data[0].avatar_url);
        setUsername(data[0].username);
      }
      
    };

    fetchAvatarUrl();
  }, [userId]);

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
          className="rounded-full flex items-center justify-center bg-gray-300"
        >
          <span className="text-xl font-bold">
            {username.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </button>
  );
}