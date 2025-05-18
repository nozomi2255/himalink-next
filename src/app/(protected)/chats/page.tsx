"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";

type ChatMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
};

type User = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
};

export default function ChatPage() {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);

  const fetchFollowingUsers = async () => {
    const { data, error } = await supabase.rpc("get_following_users");
    if (!error && data) {
      setFollowingUsers(data);
    }
  };

  const fetchMessages = async () => {
    if (!recipientId) return;
    const { data, error } = await supabase.rpc("get_chat_messages", {
      p_user_id: recipientId,
    });
    if (!error && data) {
      setMessages(data);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !recipientId.trim()) return;
    const { error } = await supabase.rpc("add_chat_message", {
      p_message: newMessage,
      p_recipient_id: recipientId,
    });
    if (!error) {
      setNewMessage("");
      fetchMessages();
    }
  };

  useEffect(() => {
    fetchFollowingUsers();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [recipientId]);

  return (
    <div className="max-w-2xl p-4 mx-auto mt-8 ">
      <div className="mb-4">
        <h2 className="font-semibold mb-2">フォロー中のユーザー:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {followingUsers.map((user) => (
            <Link href={`/chats/${user.id}`} key={user.id}>
              <Card className="flex flex-row items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt="avatar"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                )}
                <span className="truncate font-medium">{user.username || user.full_name}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}